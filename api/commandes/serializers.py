from rest_framework import serializers
from .models import Table, Plat, Commande, CommandePlat, Facture, Notification


class TableSerializer(serializers.ModelSerializer):
    qr_token = serializers.UUIDField(read_only=True)

    class Meta:
        model = Table
        fields = ['id', 'numero', 'capacite', 'statut', 'montant_total',
                  'description', 'date_ouverture', 'date_cloture', 'qr_token']
        read_only_fields = ['statut', 'montant_total', 'date_ouverture', 'date_cloture', 'qr_token']


class PlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plat
        fields = ['id', 'nom', 'ingredients', 'prix', 'disponible', 'description', 'categorie', 'image_url']


class PlatCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plat
        fields = ['nom', 'ingredients', 'prix', 'disponible', 'description', 'categorie', 'image_url']


class CommandePlatSerializer(serializers.ModelSerializer):
    plat_nom = serializers.CharField(source='plat.nom', read_only=True)
    plat_id = serializers.IntegerField(source='plat.id', read_only=True)

    class Meta:
        model = CommandePlat
        fields = ['plat_id', 'plat_nom', 'quantite', 'prix_unitaire']


class OrderSerializer(serializers.ModelSerializer):
    items = CommandePlatSerializer(source='commandeplat_set', many=True, read_only=True)
    table_num = serializers.CharField(source='table.numero', read_only=True)
    table_id = serializers.IntegerField(source='table.id', read_only=True)
    serveur_nom = serializers.SerializerMethodField()
    cuisinier_nom = serializers.SerializerMethodField()
    order_id = serializers.CharField(read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'order_id', 'table_id', 'table_num', 'statut', 'source', 'nom_client',
            'prix_total', 'observations', 'items',
            'serveur_nom', 'cuisinier_nom',
            'date_commande', 'date_acceptation', 'date_livraison',
            'motif_rejet', 'motif_annulation',
        ]

    def get_serveur_nom(self, obj):
        return obj.serveur.get_full_name() if obj.serveur else 'Client QR'

    def get_cuisinier_nom(self, obj):
        return obj.cuisinier.get_full_name() if obj.cuisinier else ''


class OrderCreateSerializer(serializers.Serializer):
    table_id = serializers.IntegerField()
    items = serializers.ListField(child=serializers.DictField())
    obs = serializers.CharField(required=False, allow_blank=True, default='')


class InvoiceSerializer(serializers.ModelSerializer):
    table_num = serializers.CharField(source='table.numero', read_only=True)
    serveur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'numero_facture', 'table_num', 'montant_total',
            'montant_paye', 'pourboire', 'mode_paiement',
            'date_generation', 'serveur_nom',
        ]

    def get_serveur_nom(self, obj):
        return obj.serveur.get_full_name() if obj.serveur else ''


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'titre', 'message', 'data', 'lu', 'date_creation']
