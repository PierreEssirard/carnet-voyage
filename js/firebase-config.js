/* =========================================================
   CONFIGURATION FIREBASE — espace privé
   Remplace les valeurs « COLLE_... » par celles de ta console
   Firebase (voir le guide). Ces clés ne sont pas secrètes :
   la sécurité vient des règles Firebase et du compte privé.
   ========================================================= */

export const firebaseConfig = {
apiKey: "AIzaSyCsPpBvsnI_qbIVP3qStdCUxPq16e60zk8",
  authDomain: "carnet-voyages-5b828.firebaseapp.com",
  projectId: "carnet-voyages-5b828",
  storageBucket: "carnet-voyages-5b828.firebasestorage.app",
  messagingSenderId: "1049053312001",
  appId: "1:1049053312001:web:bb5e55d381763c8e127c00"
};

/* Le compte créé dans Firebase > Authentication.
   Le mot de passe du compte = le code (LONGUEUR_CODE chiffres) + SUFFIXE
   (Firebase exige au moins 6 caractères).
   Exemple avec le code 0304 → mot de passe « 0304-carnet ». */
export const COMPTE = "prive@carnet-voyages.com";
export const SUFFIXE = "-carnet";

/* Nombre de chiffres du code. Tout ce fichier est public (dépôt GitHub) :
   le code est donc le SEUL secret. 4 chiffres = 10 000 possibilités,
   6 chiffres = 1 000 000. Pour passer à 6 : change d'abord le mot de passe
   du compte dans Firebase (ex. « 482913-carnet »), puis mets 6 ici. */
export const LONGUEUR_CODE = 4;

/* Anti-robots (Firebase App Check + reCAPTCHA v3) — voir SECURITE.md.
   Colle ici la « clé du site » reCAPTCHA (elle est publique, ce n'est pas un secret).
   Vide = App Check désactivé. */
export const APP_CHECK_CLE = "";

/* Version de la bibliothèque Firebase chargée depuis le CDN de Google */
export const VERSION_SDK = "10.14.1";