import { createHmac, createPrivateKey, randomBytes, sign, timingSafeEqual } from "node:crypto";
import { scoreMatchdayAttempts, compareMatchdayScores } from "../src/logic/matchdayScoring.js";

// Only server credentials can read/write these collections. Each deployment
// has an isolated Firebase project and a unique COMPETITION_FIXTURE_ID.
const PEOPLE = "burnleyMatchdayParticipants";
const HANDLES = "burnleyMatchdayUsernames";
const SUBMISSIONS = "burnleyMatchdaySubmissions";
const STATISTICS = "burnleyMatchdayStatistics";
const LIMITS = "burnleyMatchdayRequestLimits";
let cachedAccessToken = null;
let cachedTokenExpiry = 0;
let cachedTokenKey = "";

function issue(message, status = 400) { return Object.assign(new Error(message), { status }); }
function config() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const secret = process.env.COMPETITION_TOKEN_SECRET;
  const fixture = process.env.COMPETITION_FIXTURE_ID || "burnley-preston-matchday";
  if (!projectId || !clientEmail || !privateKey || !secret || secret.length < 32 || !/^[a-z0-9][a-z0-9-]{2,80}$/i.test(fixture)) {
    throw issue("Competition backend is not configured", 503);
  }
  return { projectId, clientEmail, privateKey, secret, fixture };
}
function hmac(payload) { return createHmac("sha256", config().secret).update(payload).digest("hex"); }
function emailId(email) { return hmac(`${config().fixture}:${email.toLowerCase().trim()}`); }
function usernameId(username) { return hmac(`${config().fixture}:username:${username.toUpperCase().trim()}`); }
function submissionId(id, nonce) { return hmac(`${config().fixture}:submission:${id}:${nonce}`); }
function docName(collection, id) { return `projects/${config().projectId}/databases/(default)/documents/${collection}/${id}`; }
function makeToken(id) {
  const unsigned = Buffer.from(JSON.stringify({ id, fixture: config().fixture, expiresAt: Date.now() + 30 * 24 * 60 * 60_000 }), "utf8").toString("base64url");
  return `${unsigned}.${hmac(unsigned)}`;
}
function tokenToId(authorization) {
  const token = String(authorization || "").replace(/^Bearer\s+/i, "");
  const [part, mac, extra] = token.split(".");
  if (!part || !mac || extra) throw issue("Not registered", 401);
  const expected = hmac(part);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) throw issue("Invalid entry token", 401);
  let value;
  try { value = JSON.parse(Buffer.from(part, "base64url").toString("utf8")); }
  catch { throw issue("Invalid entry token", 401); }
  if (!/^[a-f0-9]{64}$/.test(value?.id || "") || value.fixture !== config().fixture || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) throw issue("Entry not valid for this fixture", 401);
  return value.id;
}
async function recoveryTicket(id) {
  const nonce = randomBytes(24).toString("base64url");
  const until = Date.now() + 10 * 60_000;
  for (let attempts = 0; attempts < 6; attempts++) {
    const person = await requireRegistered(id);
    try {
      await firestore("POST", ":commit", { writes: [updateWrite(PEOPLE, id, {
        recoveryNonceHash: hmac(nonce), recoveryNonceExpiresAt: until,
      }, person.__updateTime)] });
      const part = Buffer.from(JSON.stringify({ id, fixture: config().fixture, until, purpose: "recovery-rename", nonce })).toString("base64url");
      return `${part}.${hmac(part)}`;
    } catch (error) { if (!isConflict(error)) throw error; }
  }
  throw issue("PLEASE TRY AGAIN", 503);
}
function recoveryTicketToIdentity(ticket) {
  const [body, signature, extra] = String(ticket || "").split(".");
  if (!body || !signature || extra || signature.length !== 64) throw issue("RECOVERY EXPIRED", 401);
  const expected = hmac(body);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw issue("RECOVERY EXPIRED", 401);
  let payload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { throw issue("RECOVERY EXPIRED", 401); }
  if (payload.fixture !== config().fixture || payload.purpose !== "recovery-rename" || !Number.isFinite(payload.until) || payload.until < Date.now() || !/^[a-f0-9]{64}$/.test(payload.id) || !/^[A-Za-z0-9_-]{32}$/.test(payload.nonce)) throw issue("RECOVERY EXPIRED", 401);
  return { id: payload.id, nonce: payload.nonce };
}
function competitionSchedule() {
  const start = process.env.COMPETITION_START_AT;
  const end = process.env.COMPETITION_END_AT;
  const parse = (v) => typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.test(v) ? Date.parse(v) : NaN;
  const starts = parse(start);
  const ends = parse(end);
  if (!Number.isFinite(starts) || !Number.isFinite(ends) || starts >= ends) return { status: "unconfigured", startAt: null, endAt: null };
  const now = Date.now();
  return { status: now < starts ? "upcoming" : now >= ends ? "closed" : "open", startAt: new Date(starts).toISOString(), endAt: new Date(ends).toISOString() };
}
function requireOpen() {
  const { status } = competitionSchedule();
  if (status === "unconfigured") throw issue("COMPETITION NOT CONFIGURED", 503);
  if (status === "upcoming") throw issue("COMPETITION NOT OPEN", 403);
  if (status === "closed") throw issue("COMPETITION CLOSED", 403);
}
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
async function getOAuthToken() {
  const { clientEmail, privateKey } = config();
  if (cachedAccessToken && cachedTokenKey === clientEmail && cachedTokenExpiry > Date.now() + 60_000) return cachedAccessToken;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3500,
  })}`;
  const signed = sign("RSA-SHA256", Buffer.from(unsigned), createPrivateKey(privateKey)).toString("base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signed}` }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw issue("Could not authorise competition storage", 503);
  cachedAccessToken = data.access_token;
  cachedTokenExpiry = Date.now() + Number(data.expires_in || 3500) * 1000;
  cachedTokenKey = clientEmail;
  return cachedAccessToken;
}
async function firestore(method, path, body) {
  const { projectId } = config();
  const token = await getOAuthToken();
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = issue(data?.error?.message || "Competition storage unavailable", response.status);
    error.code = data?.error?.status;
    throw error;
  }
  return data;
}
const stringField = (value) => ({ stringValue: String(value ?? "") });
const integerField = (value) => ({ integerValue: String(Math.trunc(Number(value) || 0)) });
const booleanField = (value) => ({ booleanValue: Boolean(value) });
function fields(document) {
  return { fields: Object.fromEntries(Object.entries(document).map(([key, value]) => [key, typeof value === "boolean" ? booleanField(value) : typeof value === "number" ? integerField(value) : stringField(value)])) };
}
function unpack(document) {
  const values = {};
  for (const [key, value] of Object.entries(document?.fields || {})) values[key] = value.stringValue ?? (value.integerValue !== undefined ? Number(value.integerValue) : value.booleanValue);
  values.id = document?.name?.split("/").pop();
  values.__updateTime = document?.updateTime;
  return values;
}
async function readDocument(collection, id) {
  try { return unpack(await firestore("GET", `/${collection}/${id}`)); }
  catch (error) { if (error.status === 404) return null; throw error; }
}
function createWrite(collection, id, record) {
  return { update: { name: docName(collection, id), ...fields(record) }, currentDocument: { exists: false } };
}
function updateWrite(collection, id, record, version) {
  return { update: { name: docName(collection, id), ...fields(record) }, updateMask: { fieldPaths: Object.keys(record) }, currentDocument: { updateTime: version } };
}
function isConflict(error) { return error.status === 409 || error.status === 412 || error.code === "FAILED_PRECONDITION"; }
function validUsername(value) { return /^[A-Z0-9]{1,12}$/.test(value); }
function validEmail(value) { return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function normaliseUsername(value) { return String(value || "").toUpperCase().trim(); }
function normaliseEmail(value) { return String(value || "").toLowerCase().trim(); }

// Durable, optimistic Firestore-backed per-IP rate limiter: works across Vercel instances.
async function checkRequestRate(req, scope, maximum = 50, windowMs = 10 * 60_000) {
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 128);
  const id = hmac(`${config().fixture}:limit:${scope}:${ip}`);
  for (let tries = 0; tries < 5; tries++) {
    const row = await readDocument(LIMITS, id);
    const now = Date.now();
    const active = row && Number(row.windowEnd) > now;
    if (active && Number(row.count) >= maximum) throw issue("TOO MANY REQUESTS. PLEASE TRY LATER", 429);
    const data = { count: active ? Number(row.count) + 1 : 1, windowEnd: active ? Number(row.windowEnd) : now + windowMs };
    try {
      await firestore("POST", ":commit", { writes: [row ? updateWrite(LIMITS, id, data, row.__updateTime) : createWrite(LIMITS, id, data)] });
      return;
    } catch (error) { if (!isConflict(error)) throw error; }
  }
  throw issue("PLEASE TRY AGAIN", 503);
}
async function registerUniqueParticipant(id, username, email) {
  if (await readDocument(PEOPLE, id)) throw issue("EMAIL ADDRESS ALREADY REGISTERED", 409);
  const handle = usernameId(username);
  if (await readDocument(HANDLES, handle)) throw issue("USERNAME ALREADY TAKEN", 409);
  const now = new Date().toISOString();
  try {
    await firestore("POST", ":commit", { writes: [
      createWrite(PEOPLE, id, { fixture: config().fixture, username, email, termsAccepted: true, termsAcceptedAt: now, termsVersion: "2026-11-20", registeredAt: now, updatedAt: now, matchesCompleted: 0 }),
      createWrite(HANDLES, handle, { fixture: config().fixture, participantId: id, username }),
    ] });
  } catch (error) {
    if (isConflict(error)) {
      if (await readDocument(PEOPLE, id)) throw issue("EMAIL ADDRESS ALREADY REGISTERED", 409);
      if (await readDocument(HANDLES, handle)) throw issue("USERNAME ALREADY TAKEN", 409);
    }
    throw error;
  }
}
async function requireRegistered(id) {
  const person = await readDocument(PEOPLE, id);
  if (!person || person.fixture !== config().fixture) throw issue("ENTRY NOT REGISTERED", 401);
  return person;
}
async function renameParticipant(id, newUsername, verifiedNonce = null) {
  if (!validUsername(newUsername)) throw issue("VALID USERNAME REQUIRED", 400);
  for (let tries = 0; tries < 6; tries++) {
    const person = await requireRegistered(id);
    if (verifiedNonce && (person.recoveryNonceHash !== hmac(verifiedNonce) || Number(person.recoveryNonceExpiresAt) < Date.now())) throw issue("RECOVERY EXPIRED", 401);
    if (person.username === newUsername && !verifiedNonce) return person;
    const newHandleId = usernameId(newUsername);
    const target = await readDocument(HANDLES, newHandleId);
    if (target && target.participantId !== id) throw issue("USERNAME ALREADY TAKEN", 409);
    const oldHandleId = usernameId(person.username);
    const oldHandle = await readDocument(HANDLES, oldHandleId);
    const updated = { username: newUsername, updatedAt: new Date().toISOString() };
    if (verifiedNonce) Object.assign(updated, { recoveryNonceHash: "", recoveryNonceExpiresAt: 0 });
    const writes = [updateWrite(PEOPLE, id, updated, person.__updateTime)];
    if (oldHandle && oldHandleId !== newHandleId) writes.push({ delete: docName(HANDLES, oldHandleId), currentDocument: { updateTime: oldHandle.__updateTime } });
    if (!target) writes.push(createWrite(HANDLES, newHandleId, { fixture: config().fixture, participantId: id, username: newUsername }));
    try {
      await firestore("POST", ":commit", { writes });
      return { ...person, username: newUsername };
    } catch (error) { if (!isConflict(error)) throw error; }
  }
  throw issue("PLEASE TRY AGAIN", 503);
}
async function listParticipants() {
  const rows = [];
  let pageToken = "";
  for (let i = 0; i < 100; i++) {
    const suffix = `?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    let response;
    try { response = await firestore("GET", `/${PEOPLE}${suffix}`); }
    catch (error) { if (error.status === 404) return rows; throw error; }
    for (const item of response.documents || []) {
      const row = unpack(item);
      if (row.fixture === config().fixture && Number.isInteger(row.bestScore)) rows.push(row);
    }
    if (!response.nextPageToken) return rows;
    pageToken = response.nextPageToken;
  }
  throw issue("Leaderboard capacity reached", 503);
}

// Submission + player progress + overall statistics are committed atomically.
// A stable client matchId makes retries and simultaneous requests idempotent.
async function recordCompletedMatch(id, matchId, summary) {
  const attemptId = submissionId(id, matchId);
  for (let tries = 0; tries < 8; tries++) {
    if (await readDocument(SUBMISSIONS, attemptId)) return;
    const person = await requireRegistered(id);
    const played = Number(person.matchesCompleted || 0);
    const best = !Number.isInteger(person.bestScore) || summary.points > person.bestScore;
    const time = new Date().toISOString();
    const updated = { matchesCompleted: played + 1, updatedAt: time };
    if (best) Object.assign(updated, { bestScore: summary.points, goalsScored: summary.goalsScored, accuracyTotal: summary.accuracyTotal, perfectHits: summary.perfectHits, bestScoreRecordedAt: time });
    const statsName = docName(STATISTICS, "overall");
    const writes = [
      createWrite(SUBMISSIONS, attemptId, { fixture: config().fixture, participantId: id, submittedAt: time }),
      updateWrite(PEOPLE, id, updated, person.__updateTime),
      {
        update: { name: statsName, ...fields({ fixture: config().fixture, updatedAt: time }) },
        updateMask: { fieldPaths: ["fixture", "updatedAt"] },
        updateTransforms: [
          { fieldPath: "totalMatchesCompleted", increment: integerField(1) },
          { fieldPath: "totalUniquePlayers", increment: integerField(played === 0 ? 1 : 0) },
        ],
      },
    ];
    try { await firestore("POST", ":commit", { writes }); return; }
    catch (error) { if (!isConflict(error)) throw error; }
  }
  // It may have completed successfully during a concurrent retry.
  if (await readDocument(SUBMISSIONS, attemptId)) return;
  throw issue("Score submission temporarily busy", 503);
}

// Firebase Authentication email-link recovery: no password and no email
// verification barrier for first registration. Auth may create its user when
// the link is first redeemed; Firestore remains the source of player identity.
function authConfig() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const publicUrl = process.env.COMPETITION_PUBLIC_URL;
  if (!apiKey || !publicUrl) throw issue("EMAIL RECOVERY NOT CONFIGURED", 503);
  let url;
  try { url = new URL(publicUrl); } catch { throw issue("EMAIL RECOVERY NOT CONFIGURED", 503); }
  if ((url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) || url.username || url.password || url.search || url.hash) throw issue("EMAIL RECOVERY NOT CONFIGURED", 503);
  return { apiKey, publicUrl: url.origin };
}
async function authRequest(action, body) {
  const { apiKey } = authConfig();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Distinguish an expired/used link from other Firebase configuration or
    // service failures. Never log email addresses, action codes or ID tokens.
    const providerReason = String(data?.error?.message || "").split(":")[0].trim();
    console.warn("Firebase recovery request rejected", {
      action,
      status: response.status,
      reason: /^[A-Z0-9_]+$/.test(providerReason) ? providerReason : "UNCLASSIFIED",
    });
    if (action === "signInWithEmailLink" && response.status < 500) {
      if (providerReason === "EXPIRED_OOB_CODE") throw issue("EMAIL LINK EXPIRED", 401);
      if (providerReason === "EMAIL_MISMATCH") throw issue("EMAIL DOES NOT MATCH LINK", 401);
      if (providerReason === "INVALID_OOB_CODE") throw issue("INVALID EMAIL LINK", 401);
      if (providerReason === "TOO_MANY_ATTEMPTS_TRY_LATER") throw issue("TOO MANY REQUESTS. PLEASE TRY LATER", 429);
      if (providerReason === "OPERATION_NOT_ALLOWED" || providerReason === "INVALID_API_KEY") throw issue("EMAIL RECOVERY UNAVAILABLE", 503);
      throw issue("INVALID EMAIL LINK", 401);
    }
    throw issue("EMAIL RECOVERY UNAVAILABLE", 503);
  }
  return data;
}
async function sendRecoveryLink(email, desiredUsername) {
  // Do not generate links for unregistered addresses. Always return the same
  // generic response so this API does not disclose whether an email exists.
  const id = emailId(email);
  const person = await readDocument(PEOPLE, id);
  if (!person || person.fixture !== config().fixture) return;
  const { publicUrl } = authConfig();
  const next = new URL(publicUrl);
  next.searchParams.set("recoveryUsername", desiredUsername);
  await authRequest("sendOobCode", { requestType: "EMAIL_SIGNIN", email, continueUrl: next.toString(), canHandleCodeInApp: true });
}
async function confirmRecovery(email, code, username) {
  const result = await authRequest("signInWithEmailLink", { email, oobCode: code });
  if (normaliseEmail(result.email) !== email || !result.idToken || !result.localId) throw issue("INVALID EMAIL LINK", 401);
  const id = emailId(email);
  await requireRegistered(id);
  try {
    const person = await renameParticipant(id, username);
    return { token: makeToken(id), username: person.username, fixtureId: config().fixture };
  } catch (error) {
    if (error.status === 409 && error.message === "USERNAME ALREADY TAKEN") {
      return { needsUsername: true, username: (await requireRegistered(id)).username, recoveryTicket: await recoveryTicket(id) };
    }
    throw error;
  }
}
export function buildLeaderboard(attempts, participant = null) {
  const best = new Map();
  for (const entry of attempts) {
    const id = entry.participantId || entry.id;
    if (!id || (entry.bestScore === undefined && entry.points === undefined)) continue;
    const attempt = { ...entry, participantId: id, points: entry.bestScore ?? entry.points, createdAt: entry.bestScoreRecordedAt ?? entry.createdAt };
    const previous = best.get(id);
    if (!previous || compareMatchdayScores(attempt, previous) < 0 || (compareMatchdayScores(attempt, previous) === 0 && String(attempt.createdAt) < String(previous.createdAt))) best.set(id, attempt);
  }
  const ordered = [...best.values()].sort((a, b) => compareMatchdayScores(a, b) || String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)));
  const rows = ordered.map((entry, index) => ({ id: entry.participantId, rank: index + 1, username: String(entry.username || "PLAYER").slice(0, 12), score: Number(entry.points) }));
  return { myRanking: participant ? rows.find((row) => row.id === participant) || null : null, top5: rows.slice(0, 5).map((row) => ({ ...row, isUser: row.id === participant })), totalPlayers: rows.length };
}
function sendError(res, error) {
  const status = Number(error?.status) >= 400 && Number(error.status) < 600 ? Number(error.status) : 503;
  const allowed = ["USERNAME ALREADY TAKEN", "EMAIL ADDRESS ALREADY REGISTERED", "COMPETITION NOT OPEN", "COMPETITION CLOSED", "VALID USERNAME REQUIRED", "RECOVERY EXPIRED", "INVALID EMAIL LINK", "EMAIL LINK EXPIRED", "EMAIL DOES NOT MATCH LINK", "TOO MANY REQUESTS. PLEASE TRY LATER", "FIVE VALID PENALTIES REQUIRED", "VALID USERNAME AND EMAIL REQUIRED"];
  const message = status === 401 ? (["RECOVERY EXPIRED", "INVALID EMAIL LINK", "EMAIL LINK EXPIRED", "EMAIL DOES NOT MATCH LINK"].includes(error.message) ? error.message : "ENTRY EXPIRED OR NOT REGISTERED") : allowed.includes(error.message) ? error.message : status === 503 ? "COMPETITION SERVICE UNAVAILABLE" : "REQUEST FAILED";
  return res.status(status).json({ error: message });
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    config();
    const action = req.method === "GET" ? String(req.query?.action || "") : "";
    if (req.method === "GET" && action === "session") {
      const person = await requireRegistered(tokenToId(req.headers.authorization));
      return res.status(200).json({ username: person.username, fixtureId: config().fixture });
    }
    if (req.method === "GET") {
      const participant = req.headers.authorization ? tokenToId(req.headers.authorization) : null;
      const rows = await listParticipants();
      const stats = await readDocument(STATISTICS, "overall");
      return res.status(200).json({ ...buildLeaderboard(rows, participant), fixtureId: config().fixture, competition: competitionSchedule(), statistics: { totalMatchesCompleted: Number(stats?.totalMatchesCompleted || 0), totalUniquePlayers: Number(stats?.totalUniquePlayers || 0) } });
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
    if (Number(req.headers["content-length"] || 0) > 8_000) return res.status(413).json({ error: "Request too large" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (body.action === "register") {
      requireOpen();
      await checkRequestRate(req, "register");
      const username = normaliseUsername(body.username);
      const email = normaliseEmail(body.email);
      if (!validUsername(username) || !validEmail(email) || body.termsAccepted !== true) throw issue("VALID USERNAME AND EMAIL REQUIRED", 400);
      const id = emailId(email);
      await registerUniqueParticipant(id, username, email);
      return res.status(200).json({ token: makeToken(id), username, fixtureId: config().fixture });
    }
    if (body.action === "recoveryStart") {
      requireOpen();
      await checkRequestRate(req, "recovery", 20);
      const email = normaliseEmail(body.email);
      const username = normaliseUsername(body.username);
      if (!validEmail(email) || !validUsername(username)) throw issue("VALID USERNAME AND EMAIL REQUIRED", 400);
      await sendRecoveryLink(email, username);
      return res.status(200).json({ message: "IF AN ACCOUNT EXISTS, A SIGN-IN LINK HAS BEEN SENT" });
    }
    if (body.action === "recoveryFinish") {
      requireOpen();
      const email = normaliseEmail(body.email);
      const username = normaliseUsername(body.username);
      const code = String(body.oobCode || "");
      if (!validEmail(email) || !validUsername(username) || !/^[A-Za-z0-9_-]{6,2048}$/.test(code)) throw issue("INVALID EMAIL LINK", 400);
      return res.status(200).json(await confirmRecovery(email, code, username));
    }
    if (body.action === "recoveryRename") {
      requireOpen();
      const { id, nonce } = recoveryTicketToIdentity(body.recoveryTicket);
      const person = await renameParticipant(id, normaliseUsername(body.username), nonce);
      return res.status(200).json({ token: makeToken(id), username: person.username, fixtureId: config().fixture });
    }
    if (body.action === "submit") {
      requireOpen();
      const id = tokenToId(req.headers.authorization);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(body.matchId || "")) ||
          !Array.isArray(body.shots) || body.shots.length !== 5 || body.shots.some((shot) => !shot || typeof shot.power !== "number" || !Number.isInteger(shot.power * 2) || shot.power < 0 || shot.power > 100 || typeof shot.accuracy !== "number" || !Number.isInteger(shot.accuracy * 2) || shot.accuracy < 0 || shot.accuracy > 100 || typeof shot.goal !== "boolean")) {
        throw issue("FIVE VALID PENALTIES REQUIRED", 400);
      }
      const summary = scoreMatchdayAttempts({ user: body.shots.map((shot) => ({ powerValue: shot.power, accuracyValue: shot.accuracy, goal: shot.goal })) });
      await recordCompletedMatch(id, body.matchId, summary);
      const rows = await listParticipants();
      const stats = await readDocument(STATISTICS, "overall");
      return res.status(200).json({ ...buildLeaderboard(rows, id), fixtureId: config().fixture, competition: competitionSchedule(), statistics: { totalMatchesCompleted: Number(stats?.totalMatchesCompleted || 0), totalUniquePlayers: Number(stats?.totalUniquePlayers || 0) } });
    }
    throw issue("UNKNOWN ACTION", 400);
  } catch (error) { return sendError(res, error); }
}
