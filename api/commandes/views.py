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

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        """GET /api/tables/{id}/qr/ — génère le QR code PNG de la table"""
        table = self.get_object()
        frontend_url = __import__('django.conf', fromlist=['settings']).settings.FRONTEND_URL
        qr_url = f"{frontend_url}/scan/{table.qr_token}"

        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(qr_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#1a1a1a", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)
            response = HttpResponse(buf, content_type='image/png')
            response['Content-Disposition'] = f'inline; filename="table-{table.numero}-qr.png"'
            return response
        except ImportError:
            # Fallback si qrcode non installé : retourner l'URL
            return Response({'qr_url': qr_url, 'qr_token': str(table.qr_token)})

    @action(detail=True, methods=['get'])
    def qr_info(self, request, pk=None):
        """GET /api/tables/{id}/qr_info/ — retourne les infos QR (token + URL)"""
        table = self.get_object()
        from django.conf import settings as conf_settings
        frontend_url = getattr(conf_settings, 'FRONTEND_URL', 'http://localhost:3000')
        return Response({
            'table_id': table.id,
            'table_numero': table.numero,
            'qr_token': str(table.qr_token),
            'qr_url': f"{frontend_url}/scan/{table.qr_token}",
        })

    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        table = self.get_object()
        if table.statut != 'DISPONIBLE':
            return Response({'detail': 'Table non disponible'}, status=400)
        table.statut = 'RESERVEE'
        table.date_ouverture = timezone.now()
        table.save()
        log_action(request.user, 'UPDATE', 'Réservation table',
                   f"Table {table.numero} réservée", 'table', table.id, request)
        return Response(TableSerializer(table).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        table = self.get_object()
        if table.statut not in ['RESERVEE']:
            return Response({'detail': 'Impossible d\'annuler cette table'}, status=400)
        table.statut = 'DISPONIBLE'
        table.date_ouverture = None
        table.save()
        log_action(request.user, 'UPDATE', 'Annulation réservation',
                   f"Table {table.numero} annulée", 'table', table.id, request)
        return Response(TableSerializer(table).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        table = self.get_object()
        if table.statut not in ['EN_SERVICE']:
            return Response({'detail': 'La table doit être EN_SERVICE'}, status=400)
        table.statut = 'EN_ATTENTE_PAIEMENT'
        table.date_cloture = timezone.now()
        table.calculer_montant_total()
        log_action(request.user, 'UPDATE', 'Clôture table',
                   f"Table {table.numero} clôturée", 'table', table.id, request)
        return Response(TableSerializer(table).data)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        table = self.get_object()
        if table.statut != 'EN_ATTENTE_PAIEMENT':
            return Response({'detail': 'Table pas en attente de paiement'}, status=400)

        mode = request.data.get('mode_paiement', 'especes')
        montant = Decimal(str(request.data.get('montant', 0)))
        pourboire = Decimal(str(request.data.get('pourboire', 0)))

        total = table.calculer_montant_total()

        # Générer numéro facture unique
        from django.utils import timezone as tz
        date_str = tz.now().strftime('%Y%m%d')
        count = Facture.objects.filter(numero_facture__startswith=f'FAC-{date_str}').count() + 1
        numero = f'FAC-{date_str}-{count:04d}'

        commandes_table = table.commandes.filter(statut='EN_ATTENTE_PAIEMENT')
        if table.date_ouverture:
            commandes_table = commandes_table.filter(date_commande__gte=table.date_ouverture)

        facture = Facture.objects.create(
            numero_facture=numero,
            table=table,
            serveur=request.user,
            montant_total=total,
            montant_paye=montant,
            pourboire=pourboire,
            mode_paiement=mode,
        )
        facture.commandes.set(commandes_table)

        commandes_table.update(statut='PAYEE', is_paid=True)
        table.statut = 'PAYEE'
        table.save()

        log_action(request.user, 'CREATE', 'Paiement table',
                   f"Table {table.numero} payée — Facture {numero}", 'facture', facture.id, request)
        return Response({'facture': InvoiceSerializer(facture).data, 'table': TableSerializer(table).data})


# ==================== PLAT ====================

class PlatViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        qs = Plat.objects.filter(restaurant=restaurant)
        if self.request.query_params.get('disponible'):
            qs = qs.filter(disponible=True)
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
        return Response(list(cats))


# ==================== ORDER ====================

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    ordering = ['-date_commande']

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        qs = Commande.objects.select_related('table', 'serveur', 'cuisinier').filter(
            table__restaurant=restaurant
        )
        if self.request.query_params.get('table_id'):
            qs = qs.filter(table_id=self.request.query_params['table_id'])
        if self.request.query_params.get('status'):
            qs = qs.filter(statut=self.request.query_params['status'])
        if self.request.query_params.get('cuisinier_id'):
            qs = qs.filter(cuisinier_id=self.request.query_params['cuisinier_id'])
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        restaurant = get_restaurant(request)
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        table = Table.objects.get(id=data['table_id'], restaurant=restaurant)
        commande = Commande.objects.create(
            table=table,
            serveur=request.user,
            observations=data.get('obs', ''),
            statut='EN_ATTENTE_ACCEPTATION',
            source='serveur',
        )

        total = Decimal('0.00')
        items_text_parts = []
        for item in data['items']:
            plat = Plat.objects.get(id=item['plat_id'], restaurant=restaurant)
            CommandePlat.objects.create(
                commande=commande, plat=plat,
                quantite=item['qte'], prix_unitaire=plat.prix,
            )
            total += plat.prix * item['qte']
            items_text_parts.append(f"{item['qte']}× {plat.nom}")

        commande.prix_total = total
        commande.save()

        if table.statut in ['DISPONIBLE', 'RESERVEE']:
            table.statut = 'EN_SERVICE'
            table.date_ouverture = table.date_ouverture or timezone.now()
            table.save()

        # Notifier cuisiniers
        from users.models import User
        cuisiniers = User.objects.filter(restaurant=restaurant, role__nom='Cuisinier', is_activite=True)
        items_text = ", ".join(items_text_parts)
        for c in cuisiniers:
            Notification.objects.create(
                user=c, type='new_order',
                titre=f"Nouvelle commande — Table {table.numero}",
                message=items_text,
                data={'order_id': commande.order_id, 'table_id': table.id, 'table_num': table.numero}
            )

        log_action(request.user, 'CREATE', 'Nouvelle commande',
                   f"Commande {commande.order_id} — Table {table.numero}", 'commande', commande.id, request)
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
        if commande.table.statut == 'COMMANDES_PASSEE':
            commande.table.statut = 'EN_SERVICE'
            commande.table.save()
        if commande.serveur:
            Notification.objects.create(
                user=commande.serveur, type='order_accepted',
                titre=f"Commande {commande.order_id} acceptée",
                message=f"Le cuisinier {request.user.get_full_name()} a accepté la commande",
                data={'order_id': commande.order_id, 'table_id': commande.table.id}
            )
        return Response(OrderSerializer(commande).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        commande = self.get_object()
        if commande.statut != 'EN_ATTENTE_ACCEPTATION':
            return Response({'detail': 'Statut invalide'}, status=400)
        motif = request.data.get('motif', '')
        if not motif:
            return Response({'detail': 'Motif obligatoire'}, status=400)
        commande.statut = 'REFUSEE'
        commande.motif_rejet = motif
        commande.save()
        if commande.serveur:
            Notification.objects.create(
                user=commande.serveur, type='order_rejected',
                titre=f"Commande {commande.order_id} refusée",
                message=f"Motif : {motif}",
                data={'order_id': commande.order_id, 'table_id': commande.table.id}
            )
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
        role_nom = (commande.table.restaurant and request.user.role and request.user.role.nom) or ''
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


# ==================== INVOICE ====================

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_restaurant(self.request)
        return Facture.objects.filter(table__restaurant=restaurant).order_by('-date_generation')

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        facture = self.get_object()
        # Générer PDF ticket (reprend la logique existante adaptée Oresto)
        restaurant = facture.table.restaurant
        items = []
        for commande in facture.commandes.all():
            for cp in commande.commandeplat_set.select_related('plat').all():
                items.append({'nom': cp.plat.nom, 'qte': cp.quantite, 'prix': cp.prix_unitaire})

        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import mm
            buffer = io.BytesIO()
            TICKET_WIDTH = 80 * mm
            TICKET_HEIGHT = 200 * mm
            LH = 4 * mm
            MARGIN = 5 * mm
            p = canvas.Canvas(buffer, pagesize=(TICKET_WIDTH, TICKET_HEIGHT))
            y = TICKET_HEIGHT - MARGIN

            def center(text, size=8, bold=False):
                nonlocal y
                font = "Helvetica-Bold" if bold else "Helvetica"
                p.setFont(font, size)
                p.drawCentredString(TICKET_WIDTH / 2, y, text)
                y -= LH * 1.2

            def row(left, right, size=7, bold=False):
                nonlocal y
                font = "Helvetica-Bold" if bold else "Helvetica"
                p.setFont(font, size)
                p.drawString(MARGIN, y, left)
                p.drawRightString(TICKET_WIDTH - MARGIN, y, right)
                y -= LH

            def sep():
                nonlocal y
                p.setFont("Helvetica", 6)
                p.drawCentredString(TICKET_WIDTH / 2, y, "- " * 22)
                y -= LH

            center(restaurant.nom.upper(), size=10, bold=True)
            center("Plateforme Oresto", size=6)
            sep()
            center("REÇU DE VENTE", size=8, bold=True)
            row("Ticket :", facture.numero_facture, size=7)
            row("Table  :", str(facture.table.numero), size=7)
            row("Date   :", facture.date_generation.strftime('%d/%m/%Y  %H:%M'), size=7)
            sep()
            row("Qté  Article", "Prix", size=7, bold=True)
            sep()
            for item in items:
                row(f"{item['qte']}x {item['nom'][:20]}", f"{float(item['prix'])*item['qte']:,.0f} FCFA", size=7)
            sep()
            row("TOTAL :", f"{facture.montant_paye:,.0f} FCFA", size=9, bold=True)
            sep()
            center("Merci de votre visite !", size=7, bold=True)
            center("Oresto — Restaurant Connecté", size=6)
            p.showPage()
            p.save()
            buffer.seek(0)
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{facture.numero_facture}.pdf"'
            return response
        except ImportError:
            return Response(InvoiceSerializer(facture).data)


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
        return Response({'status': 'lu'})

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        Notification.objects.filter(user=request.user, lu=False).update(lu=True)
        return Response({'status': 'ok'})
