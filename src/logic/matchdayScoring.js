/**
 * Matchday precision challenge. Only Burnley's first five regulation kicks
 * count. Match result, goalkeeper AI, goals against, and sudden death never
 * change the points; goals scored are retained solely as a tie-breaker.
 */
export const SCORING_SHOTS = 5;
export const METER_MAX_POINTS = 100;
export const SHOT_MAX_POINTS = METER_MAX_POINTS * 2;
export const MATCHDAY_MAX_POINTS = SCORING_SHOTS * SHOT_MAX_POINTS;

/** Quantise the tap position to 0.5 increments so every 0–100 point value is possible. */
export function scoringMeterStop(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(Math.min(100, Math.max(0, numeric)) * 2) / 2;
}

/** 0 -> 0, 49.5 -> 99, 50 -> 100, 50.5 -> 99, 100 -> 0. */
export function precisionPoints(value) {
  const stop = scoringMeterStop(value);
  return Math.max(0, METER_MAX_POINTS - 2 * Math.abs(stop - 50));
}

export function scoreMatchdayAttempts(attempts) {
  const userShots = (Array.isArray(attempts?.user) ? attempts.user : []).slice(0, SCORING_SHOTS);
  const shots = userShots.map((shot, index) => {
    const power = precisionPoints(shot?.powerValue ?? shot?.power);
    const accuracy = precisionPoints(shot?.accuracyValue ?? shot?.accuracy);
    return {
      shotNumber: index + 1,
      power,
      accuracy,
      points: power + accuracy,
      goal: Boolean(shot?.goal),
      perfectHits: Number(power === METER_MAX_POINTS) + Number(accuracy === METER_MAX_POINTS),
    };
  });
  const powerTotal = shots.reduce((total, shot) => total + shot.power, 0);
  const accuracyTotal = shots.reduce((total, shot) => total + shot.accuracy, 0);
  const goalsScored = shots.filter((shot) => shot.goal).length;
  const perfectHits = shots.reduce((total, shot) => total + shot.perfectHits, 0);
  return {
    points: powerTotal + accuracyTotal,
    maxPoints: MATCHDAY_MAX_POINTS,
    shotsScored: shots.length,
    powerTotal,
    accuracyTotal,
    goalsScored,
    perfectHits,
    shots,
    // Deterministic order: points, goals in regulation, accuracy, perfect hits.
    tieBreak: { goalsScored, accuracyTotal, perfectHits },
  };
}

/** Negative if a ranks higher, positive if b ranks higher, 0 if unresolved. */
export function compareMatchdayScores(a, b) {
  for (const key of ["points", "goalsScored", "accuracyTotal", "perfectHits"]) {
    const difference = (Number(b?.[key]) || 0) - (Number(a?.[key]) || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
