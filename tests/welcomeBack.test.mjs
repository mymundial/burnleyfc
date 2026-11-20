import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rememberEntrant, loadRememberedEntrant, forgetRememberedEntrant } from "../src/logic/competitionSession.js";

function storage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
    entries,
  };
}
const sampleToken = `${Buffer.from(JSON.stringify({ id: "a".repeat(64), fixture: "burnley-preston-matchday" })).toString("base64url")}.${"b".repeat(64)}`;

test("remembered player is loaded without storing private email, and switch removes only device session", () => {
  const store = storage();
  rememberEntrant({ username: "CLARET99", email: "secret@example.com", token: sampleToken }, store);
  assert.equal(loadRememberedEntrant(store).username, "CLARET99");
  assert.equal(loadRememberedEntrant(store).token, sampleToken);
  assert.ok(![...store.entries.values()].join(" ").includes("secret@example.com"));
  forgetRememberedEntrant(store);
  assert.equal(loadRememberedEntrant(store), null);
});

test("blocked storage and preview entries are handled without inventing a saved registration", () => {
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); }, removeItem() { throw Error("blocked"); } };
  assert.equal(loadRememberedEntrant(blocked), null);
  assert.doesNotThrow(() => rememberEntrant({ username: "USER", token: sampleToken }, blocked));
  assert.doesNotThrow(() => forgetRememberedEntrant(blocked));
  const store = storage();
  rememberEntrant({ username: "PREVIEW", token: null, preview: true }, store);
  assert.equal(loadRememberedEntrant(store), null);
});

test("welcome-back identity and registration validation remain connected", () => {
  const ui = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const welcome = ui.split("export function CompetitionWelcomeBackModal")[1].split("export function CompetitionRegistrationModal")[0];
  assert.match(welcome, /<ModalHeader title="WELCOME BACK" onClose=\{onClose\}/);
  assert.match(welcome, /READY FOR ANOTHER GO\?/);
  assert.match(welcome, /\{username\}[\s\S]*?CONTINUE[\s\S]*?NOT YOU\?/);
  assert.match(welcome, /onClick=\{onSwitchPlayer\}/);
  assert.match(welcome, /onClick=\{onContinue\}/);
  assert.match(ui, /disabled=\{saving \|\| !formReady\}/);
  assert.match(ui, /validEmail && termsAccepted/);
  assert.match(app, /loadRememberedEntrant\(undefined, info.fixtureId\)/);
  assert.match(app, /validateCompetitionSession\(entrant.token\)/);
  assert.match(app, /forgetRememberedEntrant\(undefined, fixtureId\)/);
  assert.match(app, /rememberEntrant\(nextEntrant\)/);
});
