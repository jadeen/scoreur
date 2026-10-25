// Bandeau "Version alpha" affiché en haut de chaque page. Masquable, le choix
// est mémorisé par navigateur (pas de compte nécessaire). À supprimer avec le
// bandeau lui-même au passage en version 1.0.
const KEY = "scoreur:alpha-bandeau-masque";

export function isAlphaBannerDismissed() {
  return localStorage.getItem(KEY) === "1";
}

export function dismissAlphaBanner() {
  localStorage.setItem(KEY, "1");
}
