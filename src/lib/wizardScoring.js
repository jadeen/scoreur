// Règles de score Wizard (details_format = 'wizard-v1') : une annonce exacte
// rapporte 20 + 10 par pli, sinon -10 par pli d'écart.
export function wizardScore(bid, tricks) {
  return bid === tricks ? 20 + 10 * tricks : -10 * Math.abs(bid - tricks);
}

// 60 cartes réparties en manches : à la manche r, chacun reçoit r cartes.
export function wizardRoundCount(playerCount) {
  return Math.floor(60 / playerCount);
}

// La donne tourne à chaque manche, en partant du premier joueur du carnet.
export function wizardDealerIndex(roundNumber, playerCount) {
  return (roundNumber - 1) % playerCount;
}

export function wizardTotals(rounds, playerCount) {
  const totals = Array(playerCount).fill(0);
  for (const round of rounds) {
    round.bids.forEach((bid, i) => {
      totals[i] += wizardScore(bid, round.tricks[i]);
    });
  }
  return totals;
}

export function formatSigned(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

// Lignes de la feuille de manches : total cumulé et détail annonce/plis/points
// par joueur, pour le tableau commun aux feuilles dédiées.
export function wizardLedgerRows(rounds, playerCount) {
  const cumulative = Array(playerCount).fill(0);
  return rounds.map((round, index) => {
    const cells = round.bids.map((bid, i) => {
      const points = wizardScore(bid, round.tricks[i]);
      cumulative[i] += points;
      return {
        value: cumulative[i],
        detail: `${bid}/${round.tricks[i]} · ${formatSigned(points)}`,
        negative: points < 0,
      };
    });
    return { label: String(index + 1), cells };
  });
}
