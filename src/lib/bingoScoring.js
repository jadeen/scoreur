// Règles du Bingo (details_format = 'bingo-v1') : un carton de 3 lignes de 9
// cases, 15 numéros de 1 à 90 (5 par ligne). Un palier est gagné dès que le
// nombre de lignes correspondant est complet au tirage (quine = 1 ligne,
// double quine = 2, carton plein = 3).
export const BINGO_ROWS = 3;
export const BINGO_COLS = 9;
export const BINGO_NUMBERS_PER_ROW = 5;
export const BINGO_MIN_NUMBER = 1;
export const BINGO_MAX_NUMBER = 90;

export const BINGO_TIER_KEYS = ["quine", "double_quine", "carton_plein"];
export const BINGO_TIER_LABELS = {
  quine: "Quine",
  double_quine: "Double quine",
  carton_plein: "Carton plein",
};

export function emptyCard() {
  return Array.from({ length: BINGO_ROWS }, () => Array(BINGO_COLS).fill(null));
}

export function bingoCardNumbers(card) {
  return card.flat().filter((n) => n);
}

// Liste les problèmes du carton saisi, vide si le carton est valide.
export function bingoCardIssues(card) {
  const issues = [];
  card.forEach((row, index) => {
    const filled = row.filter((n) => n);
    if (filled.length !== BINGO_NUMBERS_PER_ROW) {
      issues.push(
        `La ligne ${index + 1} doit avoir ${BINGO_NUMBERS_PER_ROW} numéros (actuellement ${filled.length}).`,
      );
    }
  });
  const numbers = bingoCardNumbers(card);
  if (numbers.some((n) => n < BINGO_MIN_NUMBER || n > BINGO_MAX_NUMBER)) {
    issues.push(`Les numéros doivent être entre ${BINGO_MIN_NUMBER} et ${BINGO_MAX_NUMBER}.`);
  }
  if (numbers.some((n, index) => numbers.indexOf(n) !== index)) {
    issues.push("Le carton contient des numéros en double.");
  }
  return issues;
}

export function bingoCardIsValid(card) {
  return bingoCardIssues(card).length === 0;
}

export function bingoRowStatus(row, tirage) {
  const numbers = row.filter((n) => n);
  const hit = numbers.filter((n) => tirage.includes(n));
  return {
    numbers,
    hit,
    remaining: numbers.filter((n) => !tirage.includes(n)),
    complete: hit.length === numbers.length,
  };
}

export function bingoCompletedRows(card, tirage) {
  return card.filter((row) => bingoRowStatus(row, tirage).complete).length;
}

const TIER_MIN_ROWS = { quine: 1, double_quine: 2, carton_plein: 3 };

// Paliers gagnés à partir du nombre de lignes complètes : automatique, pas
// de confirmation manuelle.
export function bingoTiers(completedRows) {
  return Object.fromEntries(
    BINGO_TIER_KEYS.map((key) => [key, completedRows >= TIER_MIN_ROWS[key]]),
  );
}

export function bingoScore(gagne) {
  return BINGO_TIER_KEYS.filter((key) => gagne[key]).length;
}
