import io, qrcode
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.http import HttpResponse
from decimal import Decimal

from .models import Table, Plat, Commande, CommandePlat, Facture, Notification
from .serializers import (
    TableSerializer, PlatSerializer, PlatCreateSerializer,
    OrderSerializer, OrderCreateSerializer,
    InvoiceSerializer, NotificationSerializer,
)
from users.permissions import (
    IsServeurOrAbove, IsCuisinierOrAbove, IsGerantOrAdmin,
    IsManagerOrAdmin, IsAdministrateur,
)
from audit.utils import log_action


def get_restaurant(request):
    """Retourne le restaurant de l'utilisateur connecté."""
    return request.user.restaurant


# ==================== TABLE ====================

class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        return Table.objects.filter(restaurant=restaurant).order_by('numero')

    def perform_create(self, serializer):
        serializer.save(restaurant=get_restaurant(self.request))

    @action(detail=True, methods=['post'])
    def qr(self, request, pk=None):
        table = self.get_object()
        qr_url = f"{request.scheme}://{request.get_host()}/scan/{table.qr_token}"
        img = qrcode.make(qr_url)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return HttpResponse(buf, content_type='image/png')

    @action(detail=True, methods=['get'])
    def qr_info(self, request, pk=None):
        """GET /api/tables/{id}/qr_info/ — retourne le token et l'URL du QR code"""
        from django.conf import settings as conf_settings
        table = self.get_object()
        frontend_url = getattr(conf_settings, 'FRONTEND_URL', 'http://localhost:3000')
        return Response({
            'table_id': table.id,
            'table_numero': table.numero,
            'qr_token': str(table.qr_token),
            'qr_url': f"{frontend_url}/scan/{table.qr_token}",
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        table = self.get_object()
        table.statut = 'DISPONIBLE'
        table.save()
        return Response(TableSerializer(table).data)


# ==================== PLAT ====================

class PlatViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        qs = Plat.objects.filter(restaurant=restaurant)
        cat = self.request.query_params.get('categorie')
        if cat:
            qs = qs.filter(categorie=cat)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nom__icontains=search)
        return qs.order_by('categorie', 'nom')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PlatCreateSerializer
        return PlatSerializer

    def perform_create(self, serializer):
        serializer.save(restaurant=get_restaurant(self.request))

    @action(detail=False, methods=['get'])
    def categories(self, request):
        restaurant = get_restaurant(request)
        cats = Plat.objects.filter(restaurant=restaurant).values_list('categorie', flat=True).distinct()
        return Response(sorted(set(c for c in cats if c)))


# ==================== ORDER ====================

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['statut', 'table']
    search_fields = ['order_id']
    ordering_fields = ['date_commande']

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        qs = Commande.objects.filter(table__restaurant=restaurant).select_related(
            'table', 'serveur', 'cuisinier'
        ).prefetch_related('commandeplat_set__plat')
        table_id = self.request.query_params.get('table_id')
        if table_id:
            qs = qs.filter(table_id=table_id)
        return qs.order_by('-date_commande', '-heure_commande')

    def perform_create(self, serializer):
        serializer.save(serveur=self.request.user)

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restaurant = get_restaurant(request)

        table_id = serializer.validated_data['table_id']
        items = serializer.validated_data['items']
        obs = serializer.validated_data.get('obs', '')

        try:
            table = Table.objects.get(id=table_id, restaurant=restaurant)
        except Table.DoesNotExist:
            return Response({'detail': 'Table introuvable'}, status=404)

        with transaction.atomic():
            commande = Commande.objects.create(
                table=table,
                serveur=request.user,
                observations=obs,
                statut='EN_ATTENTE_ACCEPTATION',
                source='serveur',
            )
            total = Decimal('0.00')
            for item in items:
                try:
                    plat = Plat.objects.get(id=item['plat_id'], restaurant=restaurant)
                except Plat.DoesNotExist:
                    commande.delete()
                    return Response({'detail': f"Plat {item['plat_id']} introuvable"}, status=400)
                qte = int(item.get('qte', 1))
                CommandePlat.objects.create(
                    commande=commande, plat=plat,
                    quantite=qte, prix_unitaire=plat.prix,
                )
                total += plat.prix * qte
            commande.prix_total = total
            commande.save()

            if table.statut == 'DISPONIBLE':
                table.statut = 'RESERVEE'
                table.save()

        log_action(request.user, 'CREATE', 'Commande', f"Commande {commande.order_id}", 'commande', commande.id, request)
        return Response(OrderSerializer(commande).data, status=201)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        commande = self.get_object()
        if commande.statut != 'EN_ATTENTE_ACCEPTATION':
            return Response({'detail': 'Statut invalide'}, status=400)
        commande.statut = 'EN_PREPARATION'
        commande.cuisinier = request.user
        commande.date_acceptation = timezone.now()
        commande.save()
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        commande = self.get_object()
        motif = request.data.get('motif', '')
        if commande.statut != 'EN_ATTENTE_ACCEPTATION':
            return Response({'detail': 'Statut invalide'}, status=400)
        commande.statut = 'REJETEE'
        commande.motif_rejet = motif
        commande.save()
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def ready(self, request, pk=None):
        commande = self.get_object()
        if commande.statut != 'EN_PREPARATION':
            return Response({'detail': 'Statut invalide'}, status=400)
        commande.statut = 'EN_ATTENTE_LIVRAISON'
        commande.date_preparation = timezone.now()
        commande.save()
        if commande.serveur:
            Notification.objects.create(
                user=commande.serveur, type='order_ready',
                titre=f"Commande prête — Table {commande.table.numero}",
                message=f"Commande {commande.order_id} prête à servir",
                data={'order_id': commande.order_id, 'table_id': commande.table.id, 'table_num': commande.table.numero}
            )
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        commande = self.get_object()
        if commande.statut != 'EN_ATTENTE_LIVRAISON':
            return Response({'detail': 'Statut invalide'}, status=400)
        commande.statut = 'EN_ATTENTE_PAIEMENT'
        commande.date_livraison = timezone.now()
        commande.save()
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        commande = self.get_object()
        motif = request.data.get('motif', '')
        if not motif:
            return Response({'detail': 'Motif obligatoire'}, status=400)
        role_nom = (request.user.role.nom if request.user.role else '')
        if commande.statut == 'EN_ATTENTE_ACCEPTATION' and 'Serveur' in role_nom:
            pass
        elif commande.statut in ['EN_ATTENTE_ACCEPTATION', 'EN_PREPARATION'] and role_nom in ['Gérant', 'Manager', 'Administrateur']:
            pass
        else:
            return Response({'detail': 'Action non autorisée pour ce statut/rôle'}, status=403)
        commande.statut = 'ANNULEE'
        commande.motif_annulation = motif
        commande.save()
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Enregistrer le paiement et générer la facture"""
        commande = self.get_object()
        if commande.statut != 'EN_ATTENTE_PAIEMENT':
            return Response({'detail': 'Commande non en attente de paiement'}, status=400)

        mode = request.data.get('mode_paiement', 'especes')
        montant_paye = Decimal(str(request.data.get('montant_paye', commande.prix_total)))
        pourboire = Decimal(str(request.data.get('pourboire', '0')))

        with transaction.atomic():
            commande.statut = 'PAYEE'
            commande.is_paid = True
            commande.date_paiement = timezone.now()
            commande.save()

            # Clôturer la table si toutes les commandes sont payées
            table = commande.table
            unpaid = Commande.objects.filter(
                table=table,
                statut__in=['EN_ATTENTE_ACCEPTATION', 'EN_PREPARATION', 'EN_ATTENTE_LIVRAISON', 'EN_ATTENTE_PAIEMENT']
            ).exclude(id=commande.id).count()
            if not unpaid:
                table.statut = 'DISPONIBLE'
                table.save()

            # Générer la facture
            import time
            numero = f"FAC-{int(time.time())}-{commande.id}"
            facture = Facture.objects.create(
                numero_facture=numero,
                table=commande.table,
                serveur=request.user,
                montant_total=commande.prix_total,
                montant_paye=montant_paye,
                pourboire=pourboire,
                mode_paiement=mode,
            )
            facture.commandes.add(commande)

        log_action(request.user, 'CREATE', 'Facture', f"Facture {numero}", 'facture', facture.id, request)
        return Response({'facture_id': facture.id, 'numero': numero}, status=201)


# ==================== INVOICE ====================

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        return Facture.objects.filter(table__restaurant=restaurant).order_by('-date_generation')

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Génère le PDF de la facture avec en-tête du restaurant (logo, infos)."""
        facture = self.get_object()
        restaurant = facture.table.restaurant

        # Collecter les lignes de la facture
        items = []
        for commande in facture.commandes.all():
            for cp in commande.commandeplat_set.select_related('plat').all():
                items.append({
                    'nom': cp.plat.nom,
                    'qte': cp.quantite,
                    'prix': cp.prix_unitaire,
                })

        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import mm

            buffer = io.BytesIO()
            TICKET_WIDTH = 80 * mm
            TICKET_HEIGHT = 250 * mm
            LH = 4 * mm
            MARGIN = 5 * mm

            p = canvas.Canvas(buffer, pagesize=(TICKET_WIDTH, TICKET_HEIGHT))
            y = TICKET_HEIGHT - MARGIN

            def center(text, size=8, bold=False):
                nonlocal y
                p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
                p.drawCentredString(TICKET_WIDTH / 2, y, str(text))
                y -= LH * 1.2

            def row(left, right, size=7, bold=False):
                nonlocal y
                p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
                p.drawString(MARGIN, y, str(left))
                p.drawRightString(TICKET_WIDTH - MARGIN, y, str(right))
                y -= LH

            def sep():
                nonlocal y
                p.setFont("Helvetica", 6)
                p.drawCentredString(TICKET_WIDTH / 2, y, "- " * 22)
                y -= LH

            # ── Logo du restaurant ──────────────────────────────────────
            logo_url = restaurant.logo_url
            if logo_url:
                try:
                    import urllib.request
                    import io as io_mod
                    from reportlab.lib.utils import ImageReader
                    with urllib.request.urlopen(logo_url, timeout=3) as resp:
                        logo_data = io_mod.BytesIO(resp.read())
                    logo_img = ImageReader(logo_data)
                    logo_w = 28 * mm
                    logo_h = 14 * mm
                    logo_x = (TICKET_WIDTH - logo_w) / 2
                    p.drawImage(logo_img, logo_x, y - logo_h, width=logo_w, height=logo_h,
                                preserveAspectRatio=True, mask='auto')
                    y -= logo_h + LH * 0.5
                except Exception:
                    pass  # Logo indisponible → on continue

            # ── En-tête restaurant ──────────────────────────────────────
            center(restaurant.nom.upper(), size=11, bold=True)
            if restaurant.adresse:
                center(restaurant.adresse[:50], size=6)
            addr2 = ' '.join(filter(None, [restaurant.ville, restaurant.pays]))
            if addr2:
                center(addr2, size=6)
            if restaurant.telephone:
                center(f"Tél : {restaurant.telephone}", size=6)
            if restaurant.email:
                center(restaurant.email[:40], size=6)

            sep()

            # ── Détails facture ─────────────────────────────────────────
            center("REÇU DE VENTE", size=9, bold=True)
            row("Ticket  :", facture.numero_facture[-16:], size=7)
            row("Table   :", str(facture.table.numero), size=7)
            row("Date    :", facture.date_generation.strftime('%d/%m/%Y %H:%M'), size=7)
            if facture.serveur:
                row("Serveur :", facture.serveur.get_full_name()[:20], size=7)
            sep()

            # ── Articles ────────────────────────────────────────────────
            row("Qté  Article", "Prix", size=7, bold=True)
            sep()
            for item in items:
                total_item = float(item['prix']) * item['qte']
                label = f"{item['qte']}x {str(item['nom'])[:20]}"
                row(label, f"{total_item:,.0f} F", size=7)

            sep()

            # ── Totaux ──────────────────────────────────────────────────
            if facture.pourboire and float(facture.pourboire) > 0:
                row("Sous-total :", f"{float(facture.montant_total):,.0f} F", size=7)
                row("Pourboire  :", f"{float(facture.pourboire):,.0f} F", size=7)
            row("TOTAL :", f"{float(facture.montant_paye):,.0f} FCFA", size=10, bold=True)
            row("Paiement :", facture.get_mode_paiement_display(), size=7)

            sep()
            center("Merci de votre visite !", size=8, bold=True)
            center("Plateforme Oresto", size=6)

            p.showPage()
            p.save()
            buffer.seek(0)

            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = (
                f'inline; filename="facture-{facture.numero_facture}.pdf"'
            )
            return response

        except ImportError:
            return Response({'detail': 'ReportLab non installé'}, status=500)
        except Exception as e:
            return Response({'detail': f'Erreur génération PDF : {str(e)}'}, status=500)


# ==================== NOTIFICATION ====================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-date_creation')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.lu = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        Notification.objects.filter(user=request.user, lu=False).update(lu=True)
        return Response({'detail': 'Toutes les notifications marquées comme lues'})
