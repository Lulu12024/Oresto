import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal


class Table(models.Model):
    STATUT_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('RESERVEE', 'Réservée'),
        ('COMMANDES_PASSEE', 'Commandes passées'),
        ('EN_SERVICE', 'En service'),
        ('EN_ATTENTE_PAIEMENT', 'En attente de paiement'),
        ('PAYEE', 'Payée'),
        ('FERMEE', 'Fermée'),
    ]

    numero = models.CharField(max_length=20, verbose_name='Numéro de table')
    capacite = models.PositiveIntegerField(verbose_name='Capacité (nombre de places)')
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='DISPONIBLE')
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    description = models.TextField(blank=True, default='')
    date_ouverture = models.DateTimeField(null=True, blank=True)
    date_cloture = models.DateTimeField(null=True, blank=True)

    
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # ★ MULTI-TENANT
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        related_name='tables',
        null=True,
    )

    class Meta:
        db_table = 'table'
        verbose_name = 'Table'
        ordering = ['numero']
        unique_together = [('restaurant', 'numero')]

    def __str__(self):
        return f"Table {self.numero} ({self.restaurant.nom if self.restaurant else '?'})"

    def calculer_montant_total(self):
        qs = self.commandes.filter(statut='EN_ATTENTE_PAIEMENT')
        if self.date_ouverture:
            qs = qs.filter(date_commande__gte=self.date_ouverture)
        total = qs.aggregate(total=models.Sum('prix_total'))['total'] or Decimal('0.00')
        self.montant_total = total
        self.save()
        return total


class Plat(models.Model):
    nom = models.CharField(max_length=200)
    ingredients = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    disponible = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True, null=True)

    # ★ MULTI-TENANT
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        related_name='plats',
        null=True,
    )

    class Meta:
        db_table = 'plat'
        verbose_name = 'Plat'

    def __str__(self):
        return self.nom


class Commande(models.Model):
    STATUT_CHOICES = [
        ('STOCKEE', 'Stockée'),
        ('EN_ATTENTE_ACCEPTATION', "En attente d'acceptation"),
        ('EN_PREPARATION', 'En préparation'),
        ('EN_ATTENTE_LIVRAISON', 'En attente de livraison'),
        ('EN_ATTENTE_PAIEMENT', 'En attente de paiement'),
        ('PAYEE', 'Payée'),
        ('ANNULEE', 'Annulée'),
        ('REFUSEE', 'Refusée'),
    ]

    SOURCE_CHOICES = [
        ('serveur', 'Serveur'),
        ('client_qr', 'Client (QR Code)'),
    ]

    date_commande = models.DateTimeField(default=timezone.now)
    heure_commande = models.TimeField(auto_now_add=True)
    prix_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    observations = models.TextField(blank=True)
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='EN_ATTENTE_ACCEPTATION')

    # ★ Source de la commande
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='serveur')
    # Nom du client (pour commandes QR)
    nom_client = models.CharField(max_length=100, blank=True)

    date_acceptation = models.DateTimeField(null=True, blank=True)
    date_preparation = models.DateTimeField(null=True, blank=True)
    date_livraison = models.DateTimeField(null=True, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)

    motif_rejet = models.TextField(blank=True)
    motif_annulation = models.TextField(blank=True)

    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name='commandes')
    serveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='commandes_serveur',
        null=True, blank=True,
    )
    cuisinier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='commandes_cuisinier',
    )
    plats = models.ManyToManyField(Plat, through='CommandePlat', related_name='commandes')
    is_paid = models.BooleanField(default=False)

    class Meta:
        db_table = 'commande'
        verbose_name = 'Commande'
        ordering = ['-date_commande', '-heure_commande']

    def __str__(self):
        return f"Commande #{self.id} - Table {self.table.numero}"

    @property
    def order_id(self):
        return f"CMD-{self.id:03d}"

    def calculer_prix_total(self):
        total = sum(cp.prix_unitaire * cp.quantite for cp in self.commandeplat_set.all())
        self.prix_total = total
        self.save()
        return total


class CommandePlat(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE)
    plat = models.ForeignKey(Plat, on_delete=models.PROTECT)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'commande_plat'


class Facture(models.Model):
    MODE_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('mobile_money', 'Mobile Money'),
        ('autre', 'Autre'),
    ]

    numero_facture = models.CharField(max_length=50, unique=True)
    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name='factures')
    serveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2)
    pourboire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mode_paiement = models.CharField(max_length=20, choices=MODE_CHOICES, default='especes')
    date_generation = models.DateTimeField(auto_now_add=True)
    commandes = models.ManyToManyField(Commande, blank=True)

    class Meta:
        db_table = 'facture'
        verbose_name = 'Facture'

    def __str__(self):
        return self.numero_facture

    @property
    def invoice_id(self):
        """Retourne l'ID formaté de la facture (BDC-YYYY-XXXX)"""
        return self.numero_facture

    def save(self, *args, **kwargs):
        """Génère automatiquement un numéro de facture si absent"""
        if not self.numero_facture:
            from datetime import datetime
            now = datetime.now()
            year = now.strftime('%Y')
            month = now.strftime('%m')
            prefix = f'BDC-{year}-{month}'

            last_facture = Facture.objects.filter(
                numero_facture__startswith=prefix
            ).order_by('-numero_facture').first()

            if last_facture:
                last_num = int(last_facture.numero_facture.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.numero_facture = f'{prefix}-{new_num:03d}'

        super().save(*args, **kwargs)

    def get_mode_paiement_display(self):
        return dict(self.MODE_CHOICES).get(self.mode_paiement, self.mode_paiement)


class Notification(models.Model):
    TYPE_CHOICES = [
        ('new_order', 'Nouvelle commande'),
        ('order_accepted', 'Commande acceptée'),
        ('order_rejected', 'Commande refusée'),
        ('order_ready', 'Commande prête'),
        ('order_delivered', 'Commande livrée'),
        ('order_cancelled', 'Commande annulée'),
        ('stock_alert', 'Alerte stock'),
        ('peremption_alert', 'Alerte péremption'),
        ('mvt_validated', 'Mouvement validé'),
        ('mvt_rejected', 'Mouvement rejeté'),
        ('demande_stock', 'Demande de stock'),
        ('demande_validee', 'Demande validée'),
        ('demande_rejetee', 'Demande rejetée'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200 , null=True, blank=True)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} → {self.user.login}"
