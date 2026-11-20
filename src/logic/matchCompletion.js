// Match completion is independent of the competition points calculation.
// Practice may require a winner; Competition Mode always stops after five each.
export const REGULATION_PENALTIES = 5;

export function decideMatchState({ attempts, score, fixture, suddenDeathEnabled = true, competitionMode = false }) {
  const userAttempts = attempts.user.length;
  const opponentAttempts = attempts.opponent.length;
  const equalAttempts = userAttempts === opponentAttempts;
  const afterRegulation = userAttempts >= REGULATION_PENALTIES && opponentAttempts >= REGULATION_PENALTIES;

  if (!afterRegulation || (!competitionMode && !equalAttempts)) return { finished: false, draw: false, winnerSide: null };
  if (score.user > score.opponent) return { finished: true, draw: false, winnerSide: "user" };
  if (score.opponent > score.user) return { finished: true, draw: false, winnerSide: "opponent" };
  if (!competitionMode && suddenDeathEnabled && fixture?.requiresWinner) return { finished: false, draw: false, winnerSide: null };
  return { finished: true, draw: true, winnerSide: null };
}

