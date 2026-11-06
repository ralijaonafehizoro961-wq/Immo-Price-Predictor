# Immo Price Predictor

Application web qui estime le prix d'une maison à partir de ses caractéristiques.
Un modèle de machine learning est servi par une API FastAPI, et un site React permet de l'utiliser.

## Technologies

- Machine learning : scikit-learn (gradient boosting), pandas, numpy
- API : FastAPI
- Site : React, Vite, Tailwind CSS
- Déploiement : Vercel

## Données

Jeu de données Kaggle "House Sales in King County, USA" (`kc_house_data.csv`), environ 21 000 ventes de maisons en 2014 et 2015.
Le fichier n'est pas inclus dans ce dépôt. Télécharge-le sur Kaggle et place-le dans `data/raw/`.

## Modèle

- Target : `log(price)` (le prix est converti en dollars à la fin)
- 12 features : surface, terrain, chambres, salles de bain, étages, bord de l'eau, vue, état, qualité de construction, âge, rénovation, code postal
- Résultats sur le jeu de test : erreur moyenne d'environ 74 000 dollars, R2 de 0,878

## Structure du projet

```text
immo-price-predictor/
  notebooks/   exploration, nettoyage, choix des variables, entraînement, test
  backend/     API FastAPI et modèle sauvegardé
  frontend/    site React
  data/        données (non versionnées)
```

## Lancer le projet en local

API :

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

L'API est disponible sur http://127.0.0.1:8000 et sa documentation sur http://127.0.0.1:8000/docs.

Site :

```bash
cd frontend
npm install
npm run dev
```

Le site est disponible sur http://localhost:5173.

## Limites

Le modèle est entraîné sur des maisons de la région de Seattle (États-Unis) entre 2014 et 2015.
Il ne donne pas de bonnes estimations pour d'autres villes ou pour le marché actuel.
