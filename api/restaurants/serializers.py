from rest_framework import serializers
from .models import Restaurant, Plan, Abonnement


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class AbonnementSerializer(serializers.ModelSerializer):
    plan_nom = serializers.CharField(source='plan.nom', read_only=True)
    is_actif = serializers.BooleanField(read_only=True)

    class Meta:
        model = Abonnement
        fields = ['id', 'plan', 'plan_nom', 'statut', 'date_debut', 'date_fin',
                  'montant_paye', 'notes', 'is_actif', 'date_creation']


class RestaurantSerializer(serializers.ModelSerializer):
    plan_nom = serializers.CharField(source='plan.nom', read_only=True)
    abonnement_actif = serializers.SerializerMethodField()
    nb_utilisateurs = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'nom', 'slug', 'email', 'telephone', 'adresse', 'ville', 'pays',
            'logo_url', 'couleur_primaire', 'statut', 'plan', 'plan_nom',
            'abonnement_actif', 'nb_utilisateurs', 'date_creation',
        ]
        read_only_fields = ['id', 'date_creation']

    def get_abonnement_actif(self, obj):
        abo = obj.abonnements.filter(statut__in=['actif', 'essai']).first()
        if abo:
            return AbonnementSerializer(abo).data
        return None

    def get_nb_utilisateurs(self, obj):
        return obj.users.filter(is_activite=True).count()


class RestaurantCreateSerializer(serializers.ModelSerializer):
    """Crée un restaurant + son admin en une seule requête"""
    # Champs admin
    admin_login = serializers.CharField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=6)
    admin_first_name = serializers.CharField(write_only=True)
    admin_last_name = serializers.CharField(write_only=True)
    admin_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    # Plan initial
    plan_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Restaurant
        fields = [
            'nom', 'slug', 'email', 'telephone', 'adresse', 'ville', 'pays',
            'couleur_primaire',
            'admin_login', 'admin_password', 'admin_first_name', 'admin_last_name', 'admin_email',
            'plan_id',
        ]

    def validate_slug(self, value):
        if Restaurant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Ce slug est déjà utilisé")
        return value

    def validate_email(self, value):
        if Restaurant.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé")
        return value

    def create(self, validated_data):
        from users.models import User, Role
        admin_login = validated_data.pop('admin_login')
        admin_password = validated_data.pop('admin_password')
        admin_first_name = validated_data.pop('admin_first_name')
        admin_last_name = validated_data.pop('admin_last_name')
        admin_email = validated_data.pop('admin_email', '')
        plan_id = validated_data.pop('plan_id', None)

        # Créer le restaurant
        plan = Plan.objects.get(id=plan_id) if plan_id else None
        restaurant = Restaurant.objects.create(plan=plan, **validated_data)

        # Créer l'abonnement initial (essai)
        if plan:
            from django.utils import timezone
            from datetime import timedelta
            Abonnement.objects.create(
                restaurant=restaurant,
                plan=plan,
                statut='essai',
                date_debut=timezone.now().date(),
                date_fin=timezone.now().date() + timedelta(days=30),
            )

        # Créer le compte administrateur du restaurant
        try:
            role = Role.objects.get(nom='Administrateur')
        except Role.DoesNotExist:
            role = Role.objects.filter(nom__icontains='admin').first()

        User.objects.create_user(
            login=admin_login,
            password=admin_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            email=admin_email,
            role=role,
            restaurant=restaurant,
        )
        return restaurant
