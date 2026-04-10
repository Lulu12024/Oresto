from rest_framework import serializers
from .models import User, Role, Permission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'nom', 'description']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'nom', 'description']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.nom', read_only=True)
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'login', 'first_name', 'last_name', 'nom_complet',
                  'email', 'telephone', 'role', 'is_activite', 'date_joined']

    def get_nom_complet(self, obj):
        return obj.get_full_name()


class MeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.nom', read_only=True)
    restaurant = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'login', 'first_name', 'last_name', 'email',
                  'telephone', 'role', 'is_super_admin', 'restaurant', 'date_joined']

    def get_restaurant(self, obj):
        if obj.restaurant:
            return {
                'id': str(obj.restaurant.id),
                'nom': obj.restaurant.nom,
                'logo_url': obj.restaurant.logo_url,
                'couleur_primaire': obj.restaurant.couleur_primaire,
                'statut': obj.restaurant.statut,
            }
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.IntegerField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['login', 'password', 'first_name', 'last_name', 'telephone', 'email', 'role_id']

    def create(self, validated_data):
        role_id = validated_data.pop('role_id')
        password = validated_data.pop('password')
        role = Role.objects.get(id=role_id)
        return User.objects.create_user(password=password, role=role, **validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.IntegerField(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'telephone', 'role_id']

    def update(self, instance, validated_data):
        role_id = validated_data.pop('role_id', None)
        if role_id:
            instance.role = Role.objects.get(id=role_id)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=6)
