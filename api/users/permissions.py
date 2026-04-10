from rest_framework.permissions import BasePermission


def role_nom(user):
    return (user.role.nom if user.role else '').lower()


class IsServeurOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_activite


class IsCuisinierOrAbove(IsServeurOrAbove):
    pass


class IsGerantOrAdmin(BasePermission):
    ROLES = ['gérant', 'gestionnaire de stock', 'manager', 'administrateur']
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in self.ROLES


class IsManagerOrAdmin(BasePermission):
    ROLES = ['manager', 'administrateur']
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in self.ROLES


class IsAdministrateur(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) == 'administrateur'


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in ['administrateur', 'manager']


class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in ['administrateur', 'manager']


class CanViewStock(BasePermission):
    ROLES = ['gérant', 'gestionnaire de stock', 'manager', 'administrateur', 'cuisinier']
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in self.ROLES


class CanViewMovements(CanViewStock):
    pass


class IsGestionnaireOrGerantOrAdmin(BasePermission):
    ROLES = ['gestionnaire de stock', 'gérant', 'manager', 'administrateur']
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) in self.ROLES


class IsCuisinier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and role_nom(request.user) == 'cuisinier'
