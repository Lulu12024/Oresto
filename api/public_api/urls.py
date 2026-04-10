from django.urls import path
from . import views

urlpatterns = [
    path('menu/<uuid:qr_token>/', views.menu_par_qr, name='public-menu'),
    path('order/<uuid:qr_token>/', views.passer_commande_qr, name='public-order'),
]
