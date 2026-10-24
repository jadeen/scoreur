export function playersLabel(game) {
  if (game.players_min === 1 && game.players_max === 1) return "solo";
  if (game.players_min === game.players_max) return `${game.players_min} joueurs`;
  return `${game.players_min} à ${game.players_max} joueurs`;
}

// Tags d'un jeu, sans doublon avec le badge joueurs (ex. un jeu solo
// marqué "solo" en tag en plus du badge "solo" déjà affiché).
export function displayTags(game) {
  const players = playersLabel(game).toLowerCase();
  return game.tags.filter((tag) => tag.toLowerCase() !== players);
}
