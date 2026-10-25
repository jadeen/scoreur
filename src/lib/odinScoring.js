// Règles de score Odin (details_format = 'odin-v1') : à chaque manche, on
// saisit les cartes restées en main (0 à 9) ; une carte vaut 1 point. La
// partie s'arrête dès qu'un joueur atteint le seuil, le plus petit total gagne.
export const ODIN_MAX_CARDS = 9;
export const ODIN_DEFAULT_TARGET = 15;
export const ODIN_MIN_TARGET = 5;
export const ODIN_MAX_TARGET = 200;

export function odinTotals(rounds, playerCount) {
  const totals = Array(playerCount).fill(0);
  for (const round of rounds) {
    round.forEach((cards, i) => {
      totals[i] += cards;
    });
  }
  return totals;
}

export function odinOver(totals, target) {
  return totals.some((total) => total >= target);
}

// Lignes de la feuille de manches : total cumulé et cartes de la manche par
// joueur, pour le tableau commun aux feuilles dédiées.
export function odinLedgerRows(rounds, playerCount) {
  const cumulative = Array(playerCount).fill(0);
  return rounds.map((round, index) => {
    const cells = round.map((cards, i) => {
      cumulative[i] += cards;
      return { value: cumulative[i], detail: `${cards} carte${cards > 1 ? "s" : ""}` };
    });
    return { label: String(index + 1), cells };
  });
}
