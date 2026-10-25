// Classement de compétition : même score, même rang (ex. 1, 1, 3), le rang
// suivant tient compte du nombre d'ex-aequo. lowerWins inverse le sens du tri
// (Odin : le plus bas gagne).
export function rankPlayers(players, lowerWins) {
  const sorted = [...players].sort((a, b) => (lowerWins ? a.score - b.score : b.score - a.score));
  let rank = 0;
  let previousScore = null;
  return sorted.map((player, index) => {
    if (previousScore === null || player.score !== previousScore) {
      rank = index + 1;
      previousScore = player.score;
    }
    return { ...player, rank, isWinner: rank === 1 };
  });
}
