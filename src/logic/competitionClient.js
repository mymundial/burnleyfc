// Only official competition mode uses these endpoints; server controls the
// schedule and Firestore. Email and Auth action codes are never stored locally.
const ENDPOINT = "/api/competition";
async function request(method, payload, token, query = "") {
  let response;
  try {
    response = await fetch(`${ENDPOINT}${query}`, {
      method,
      headers: {
        ...(payload ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}), cache: "no-store",
    });
  } catch { throw new Error("COMPETITION SERVICE UNAVAILABLE"); }
  let body;
  try { body = await response.json(); }
  catch { throw new Error("COMPETITION SERVICE UNAVAILABLE"); }
  if (!response.ok) {
    const error = new Error(body?.error || "COMPETITION SERVICE UNAVAILABLE");
    error.status = response.status;
    throw error;
  }
  return body;
}
export const fetchCompetitionInfo = () => request("GET");
export const validateCompetitionSession = (token) => request("GET", null, token, "?action=session");
export const registerCompetitionPlayer = ({ username, email, termsAccepted }) =>
  request("POST", { action: "register", username, email, termsAccepted });
export const sendCompetitionRecoveryLink = ({ username, email }) =>
  request("POST", { action: "recoveryStart", username, email });
export const completeCompetitionRecovery = ({ username, email, oobCode }) =>
  request("POST", { action: "recoveryFinish", username, email, oobCode });
export const changeRecoveredUsername = ({ username, recoveryTicket }) =>
  request("POST", { action: "recoveryRename", username, recoveryTicket });
export const submitCompetitionScore = (token, result, matchId) => {
  const userShots = Array.isArray(result?.attempts?.user) ? result.attempts.user : [];
  return request("POST", {
    action: "submit", matchId,
    shots: userShots.slice(0, 5).map((shot) => ({
      power: shot.powerValue ?? shot.power,
      accuracy: shot.accuracyValue ?? shot.accuracy,
      goal: Boolean(shot.goal),
    })),
  }, token);
};
export const fetchCompetitionLeaderboard = (token) => request("GET", null, token);
