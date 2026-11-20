import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import handler, { buildLeaderboard } from "../api/competition.js";

const stores = Object.fromEntries([
  "burnleyMatchdayParticipants", "burnleyMatchdayUsernames", "burnleyMatchdaySubmissions",
  "burnleyMatchdayStatistics", "burnleyMatchdayRequestLimits",
].map((collection) => [collection, new Map()]));
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.FIREBASE_PROJECT_ID = "test-matchday";
process.env.FIREBASE_CLIENT_EMAIL = "test@example.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" });
process.env.COMPETITION_TOKEN_SECRET = "this-is-a-test-secret-with-32-or-more-characters";
process.env.COMPETITION_FIXTURE_ID = "burnley-preston-matchday";
process.env.COMPETITION_START_AT = "2026-01-01T00:00:00Z";
process.env.COMPETITION_END_AT = "2032-01-01T00:00:00Z";
process.env.FIREBASE_WEB_API_KEY = "fake-test-web-api-key";
process.env.COMPETITION_PUBLIC_URL = "https://test-game.vercel.app";

let version = 0;
let emailSends = 0;
const nextUpdateTime = () => new Date(Date.UTC(2026, 10, 20, 12) + ++version * 1000).toISOString();
const fire = async (url, request = {}) => {
  const parsed = new URL(String(url));
  const method = request.method || "GET";
  if (parsed.hostname === "oauth2.googleapis.com") return { ok: true, status: 200, json: async () => ({ access_token: "test-oauth", expires_in: 3500 }) };
  const body = request.body ? JSON.parse(request.body) : {};
  if (parsed.hostname === "identitytoolkit.googleapis.com") {
    let result;
    if (parsed.pathname.endsWith("sendOobCode")) { emailSends++; result = { email: body.email }; }
    else if (parsed.pathname.endsWith("signInWithEmailLink") && body.oobCode === "valid-code") result = { email: body.email, idToken: "verified-id-token", localId: "verified-account" };
    else if (parsed.pathname.endsWith("signInWithEmailLink") && body.oobCode === "expired-code") return { ok: false, status: 400, json: async () => ({ error: { message: "EXPIRED_OOB_CODE" } }) };
    else if (parsed.pathname.endsWith("signInWithEmailLink") && body.oobCode === "mismatch-code") return { ok: false, status: 400, json: async () => ({ error: { message: "EMAIL_MISMATCH" } }) };
    else return { ok: false, status: 400, json: async () => ({ error: { message: "INVALID_OOB_CODE" } }) };
    return { ok: true, status: 200, json: async () => result };
  }
  const after = parsed.pathname.split("/documents")[1] || "";
  if (method === "POST" && after === ":commit") {
    const writes = body.writes || [];
    const resolve = (name) => {
      const segments = name.split("/documents/")[1].split("/");
      return { map: stores[segments[0]], id: segments[1] };
    };
    const conflict = writes.some((write) => {
      const { map, id } = resolve(write.delete || write.update.name);
      if (!map) return true;
      const old = map.get(id);
      return (write.currentDocument?.exists === false && Boolean(old)) ||
        (write.currentDocument?.exists === true && !old) ||
        (write.currentDocument?.updateTime && old?.updateTime !== write.currentDocument.updateTime);
    });
    if (conflict) return { ok: false, status: 412, json: async () => ({ error: { status: "FAILED_PRECONDITION", message: "conflict" } }) };
    for (const write of writes) {
      const { map, id } = resolve(write.delete || write.update.name);
      if (write.delete) { map.delete(id); continue; }
      const old = map.get(id);
      const chosen = write.updateMask?.fieldPaths;
      const newFields = chosen ? { ...old?.fields, ...Object.fromEntries(chosen.map((key) => [key, write.update.fields[key]])) } : { ...write.update.fields };
      for (const transform of write.updateTransforms || []) {
        const before = Number(newFields[transform.fieldPath]?.integerValue || 0);
        const added = Number(transform.increment?.integerValue || 0);
        newFields[transform.fieldPath] = { integerValue: String(before + added) };
      }
      map.set(id, { name: write.update.name, fields: newFields, updateTime: nextUpdateTime() });
    }
    return { ok: true, status: 200, json: async () => ({}) };
  }
  const segments = after.replace(/^\//, "").split("/");
  const map = stores[segments[0]];
  const document = map?.get(segments[1]);
  if (method === "GET" && segments.length > 1 && segments[1]) {
    return document ? { ok: true, status: 200, json: async () => document }
      : { ok: false, status: 404, json: async () => ({ error: { message: "not found" } }) };
  }
  if (method === "GET" && map) return { ok: true, status: 200, json: async () => ({ documents: [...map.values()] }) };
  return { ok: false, status: 404, json: async () => ({ error: { message: "not found" } }) };
};
globalThis.fetch = fire;
const invoke = async (method, body, token = null, query = null) => {
  const res = { code: 200, data: null, setHeader() { return this; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ method, body, query: query || {}, headers: token ? { authorization: `Bearer ${token}` } : {} }, res);
  return res;
};
const register = (username, email) => invoke("POST", { action: "register", username, email, termsAccepted: true });
const shots = (n, goal = false) => Array.from({ length: 5 }, () => ({ power: n, accuracy: n, goal }));
const submit = (token, n, matchId = randomUUID()) => invoke("POST", { action: "submit", matchId, shots: shots(n) }, token);
const player = (name) => [...stores.burnleyMatchdayParticipants.values()].find((doc) => doc.fields.username.stringValue === name)?.fields;
const stats = () => [...stores.burnleyMatchdayStatistics.values()][0]?.fields;

test("email-first registration, no consent rejection, private data, and unique username", async () => {
  const rejected = await invoke("POST", { action: "register", username: "JERRY123", email: "jerry@example.com", termsAccepted: false });
  assert.equal(rejected.code, 400);
  const jerry = await register("JERRY123", "jerry@example.com");
  assert.equal(jerry.code, 200);
  assert.ok(jerry.data.token);
  const duplicate = await register("JERRY123", "JERRY@EXAMPLE.COM");
  assert.equal(duplicate.data.error, "EMAIL ADDRESS ALREADY REGISTERED");
  const different = await register("JERRY123", "new@example.com");
  assert.equal(different.data.error, "USERNAME ALREADY TAKEN");
  const top = await invoke("GET");
  assert.equal(top.data.totalPlayers, 0);
  assert.equal(top.data.statistics.totalMatchesCompleted, 0);
  assert.equal(top.data.statistics.totalUniquePlayers, 0);
  assert.ok(!JSON.stringify(top.data).includes("jerry@example.com"));
  assert.equal((await invoke("GET", null, jerry.data.token, { action: "session" })).data.username, "JERRY123");
  assert.equal((await invoke("GET", null, "tampered", { action: "session" })).code, 401);
});

test("every game counts exactly once and best scores update only upward", async () => {
  const token = (await invoke("POST", { action: "register", username: "CLARET99", email: "clarets@example.com", termsAccepted: true })).data.token;
  const attemptId = randomUUID();
  const [first, retried] = await Promise.all([submit(token, 40, attemptId), submit(token, 40, attemptId)]);
  assert.equal(first.data.myRanking.score, 800);
  assert.equal(retried.data.myRanking.score, 800);
  assert.equal(player("CLARET99").matchesCompleted.integerValue, "1");
  assert.equal(stats().totalMatchesCompleted.integerValue, "1");
  assert.equal(stats().totalUniquePlayers.integerValue, "1");
  const firstBestTime = player("CLARET99").bestScoreRecordedAt.stringValue;
  await submit(token, 30);
  assert.equal(player("CLARET99").bestScore.integerValue, "800");
  assert.equal(player("CLARET99").bestScoreRecordedAt.stringValue, firstBestTime);
  assert.equal(player("CLARET99").matchesCompleted.integerValue, "2");
  await submit(token, 50);
  assert.equal(player("CLARET99").bestScore.integerValue, "1000");
  assert.equal(stats().totalMatchesCompleted.integerValue, "3");
  assert.equal(stats().totalUniquePlayers.integerValue, "1");
  const next = await register("TURFMOOR", "two@example.com");
  await submit(next.data.token, 48);
  assert.equal(stats().totalUniquePlayers.integerValue, "2");
  assert.equal(stats().totalMatchesCompleted.integerValue, "4");
  const board = await invoke("GET");
  assert.equal(board.data.top5[0].username, "CLARET99");
  assert.equal(board.data.totalPlayers, 2);
  assert.ok(!JSON.stringify(board.data).includes("@"));
  assert.equal((await invoke("POST", { action: "submit", matchId: randomUUID(), shots: shots(150) }, token)).code, 400);
});

test("simultaneous submissions preserve the higher score and count both unique matches", async () => {
  const token = (await register("RACEWIN", "race@example.com")).data.token;
  const [lower, higher] = await Promise.all([submit(token, 35), submit(token, 50)]);
  assert.equal(lower.code, 200);
  assert.equal(higher.code, 200);
  assert.equal(player("RACEWIN").bestScore.integerValue, "1000");
  assert.equal(player("RACEWIN").matchesCompleted.integerValue, "2");
  assert.equal((await invoke("GET")).data.statistics.totalMatchesCompleted, 6);
});

test("email verification recovers original account, updates username, and preserves results", async () => {
  const before = player("JERRY123");
  const start = await invoke("POST", { action: "recoveryStart", username: "JERRYNEW", email: "jerry@example.com" });
  assert.equal(start.code, 200);
  assert.equal(emailSends, 1);
  assert.ok(!JSON.stringify(start.data).includes("jerry@example.com"));
  const resent = await invoke("POST", { action: "recoveryStart", username: "JERRYNEW", email: "jerry@example.com" });
  assert.equal(resent.code, 200);
  assert.equal(emailSends, 2); // No silent 90-second suppression.
  const unknown = await invoke("POST", { action: "recoveryStart", username: "UNKNOWN", email: "unknown@example.com" });
  assert.equal(unknown.code, 200);
  assert.equal(emailSends, 2);
  const expiredCode = await invoke("POST", { action: "recoveryFinish", username: "JERRYNEW", email: "jerry@example.com", oobCode: "expired-code" });
  assert.equal(expiredCode.code, 401);
  assert.equal(expiredCode.data.error, "EMAIL LINK EXPIRED");
  const mismatch = await invoke("POST", { action: "recoveryFinish", username: "JERRYNEW", email: "jerry@example.com", oobCode: "mismatch-code" });
  assert.equal(mismatch.code, 401);
  assert.equal(mismatch.data.error, "EMAIL DOES NOT MATCH LINK");
  const wrongCode = await invoke("POST", { action: "recoveryFinish", username: "JERRYNEW", email: "jerry@example.com", oobCode: "bad-code" });
  assert.equal(wrongCode.data.error, "INVALID EMAIL LINK");
  assert.notEqual(wrongCode.code, 200);
  const recovery = await invoke("POST", { action: "recoveryFinish", username: "JERRYNEW", email: "jerry@example.com", oobCode: "valid-code" });
  assert.equal(recovery.code, 200);
  assert.equal(recovery.data.username, "JERRYNEW");
  assert.equal(stores.burnleyMatchdayParticipants.size, 4);
  assert.equal(player("JERRYNEW").email.stringValue, "jerry@example.com");
  assert.equal(player("JERRYNEW").matchesCompleted.integerValue, before.matchesCompleted.integerValue);
  assert.equal((await invoke("GET", null, recovery.data.token, { action: "session" })).data.username, "JERRYNEW");
  const reused = await register("JERRY123", "brandnew@example.com");
  assert.equal(reused.code, 200); // old handle released on rename
});

test("conflicting recovery username can be changed without a second email", async () => {
  const conflict = await invoke("POST", { action: "recoveryFinish", username: "CLARET99", email: "jerry@example.com", oobCode: "valid-code" });
  assert.equal(conflict.code, 200);
  assert.equal(conflict.data.needsUsername, true);
  assert.ok(conflict.data.recoveryTicket);
  const updated = await invoke("POST", { action: "recoveryRename", username: "JERRY2", recoveryTicket: conflict.data.recoveryTicket });
  assert.equal(updated.code, 200);
  assert.equal(updated.data.username, "JERRY2");
  assert.equal((await invoke("POST", { action: "recoveryRename", username: "BAD", recoveryTicket: "wrong" })).code, 401);
  assert.equal((await invoke("POST", { action: "recoveryRename", username: "JERRY3", recoveryTicket: conflict.data.recoveryTicket })).code, 401); // single-use ticket
});

test("closed and upcoming schedule reject registration and score submissions", async () => {
  const token = (await register("TIMED", "timed@example.com")).data.token;
  const end = process.env.COMPETITION_END_AT;
  process.env.COMPETITION_END_AT = "2026-01-02T00:00:00Z";
  assert.equal((await register("LATE", "late@example.com")).data.error, "COMPETITION CLOSED");
  assert.equal((await submit(token, 50)).data.error, "COMPETITION CLOSED");
  assert.equal((await invoke("GET")).data.competition.status, "closed");
  process.env.COMPETITION_END_AT = end;
  const start = process.env.COMPETITION_START_AT;
  process.env.COMPETITION_START_AT = "2030-12-31T00:00:00Z";
  assert.equal((await register("EARLY", "early@example.com")).data.error, "COMPETITION NOT OPEN");
  process.env.COMPETITION_START_AT = start;
});

test("rank tie-breaks follow goals then accuracy", () => {
  const rank = buildLeaderboard([
    { id: "alice", username: "ALICE", points: 420, goalsScored: 2, accuracyTotal: 210, perfectHits: 4, createdAt: "2026-11-18T10:00:00Z" },
    { id: "bob", username: "BOB", points: 420, goalsScored: 3, accuracyTotal: 200, perfectHits: 1, createdAt: "2026-11-18T10:00:00Z" },
  ], "alice");
  assert.equal(rank.myRanking.rank, 2);
  assert.equal(rank.top5[0].username, "BOB");
});

test("half-step meter positions submit odd totals and reject unsupported precision", async () => {
  const token = (await register("ODDSCORE", "odd@example.com")).data.token;
  const oddShots = Array.from({ length: 5 }, () => ({ power: 50, accuracy: 50, goal: true }));
  oddShots[0].power = 49.5;
  const odd = await invoke("POST", { action: "submit", matchId: randomUUID(), shots: oddShots }, token);
  assert.equal(odd.code, 200);
  assert.equal(odd.data.myRanking.score, 999);
  assert.equal(player("ODDSCORE").bestScore.integerValue, "999");
  const invalidShots = oddShots.map((shot) => ({ ...shot }));
  invalidShots[0].power = 49.3;
  const invalid = await invoke("POST", { action: "submit", matchId: randomUUID(), shots: invalidShots }, token);
  assert.equal(invalid.code, 400);
  invalidShots[0].power = "49.5";
  const wrongType = await invoke("POST", { action: "submit", matchId: randomUUID(), shots: invalidShots }, token);
  assert.equal(wrongType.code, 400);
  assert.equal(player("ODDSCORE").matchesCompleted.integerValue, "1");
  const perfect = await submit(token, 50);
  assert.equal(perfect.code, 200);
  assert.equal(player("ODDSCORE").bestScore.integerValue, "1000");
  assert.equal(player("ODDSCORE").matchesCompleted.integerValue, "2");
});

