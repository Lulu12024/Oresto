import uuid
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(choices=[('starter', 'Starter'), ('pro', 'Pro'), ('enterprise', 'Enterprise')], max_length=50, unique=True)),
                ('prix_mensuel', models.DecimalField(decimal_places=2, max_digits=10)),
                ('max_tables', models.PositiveIntegerField(default=10)),
                ('max_utilisateurs', models.PositiveIntegerField(default=5)),
                ('module_commandes', models.BooleanField(default=True)),
                ('module_stock', models.BooleanField(default=False)),
                ('description', models.TextField(blank=True)),
            ],
            options={'db_table': 'plan', 'verbose_name': 'Plan'},
        ),
        migrations.CreateModel(
            name='Restaurant',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nom', models.CharField(max_length=200)),
                ('slug', models.SlugField(unique=True)),
                ('email', models.EmailField(unique=True)),
                ('telephone', models.CharField(blank=True, max_length=30)),
                ('adresse', models.TextField(blank=True)),
                ('ville', models.CharField(blank=True, max_length=100)),
                ('pays', models.CharField(default='Bénin', max_length=100)),
                ('logo_url', models.URLField(blank=True)),
                ('couleur_primaire', models.CharField(default='#C9A84C', max_length=10)),
                ('statut', models.CharField(choices=[('actif', 'Actif'), ('suspendu', 'Suspendu'), ('inactif', 'Inactif')], default='actif', max_length=20)),
                ('plan', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='restaurants.plan')),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'restaurant', 'verbose_name': 'Restaurant'},
        ),
        migrations.CreateModel(
            name='Abonnement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('statut', models.CharField(choices=[('actif', 'Actif'), ('expiré', 'Expiré'), ('annulé', 'Annulé'), ('essai', 'Essai gratuit')], default='essai', max_length=20)),
                ('date_debut', models.DateField(default=django.utils.timezone.now)),
                ('date_fin', models.DateField(blank=True, null=True)),
                ('montant_paye', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('notes', models.TextField(blank=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('restaurant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='abonnements', to='restaurants.restaurant')),
                ('plan', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='restaurants.plan')),
            ],
            options={'db_table': 'abonnement', 'verbose_name': 'Abonnement', 'ordering': ['-date_creation']},
        ),
    ]
