from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Restaurant, Plan, Abonnement
from .serializers import (
    RestaurantSerializer, RestaurantCreateSerializer, RestaurantSettingsSerializer,
    PlanSerializer, PlanPublicSerializer, AbonnementSerializer,
)


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
