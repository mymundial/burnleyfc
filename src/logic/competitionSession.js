// Fixture-scoped local entry only. Never store the participant's email here.
// A different match, even on the same website origin, gets a separate session.
const PREFIX = "burnley-matchday-entry-v2";
const DEFAULT_FIXTURE = "burnley-preston-matchday";
const keyFor = (fixture) => `${PREFIX}:${String(fixture || DEFAULT_FIXTURE).replace(/[^a-z0-9-]/gi, "")}`;
const storeByDefault = () => typeof localStorage === "undefined" ? null : localStorage;

export function loadRememberedEntrant(storage = storeByDefault(), fixtureId = DEFAULT_FIXTURE) {
  try {
    const saved = JSON.parse(storage?.getItem(keyFor(fixtureId)) || "null");
    if (saved?.version !== 2 || saved.fixtureId !== fixtureId ||
        !/^[A-Z0-9]{1,12}$/.test(saved.username || "") ||
        typeof saved.token !== "string" ||
        !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(saved.token)) return null;
    return { username: saved.username, token: saved.token, fixtureId, preview: false };
  } catch { return null; }
}
export function rememberEntrant(entrant, storage = storeByDefault(), fixtureId = entrant?.fixtureId || DEFAULT_FIXTURE) {
  if (!entrant?.token || entrant?.preview) return;
  try { storage?.setItem(keyFor(fixtureId), JSON.stringify({ version: 2, fixtureId, username: entrant.username, token: entrant.token })); }
  catch { /* Blocked browser storage must not prevent this session. */ }
}
export function forgetRememberedEntrant(storage = storeByDefault(), fixtureId = DEFAULT_FIXTURE) {
  try { storage?.removeItem(keyFor(fixtureId)); }
  catch { /* Clearing may be blocked; server always validates tokens. */ }
}
