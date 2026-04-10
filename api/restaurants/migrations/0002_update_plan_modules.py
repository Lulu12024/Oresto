from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0001_initial'),
    ]

    operations = [
        # Ajouter module_support
        migrations.AddField(
            model_name='plan',
            name='module_support',
            field=models.BooleanField(default=False, help_text='Support prioritaire 24h/24'),
        ),
        # Ajouter is_active
        migrations.AddField(
            model_name='plan',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Afficher ce plan sur la landing page'),
        ),
        # Supprimer max_tables
        migrations.RemoveField(
            model_name='plan',
            name='max_tables',
        ),
        # Supprimer max_utilisateurs
        migrations.RemoveField(
            model_name='plan',
            name='max_utilisateurs',
        ),
        # Modifier nom pour supprimer les choices (garder CharField libre)
        migrations.AlterField(
            model_name='plan',
            name='nom',
            field=models.CharField(max_length=100, unique=True),
        ),
        # Ajouter ordering sur Plan
        migrations.AlterModelOptions(
            name='plan',
            options={'ordering': ['prix_mensuel'], 'verbose_name': 'Plan'},
        ),
    ]
