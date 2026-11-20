import test from "node:test";
import assert from "node:assert/strict";
import { rememberEntrant, loadRememberedEntrant, forgetRememberedEntrant } from "../src/logic/competitionSession.js";
import { readRecoveryLink } from "../src/logic/recoveryLink.js";

const sampleToken = `${Buffer.from(JSON.stringify({ id: "a".repeat(64), fixture: "burnley-preston-matchday" })).toString("base64url")}.${"b".repeat(64)}`;
function fakeStorage() {
  const entries = new Map();
  return { entries, getItem: (name) => entries.get(name) || null, setItem: (name, value) => entries.set(name, value), removeItem: (name) => entries.delete(name) };
}
test("sessions are isolated per fixture even on the same domain", () => {
  const storage = fakeStorage();
  const one = { username: "JERRY123", email: "jerry@example.com", token: sampleToken, fixtureId: "burnley-preston-matchday" };
  rememberEntrant(one, storage);
  assert.equal(loadRememberedEntrant(storage, one.fixtureId).username, "JERRY123");
  assert.equal(loadRememberedEntrant(storage, "burnley-leeds-matchday"), null);
  assert.ok(!JSON.stringify([...storage.entries]).includes("jerry@example.com"));
  rememberEntrant({ ...one, username: "JERRY2", fixtureId: "burnley-leeds-matchday" }, storage);
  forgetRememberedEntrant(storage, "burnley-preston-matchday");
  assert.equal(loadRememberedEntrant(storage, "burnley-preston-matchday"), null);
  assert.equal(loadRememberedEntrant(storage, "burnley-leeds-matchday").username, "JERRY2");
});
test("email action codes and usernames can be extracted from same-browser and nested links", () => {
  const simple = readRecoveryLink("https://game.example/?mode=signIn&oobCode=abc_123&recoveryUsername=Claret99");
  assert.deepEqual(simple, { oobCode: "abc_123", username: "CLARET99" });
  const nested = readRecoveryLink(`https://game.example/?recoveryUsername=JERRY123&link=${encodeURIComponent("https://game.example/?mode=signIn&oobCode=xyz_987")}`);
  assert.deepEqual(nested, { oobCode: "xyz_987", username: "JERRY123" });
  assert.equal(readRecoveryLink("https://game.example/?recoveryUsername=JERRY123"), null);
});
