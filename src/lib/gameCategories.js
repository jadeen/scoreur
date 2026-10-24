export const categories = [
  { key: "solo", label: "Solo", test: (g) => g.players_min === 1 && g.players_max === 1 },
  {
    key: "manches",
    label: "Par manches",
    test: (g) => g.sheet !== "generique" && !(g.players_min === 1 && g.players_max === 1),
  },
  { key: "bas", label: "Le plus bas gagne", test: (g) => g.lower_wins },
];

export function playersLabel(game) {
  if (game.players_min === 1 && game.players_max === 1) return "solo";
  if (game.players_min === game.players_max) return `${game.players_min} joueurs`;
  return `${game.players_min} à ${game.players_max} joueurs`;
}
