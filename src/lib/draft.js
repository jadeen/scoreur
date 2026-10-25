// Brouillon local d'une partie en cours : permet de reprendre une feuille
// après avoir quitté sans enregistrer. Effacé à l'enregistrement ou à l'abandon.
const PREFIX = "scoreur:partie:";

export function loadDraft(slug) {
  const raw = localStorage.getItem(PREFIX + slug);
  return raw ? JSON.parse(raw) : null;
}

export function saveDraft(slug, draft) {
  localStorage.setItem(PREFIX + slug, JSON.stringify(draft));
}

export function clearDraft(slug) {
  localStorage.removeItem(PREFIX + slug);
}
