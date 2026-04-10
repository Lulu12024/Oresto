import uuid
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    """Plans d'abonnement Oresto — différenciés par modules activés"""
    nom = models.CharField(max_length=100, unique=True)  # Nom libre (ex: Starter, Pro, Business...)
    prix_mensuel = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)

    # ─── Modules inclus ───────────────────────────────────────────────
    # Plan 1 : restaurant + équipe uniquement (commandes)
    module_commandes = models.BooleanField(default=True, help_text="Module commandes, tables, facturation")
    # Plan 2 : commandes + stock
    module_stock = models.BooleanField(default=False, help_text="Module gestion des stocks")
    # Plan 3 : commandes + stock + support 24h/24
    module_support = models.BooleanField(default=False, help_text="Support prioritaire 24h/24")

    is_active = models.BooleanField(default=True, help_text="Afficher ce plan sur la landing page")

    class Meta:
        db_table = 'plan'
        verbose_name = 'Plan'
        ordering = ['prix_mensuel']

    def __str__(self):
        return f"{self.nom} — {self.prix_mensuel} FCFA/mois"


class Restaurant(models.Model):
    """Restaurant abonné à la plateforme Oresto"""
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('suspendu', 'Suspendu'),
        ('inactif', 'Inactif'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.TextField(blank=True)
    ville = models.CharField(max_length=100, blank=True)
    pays = models.CharField(max_length=100, default='Bénin')
    logo_url = models.URLField(blank=True, help_text="URL publique du logo du restaurant")
    couleur_primaire = models.CharField(max_length=10, default='#C9A84C')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restaurant'
        verbose_name = 'Restaurant'

    def __str__(self):
        return self.nom


class Abonnement(models.Model):
    """Abonnement d'un restaurant à un plan"""
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('essai', 'Essai'),
        ('expiré', 'Expiré'),
        ('annulé', 'Annulé'),
    ]
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='abonnements')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='essai')
    date_debut = models.DateField(default=timezone.now)
    date_fin = models.DateField(null=True, blank=True)
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'abonnement'
        verbose_name = 'Abonnement'
        ordering = ['-date_creation']

    @property
    def is_actif(self):
        if self.statut not in ['actif', 'essai']:
            return False
        if self.date_fin and self.date_fin < timezone.now().date():
            return False
        return True

    def __str__(self):
        return f"{self.restaurant.nom} — {self.plan.nom} ({self.statut})"
