export function playersCountLabel(match) {
  const count = match.match_players.length;
  return count === 1 ? "solo" : `${count} joueurs`;
}

export function winnersSummary(match) {
  const winners = match.match_players.filter((player) => player.is_winner);
  const names = winners.map((player) => player.players.name).join(", ");
  return `victoire : ${names} (${winners[0].score} pts)`;
}
