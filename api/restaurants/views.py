from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Restaurant, Plan, Abonnement
from .serializers import (
    RestaurantSerializer, RestaurantCreateSerializer, RestaurantSettingsSerializer,
    PlanSerializer, PlanPublicSerializer, AbonnementSerializer,
)
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class IsSuperAdmin(IsAuthenticated):
    """Permission : uniquement les super admins de la plateforme"""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, 'is_super_admin', False) or getattr(request.user, 'is_staff', False)


# ─── Vue publique plans (landing page) ────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def public_plans(request):
    """
    GET /api/plans/
    Retourne les plans actifs pour la landing page — sans authentification.
    """
    plans = Plan.objects.filter(is_active=True).order_by('prix_mensuel')
    return Response(PlanPublicSerializer(plans, many=True).data)


# ─── Vue paramètres restaurant (admin du restaurant) ─────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def my_restaurant(request):
    """
    GET  /api/restaurant/my/   → infos du restaurant de l'utilisateur connecté
    PATCH /api/restaurant/my/  → modifier les infos (admin du restaurant seulement)
    """
    user = request.user
    if not user.restaurant:
        return Response({'detail': 'Aucun restaurant associé à cet utilisateur'}, status=404)

    restaurant = user.restaurant

    if request.method == 'GET':
        return Response(RestaurantSettingsSerializer(restaurant).data)

    # PATCH — réservé à l'administrateur du restaurant
    role_nom = (user.role.nom if user.role else '').lower()
    if role_nom not in ['administrateur', 'manager']:
        return Response({'detail': 'Permission refusée'}, status=403)

    serializer = RestaurantSettingsSerializer(restaurant, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([AllowAny])
def register_restaurant(request):
    """
    POST /api/auth/register/
    Auto-inscription d'un restaurant depuis la landing page.
    Crée le restaurant + l'administrateur en une seule requête.
    """
    serializer = RestaurantCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
 
    essai_gratuit = request.data.get('essai_gratuit', True)
 
    restaurant = serializer.save()
 
    # Si essai gratuit forcé et pas de plan → créer abonnement essai sur le 1er plan actif
    if essai_gratuit and not restaurant.plan:
        from django.utils import timezone
        import datetime
        premier_plan = Plan.objects.filter(is_active=True).order_by('prix_mensuel').first()
        if premier_plan:
            restaurant.plan = premier_plan
            restaurant.save()
            Abonnement.objects.get_or_create(
                restaurant=restaurant,
                defaults=dict(
                    plan=premier_plan,
                    statut='essai',
                    date_debut=timezone.now().date(),
                    date_fin=timezone.now().date() + datetime.timedelta(days=30),
                )
            )
 
    return Response({
        'detail': 'Restaurant créé avec succès',
        'slug':   restaurant.slug,
        'nom':    restaurant.nom,
    }, status=status.HTTP_201_CREATED)
 


@api_view(['POST'])
@permission_classes([AllowAny])  # AllowAny pour l'inscription, sinon IsAuthenticated
def upload_logo(request):
    """
    POST /api/upload/logo/
    Reçoit un fichier image et retourne son URL publique.
    Accepte : PNG, JPG, JPEG, WEBP — max 2 Mo
    """
    file = request.FILES.get('logo')
    if not file:
        return Response({'detail': 'Aucun fichier fourni'}, status=400)
 
    # Vérification type
    ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if file.content_type not in ALLOWED_TYPES:
        return Response({'detail': 'Format non supporté. Utilisez PNG, JPG ou WEBP'}, status=400)
 
    # Vérification taille (2 Mo max)
    if file.size > 2 * 1024 * 1024:
        return Response({'detail': 'Fichier trop lourd (max 2 Mo)'}, status=400)
 
    # Nom de fichier sécurisé + unique
    import uuid
    ext = os.path.splitext(file.name)[1].lower()
    filename = f"logos/{uuid.uuid4().hex}{ext}"
 
    # Sauvegarde
    saved_path = default_storage.save(filename, ContentFile(file.read()))
    file_url = request.build_absolute_uri(f'/media/{saved_path}')
 
    return Response({'url': file_url}, status=201)
 
# ─── ViewSets administration (super admin) ────────────────────────────────────

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.prefetch_related('abonnements').all()
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return RestaurantCreateSerializer
        return RestaurantSerializer

    def create(self, request, *args, **kwargs):
        serializer = RestaurantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restaurant = serializer.save()
        return Response(RestaurantSerializer(restaurant).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        restaurant = self.get_object()
        restaurant.statut = 'suspendu'
        restaurant.save()
        return Response({'detail': 'Restaurant suspendu'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        restaurant = self.get_object()
        restaurant.statut = 'actif'
        restaurant.save()
        return Response({'detail': 'Restaurant activé'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count
        total = Restaurant.objects.count()
        actifs = Restaurant.objects.filter(statut='actif').count()
        suspendus = Restaurant.objects.filter(statut='suspendu').count()
        par_plan = Plan.objects.annotate(nb=Count('restaurant')).values('nom', 'nb')
        return Response({
            'total_restaurants': total,
            'actifs': actifs,
            'suspendus': suspendus,
            'par_plan': list(par_plan),
        })


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all().order_by('prix_mensuel')
    serializer_class = PlanSerializer
    permission_classes = [IsSuperAdmin]


class AbonnementViewSet(viewsets.ModelViewSet):
    queryset = Abonnement.objects.select_related('restaurant', 'plan').all()
    serializer_class = AbonnementSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        return qs

    @action(detail=True, methods=['post'])
    def renouveler(self, request, pk=None):
        from datetime import timedelta
        from django.utils import timezone
        abo = self.get_object()
        mois = int(request.data.get('mois', 1))
        if abo.date_fin:
            abo.date_fin = abo.date_fin + timedelta(days=30 * mois)
        else:
            abo.date_fin = timezone.now().date() + timedelta(days=30 * mois)
        abo.statut = 'actif'
        abo.montant_paye += float(abo.plan.prix_mensuel) * mois
        abo.save()
        return Response(AbonnementSerializer(abo).data)
