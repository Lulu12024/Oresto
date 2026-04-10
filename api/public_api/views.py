"""
API publique — pas d'authentification requise.
Accessible après scan du QR code sur une table.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal

from commandes.models import Table, Plat, Commande, CommandePlat, Notification
from commandes.consumers import send_notification_to_restaurant


@api_view(['GET'])
@permission_classes([AllowAny])
def menu_par_qr(request, qr_token):
    """
    GET /api/public/menu/<qr_token>/
    Retourne le menu du restaurant et les infos de la table.
    Pas d'authentification requise.
    """
    table = get_object_or_404(Table, qr_token=qr_token)
    restaurant = table.restaurant

    if restaurant.statut != 'actif':
        return Response(
            {'detail': 'Ce restaurant n\'est pas disponible actuellement'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Menu (plats disponibles)
    plats = Plat.objects.filter(restaurant=restaurant, disponible=True).order_by('categorie', 'nom')

    # Grouper par catégorie
    categories = {}
    for plat in plats:
        cat = plat.categorie or 'Autres'
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({
            'id': plat.id,
            'nom': plat.nom,
            'description': plat.description,
            'prix': float(plat.prix),
            'image_url': plat.image_url,
        })

    return Response({
        'restaurant': {
            'nom': restaurant.nom,
            'logo_url': restaurant.logo_url,
            'couleur_primaire': restaurant.couleur_primaire,
        },
        'table': {
            'id': table.id,
            'numero': table.numero,
            'statut': table.statut,
            'qr_token': str(table.qr_token),
        },
        'menu': [
            {'categorie': cat, 'plats': items}
            for cat, items in categories.items()
        ],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def passer_commande_qr(request, qr_token):
    """
    POST /api/public/order/<qr_token>/
    Passer une commande depuis le QR code.
    Body: { "items": [{"plat_id": 1, "qte": 2}], "observations": "...", "nom_client": "..." }
    """
    table = get_object_or_404(Table, qr_token=qr_token)
    restaurant = table.restaurant

    if restaurant.statut != 'actif':
        return Response({'detail': 'Restaurant non disponible'}, status=503)

    if table.statut in ['EN_ATTENTE_PAIEMENT', 'PAYEE', 'FERMEE']:
        return Response(
            {'detail': f'Cette table est en statut {table.statut}, les commandes ne sont pas acceptées'},
            status=status.HTTP_400_BAD_REQUEST
        )

    items = request.data.get('items', [])
    if not items:
        return Response({'detail': 'Aucun article dans la commande'}, status=400)

    observations = request.data.get('observations', '')
    nom_client = request.data.get('nom_client', 'Client')

    # Créer la commande
    commande = Commande.objects.create(
        table=table,
        serveur=None,
        observations=observations,
        statut='EN_ATTENTE_ACCEPTATION',
        source='client_qr',
        nom_client=nom_client,
    )

    total = Decimal('0.00')
    items_text_parts = []
    for item in items:
        try:
            plat = Plat.objects.get(id=item['plat_id'], restaurant=restaurant, disponible=True)
        except Plat.DoesNotExist:
            commande.delete()
            return Response({'detail': f"Plat {item['plat_id']} introuvable"}, status=400)

        qte = int(item.get('qte', 1))
        CommandePlat.objects.create(
            commande=commande,
            plat=plat,
            quantite=qte,
            prix_unitaire=plat.prix,
        )
        total += plat.prix * qte
        items_text_parts.append(f"{qte}× {plat.nom}")

    commande.prix_total = total
    commande.save()

    # Mettre à jour le statut de la table si nécessaire
    if table.statut == 'DISPONIBLE':
        table.statut = 'RESERVEE'
        table.save()

    # Notifier les serveurs et cuisiniers du restaurant
    from users.models import User
    staff = User.objects.filter(
        restaurant=restaurant,
        is_activite=True,
        role__nom__in=['Serveur', 'Cuisinier', 'Gérant', 'Administrateur']
    )
    items_text = ", ".join(items_text_parts)
    for member in staff:
        Notification.objects.create(
            user=member,
            type='new_order',
            titre=f"Nouvelle commande — Table {table.numero}",
            message=f"Commande de {nom_client} : {items_text}",
            data={
                'order_id': commande.order_id,
                'table_id': table.id,
                'table_num': table.numero,
                'source': 'client_qr',
            }
        )

    # Notification WebSocket
    try:
        send_notification_to_restaurant(
            restaurant_id=str(restaurant.id),
            event_type='new_order',
            data={
                'order_id': commande.order_id,
                'table_num': table.numero,
                'source': 'client_qr',
                'nom_client': nom_client,
                'items': items_text,
            }
        )
    except Exception:
        pass

    return Response({
        'success': True,
        'commande_id': commande.order_id,
        'message': f'Votre commande a bien été transmise ! Un serveur va s\'en occuper.',
        'total': float(total),
    }, status=status.HTTP_201_CREATED)
