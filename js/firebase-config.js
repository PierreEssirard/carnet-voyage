/* =========================================================
   CONFIGURATION FIREBASE — espace privé
   Remplace les valeurs « COLLE_... » par celles de ta console
   Firebase (voir le guide). Ces clés ne sont pas secrètes :
   la sécurité vient des règles Firebase et du compte privé.
   ========================================================= */

export const firebaseConfig = {
  apiKey: "AIzaSyCsPpBvsnI_qbIVP3qStdCUxPq16e60zk8",
  authDomain: "COLLE_TON_PROJET.firebaseapp.com",
  projectId: "COLLE_TON_PROJET",
  storageBucket: "COLLE_TON_PROJET.firebasestorage.app",
  messagingSenderId: "COLLE_TON_SENDER_ID",
  appId: "COLLE_TON_APP_ID",
};

/* Le compte créé dans Firebase > Authentication.
   Le mot de passe du compte = le code à 4 chiffres + SUFFIXE
   (Firebase exige au moins 6 caractères).
   Exemple avec le code 0304 → mot de passe « 0304-carnet ». */
export const COMPTE = "prive@carnet-voyages.com";
export const SUFFIXE = "-carnet";

/* Version de la bibliothèque Firebase chargée depuis le CDN de Google */
export const VERSION_SDK = "10.14.1";