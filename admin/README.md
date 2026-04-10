# 🛠️ Oresto Admin — Console d'Administration

Interface React pour gérer la plateforme SaaS **Oresto**.
Connexion directe à l'API Django via JWT.

## Accès
Réservé aux **super administrateurs** (`is_super_admin = True`).

## Fonctionnalités

### 🍽 Restaurants
- Liste de tous les restaurants abonnés
- Recherche et filtrage par statut/plan
- **Créer un restaurant + son admin** en une seule action
- Suspendre / réactiver un restaurant
- Vue détaillée (abonnement actif, nb utilisateurs)

### 💳 Abonnements
- Liste de tous les abonnements
- Filtrage par restaurant et statut
- Créer un nouvel abonnement
- **Renouveler** un abonnement (1, 2, 3, 6 ou 12 mois)

### 📋 Plans tarifaires
- Starter / Pro / Enterprise
- Créer et modifier les plans
- Gérer les modules inclus (commandes, stock)

### 📊 Dashboard
- KPIs globaux (total restaurants, actifs, suspendus)
- Répartition par plan
- Restaurants récents

## Variables d'environnement (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
PORT=3001
```

## Lancement
```bash
npm install
npm start   # → http://localhost:3001
```

## Créer le premier super admin (API)
```bash
python manage.py shell
>>> from users.models import User
>>> User.objects.create_superuser(login='oresto.admin', password='MotDePasse!')
```
