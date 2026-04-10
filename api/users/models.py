import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.conf import settings


class Role(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'role'
        verbose_name = 'Rôle'

    def __str__(self):
        return self.nom


class Permission(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'permission'
        verbose_name = 'Permission'

    def __str__(self):
        return self.nom


class UserManager(BaseUserManager):
    def create_user(self, login, password, **extra_fields):
        if not login:
            raise ValueError('Login requis')
        user = self.model(login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password, **extra_fields):
        extra_fields.setdefault('is_super_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_activite', True)
        return self.create_user(login, password, **extra_fields)


class User(AbstractBaseUser):
    SEXE_CHOICES = [('M', 'Masculin'), ('F', 'Féminin'), ('A', 'Autre')]

    login = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    date_de_naissance = models.DateField(null=True, blank=True)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True)
    poste = models.CharField(max_length=100, blank=True)
    date_embauche = models.DateField(null=True, blank=True)
    is_activite = models.BooleanField(default=True)
    is_super_admin = models.BooleanField(default=False, help_text="Super admin de la plateforme Oresto")
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # Relations
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True)

    # ★ MULTI-TENANT : restaurant auquel appartient cet utilisateur
    # NULL uniquement pour les super admins Oresto
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users',
    )

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'user'
        verbose_name = 'Utilisateur'

    def __str__(self):
        return f"{self.get_full_name()} ({self.login})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.login

    def has_module_perms(self, app_label):
        return self.is_super_admin or self.is_staff

    def has_perm(self, perm, obj=None):
        return self.is_super_admin or self.is_staff
