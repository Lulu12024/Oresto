from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Auth views
from users.views import login, logout, me, change_password

# ViewSets
from users.views import UserViewSet, RoleViewSet, PermissionViewSet
from commandes.views import TableViewSet, PlatViewSet, OrderViewSet, InvoiceViewSet, NotificationViewSet
from stocks.views import ProductViewSet, UniteViewSet, StockViewSet, MovementViewSet, DemandeProduitViewSet
from audit.views import AuditLogViewSet, RapportViewSet, FormatExportViewSet
from audit.reports import ReportsViewSet

# ==================== ROUTER ====================

router = DefaultRouter()
router.register(r'tables', TableViewSet, basename='table')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'plats', PlatViewSet, basename='plat')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'movements', MovementViewSet, basename='movement')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'reports', ReportsViewSet, basename='report')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'unites', UniteViewSet, basename='unite')
router.register(r'stocks', StockViewSet, basename='stock')
router.register(r'demandes', DemandeProduitViewSet, basename='demande-produit')

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────────
    path('api/auth/login/',           login,           name='login'),
    path('api/auth/logout/',          logout,          name='logout'),
    path('api/auth/me/',              me,              name='me'),
    path('api/auth/change-password/', change_password, name='change-password'),

    # ── API REST principale (filtrée par restaurant de l'user) ────────
    path('api/', include(router.urls)),

    # ── Administration Oresto (super admins uniquement) ───────────────
    path('api/admin/', include('restaurants.urls')),

    # ── API Publique — QR Code (sans authentification) ────────────────
    path('api/public/', include('public_api.urls')),

    # ── Schéma / Swagger ─────────────────────────────────────────────
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
