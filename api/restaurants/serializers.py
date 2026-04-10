from rest_framework import serializers
from .models import Restaurant, Plan, Abonnement


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'nom', 'prix_mensuel', 'description',
            'module_commandes', 'module_stock', 'module_support',
            'is_active',
        ]


class PlanPublicSerializer(serializers.ModelSerializer):
    """Sérialiseur public pour la landing page — moins d'infos exposées"""
    class Meta:
        model = Plan
        fields = [
            'id', 'nom', 'prix_mensuel', 'description',
            'module_commandes', 'module_stock', 'module_support',
        ]


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


class RestaurantSettingsSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les paramètres modifiables par l'admin du restaurant"""
    class Meta:
        model = Restaurant
        fields = [
            'id', 'nom', 'email', 'telephone', 'adresse', 'ville', 'pays',
            'logo_url', 'couleur_primaire',
        ]
        read_only_fields = ['id']


class RestaurantCreateSerializer(serializers.ModelSerializer):
    """Crée un restaurant + son admin en une seule requête"""
    # Champs admin
    admin_login = serializers.CharField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=6)
    admin_first_name = serializers.CharField(write_only=True)
    admin_last_name = serializers.CharField(write_only=True)
    admin_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    # Infos restaurant pour entête facture
    telephone = serializers.CharField(required=False, allow_blank=True, default='')
    adresse = serializers.CharField(required=False, allow_blank=True, default='')
    ville = serializers.CharField(required=False, allow_blank=True, default='')
    logo_url = serializers.URLField(required=False, allow_blank=True, default='')
    # Plan initial
    plan_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Restaurant
        fields = [
            'nom', 'slug', 'email', 'telephone', 'adresse', 'ville', 'pays',
            'logo_url', 'couleur_primaire',
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
        restaurant = Restaurant.objects.create(**validated_data)

        # Associer le plan
        if plan_id:
            try:
                plan = Plan.objects.get(id=plan_id)
                restaurant.plan = plan
                restaurant.save()
                # Créer l'abonnement
                from django.utils import timezone
                import datetime
                Abonnement.objects.create(
                    restaurant=restaurant,
                    plan=plan,
                    statut='essai',
                    date_debut=timezone.now().date(),
                    date_fin=timezone.now().date() + datetime.timedelta(days=30),
                )
            except Plan.DoesNotExist:
                pass

        # Créer l'admin du restaurant
        try:
            role_admin = Role.objects.get(nom='Administrateur')
        except Role.DoesNotExist:
            role_admin = Role.objects.filter(nom__icontains='admin').first()

        User.objects.create_user(
            login=admin_login,
            password=admin_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            email=admin_email,
            role=role_admin,
            restaurant=restaurant,
            is_activite=True,
        )

        return restaurant
