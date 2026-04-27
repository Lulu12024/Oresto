from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantViewSet, PlanViewSet, AbonnementViewSet, register_restaurant, upload_logo

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'abonnements', AbonnementViewSet, basename='abonnement')

urlpatterns = [
    path('', include(router.urls)),
    
]
