// The matchday leaderboard always shows the five podium/table places,
// including vacant places when fewer than five people have submitted scores.
// Never fabricate a username or score for an unoccupied place.
export function fivePlaceLeaderboard(rows = []) {
  const entries = Array.isArray(rows) ? rows : [];
  return Array.from({ length: 5 }, (_, index) => {
    const rank = index + 1;
    const entry = entries.find((row) => Number(row?.rank) === rank);
    return entry ? { ...entry, rank } : { id: `vacant-${rank}`, rank, username: null, score: null, isUser: false };
  });
}
