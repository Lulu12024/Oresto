import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from commandes.consumers import RestaurantConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_management.settings')

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    # Chaque restaurant a sa propre room WebSocket
    re_path(r'ws/restaurant/(?P<restaurant_id>[^/]+)/$', RestaurantConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
