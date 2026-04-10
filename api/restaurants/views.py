from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Restaurant, Plan, Abonnement
from .serializers import (
    RestaurantSerializer, RestaurantCreateSerializer,
    PlanSerializer, AbonnementSerializer,
)


class IsSuperAdmin(IsAuthenticated):
    """Permission : uniquement les super admins de la plateforme"""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, 'is_super_admin', False) or getattr(request.user, 'is_staff', False)


class RestaurantViewSet(viewsets.ModelViewSet):
    """
    CRUD restaurants — réservé aux super admins Oresto
    POST /api/admin/restaurants/           → créer restaurant + admin
    GET  /api/admin/restaurants/           → liste tous les restaurants
    GET  /api/admin/restaurants/{id}/      → détail
    PUT  /api/admin/restaurants/{id}/      → modifier
    POST /api/admin/restaurants/{id}/suspend/  → suspendre
    POST /api/admin/restaurants/{id}/activate/ → activer
    """
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
        """GET /api/admin/restaurants/stats/ → KPIs globaux"""
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
    queryset = Plan.objects.all()
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
        """Renouveler un abonnement"""
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
