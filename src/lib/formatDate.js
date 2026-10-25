const short = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const long = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ex. « 17 oct. » : liste de parties, sans l'année.
export function formatDateShort(iso) {
  return short.format(new Date(iso));
}

// ex. « Vendredi 23 octobre » : en-tête d'une partie.
export function formatDateLong(iso) {
  return capitalize(long.format(new Date(iso)));
}
