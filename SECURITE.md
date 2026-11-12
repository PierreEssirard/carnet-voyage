# Sécurité du carnet

Le site est hébergé sur GitHub Pages : **le code est public par nature** (n'importe qui peut lire le dépôt, c'est normal et sans danger). Les clés de `js/firebase-config.js` ne sont pas des secrets non plus. Ce qu'il faut protéger, c'est **Firebase** : tes photos, l'espace privé, et ta facture si le forfait Blaze est actif.

Le seul secret est le **code de l'espace privé**. Tout le reste se règle dans la console Firebase, dans cet ordre.

## 1. Règles de Storage (le plus important, 2 min)

Console Firebase › **Storage** › onglet **Règles** › remplace tout par le contenu de [`storage.rules`](storage.rules) › **Publier**.

Résultat : les visiteurs voient les photos du carnet, mais **seul ton compte** peut envoyer ou supprimer, uniquement des photos (< 25 Mo) ou des vidéos (< 500 Mo), et le dossier `prive/` est invisible pour tous les autres.

## 2. Bloquer la création de comptes (1 min)

Console › **Authentication** › **Paramètres** › **Actions de l'utilisateur** : décoche **Activer la création (inscription)**. Coche aussi **Protection contre l'énumération des adresses e-mail**.

Sans ça, un robot peut se créer son propre compte sur ton projet.

## 3. Anti-robots : App Check + reCAPTCHA (10 min)

Chaque requête vers Firebase devra prouver qu'elle vient de ton site ouvert dans un vrai navigateur. Les scripts qui testent les codes en boucle sont refusés par Firebase lui-même.

1. Va sur <https://www.google.com/recaptcha/admin/create> : type **reCAPTCHA v3**, domaine `pierreessirard.github.io`. Copie la **clé du site** et la **clé secrète**.
2. Console Firebase › **App Check** › **Applications** › ton app Web › **reCAPTCHA** › colle la **clé secrète** › Enregistrer.
3. Dans `js/firebase-config.js`, colle la **clé du site** dans `APP_CHECK_CLE`, puis pousse sur GitHub.
4. Ouvre le site, entre dans l'espace privé, envoie une photo : tout doit marcher.
5. Attends un jour, puis dans **App Check › API** : vérifie que les requêtes sont « vérifiées », puis clique **Appliquer** pour **Storage** et pour **Authentication**.

> Ne clique pas « Appliquer » avant l'étape 3, sinon le site ne pourra plus afficher les photos.

## 4. Un code plus long (recommandé)

Avec 4 chiffres il n'y a que 10 000 codes possibles. Avec 6, il y en a 1 000 000.

1. Console › **Authentication** › **Utilisateurs** › `prive@carnet-voyages.com` › ⋮ › **Réinitialiser le mot de passe**, ou change-le : nouveau code à 6 chiffres + `-carnet` (ex. `482913-carnet`).
2. Dans `js/firebase-config.js`, mets `LONGUEUR_CODE = 6` et pousse sur GitHub.

## 5. Alerte de budget (si forfait Blaze)

<https://console.cloud.google.com/billing> › **Budgets et alertes** › crée un budget de quelques euros avec alerte par e-mail. Si quelque chose d'anormal arrive, tu es prévenu tout de suite.

## Déjà en place dans le code

- Après 5 codes faux, le site impose une attente de plus en plus longue (30 s, 1 min, 2 min… jusqu'à 30 min).
- Firebase Authentication bloque aussi de lui-même les essais trop nombreux depuis une même adresse.
- App Check est prêt : il s'active dès que `APP_CHECK_CLE` est rempli.
