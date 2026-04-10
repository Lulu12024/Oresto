from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'description']
    search_fields = ['nom']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'description']
    search_fields = ['nom']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['login', 'first_name', 'last_name', 'email', 'role', 'is_activite', 'date_joined']
    list_filter   = ['role', 'is_activite', 'date_joined']   # ← is_deleted retiré
    search_fields = ['login', 'first_name', 'last_name', 'email']
    ordering      = ['-date_joined']

    # ← filter_horizontal vidé (groups/user_permissions n'existent pas sur ce modèle)
    filter_horizontal = ()

    fieldsets = (
        ('Connexion',            {'fields': ('login', 'password')}),
        ('Infos personnelles',   {'fields': ('first_name', 'last_name', 'date_de_naissance', 'sexe', 'email', 'telephone', 'date_embauche')}),
        ('Rôle & accès',         {'fields': ('role', 'is_activite', 'is_staff', 'is_superuser')}),
        ('Dates',                {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('login', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )

    readonly_fields = ['date_joined', 'last_login']