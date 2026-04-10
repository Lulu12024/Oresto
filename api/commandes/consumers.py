import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class RestaurantConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer — une room par restaurant.
    URL: ws://host/ws/restaurant/<restaurant_id>/
    """
    async def connect(self):
        self.restaurant_id = self.scope['url_route']['kwargs']['restaurant_id']
        self.room_group_name = f'restaurant_{self.restaurant_id}'

        # Vérifier que l'utilisateur a accès à ce restaurant
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        user_restaurant_id = str(getattr(user, 'restaurant_id', None) or '')
        is_super = getattr(user, 'is_super_admin', False)

        if not is_super and user_restaurant_id != self.restaurant_id:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Ping/pong keepalive
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    # ── Event handlers (envoyés depuis le backend) ──────────────────

    async def new_order(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'data': event['data'],
        }))

    async def order_ready(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_ready',
            'data': event['data'],
        }))

    async def order_accepted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_accepted',
            'data': event['data'],
        }))

    async def order_rejected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_rejected',
            'data': event['data'],
        }))

    async def order_cancelled(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_cancelled',
            'data': event['data'],
        }))

    async def stock_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stock_alert',
            'data': event['data'],
        }))

    async def mvt_validated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'mvt_validated',
            'data': event['data'],
        }))

    async def notification(self, event):
        await self.send(text_data=json.dumps({
            'type': event.get('notification_type', 'notification'),
            'data': event['data'],
        }))


def send_notification_to_restaurant(restaurant_id: str, event_type: str, data: dict):
    """Envoie une notification WebSocket à tous les membres du restaurant."""
    channel_layer = get_channel_layer()
    group_name = f'restaurant_{restaurant_id}'
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': event_type.replace('-', '_'),
            'data': data,
        }
    )
