from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .models import User, Role, Permission
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    RoleSerializer, PermissionSerializer,
    MeSerializer, ChangePasswordSerializer, LoginSerializer,
)
from .permissions import CanManageUsers, IsAdministrateur
from audit.utils import log_action


# ==================== AUTH ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    login_val = serializer.validated_data['login']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(login=login_val)
    except User.DoesNotExist:
        return Response({'detail': 'Identifiants invalides'}, status=401)

    if not user.check_password(password):
        return Response({'detail': 'Identifiants invalides'}, status=401)

    if not user.is_activite:
        return Response({'detail': 'Compte désactivé'}, status=403)

    refresh = RefreshToken.for_user(user)
    log_action(user, 'LOGIN', 'Connexion', f"{user.login} connecté", 'user', user.id, request)

    restaurant_data = None
    if user.restaurant:
        restaurant_data = {
            'id': str(user.restaurant.id),
            'nom': user.restaurant.nom,
            'logo_url': user.restaurant.logo_url,
            'couleur_primaire': user.restaurant.couleur_primaire,
            'statut': user.restaurant.statut,
        }

    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'login': user.login,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': user.role.nom if user.role else '',
            'is_super_admin': user.is_super_admin,
            'restaurant': restaurant_data,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh', ''))
        token.blacklist()
    except Exception:
        pass
    log_action(request.user, 'LOGOUT', 'Déconnexion', f"{request.user.login} déconnecté",
               'user', request.user.id, request)
    return Response({'detail': 'Déconnecté'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(MeSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'detail': 'Ancien mot de passe incorrect'}, status=400)
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'detail': 'Mot de passe modifié'})


# ==================== USER VIEWSET ====================

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Super admin voit tout
        if user.is_super_admin:
            return User.objects.select_related('role', 'restaurant').all()
        # Admin restaurant voit son restaurant
        return User.objects.select_related('role').filter(restaurant=user.restaurant)

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        # L'utilisateur créé appartient au même restaurant que l'admin
        restaurant = self.request.user.restaurant
        serializer.save(restaurant=restaurant)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        user = self.get_object()
        user.is_activite = not user.is_activite
        user.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'detail': 'Mot de passe requis'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Mot de passe réinitialisé'})


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
