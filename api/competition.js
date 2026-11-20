import { createHmac, createPrivateKey, randomUUID, sign, timingSafeEqual } from "node:crypto";
import { scoreMatchdayAttempts, compareMatchdayScores } from "../src/logic/matchdayScoring.js";

// Server-only credentials are environment variables; never ship them to the client.
// No public/anonymous write access to Firestore is needed for these endpoints.
const FIXTURE = process.env.COMPETITION_FIXTURE_ID || "burnley-preston-matchday";
const PEOPLE = "burnleyMatchdayParticipants";
const HANDLES = "burnleyMatchdayUsernames";
const ATTEMPTS = "burnleyMatchdayAttempts";
let cachedAccessToken = null;
let cachedTokenExpiry = 0;

function config() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const secret = process.env.COMPETITION_TOKEN_SECRET;
  if (!projectId || !clientEmail || !privateKey || !secret || secret.length < 32) {
    throw Object.assign(new Error("Competition backend is not configured"), { status: 503 });
  }
  return { projectId, clientEmail, privateKey, secret };
}
function hmac(payload) { return createHmac("sha256", config().secret).update(payload).digest("hex"); }
function participantId(email) { return hmac(`${FIXTURE}:${email.toLowerCase().trim()}`); }
function usernameId(username) { return hmac(`${FIXTURE}:username:${username.toUpperCase().trim()}`); }
function makeToken(id) {
  const unsigned = Buffer.from(JSON.stringify({ id, fixture: FIXTURE }), "utf8").toString("base64url");
  return `${unsigned}.${hmac(unsigned)}`;
}
function tokenToId(authorization) {
  const token = String(authorization || "").replace(/^Bearer\s+/i, "");
  const [part, mac, extra] = token.split(".");
  if (!part || !mac || extra) throw Object.assign(new Error("Not registered"), { status: 401 });
  const expected = hmac(part);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    throw Object.assign(new Error("Invalid entry token"), { status: 401 });
  }
  let value;
  try { value = JSON.parse(Buffer.from(part, "base64url").toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid entry token"), { status: 401 }); }
  if (!/^[a-f0-9]{64}$/.test(value?.id || "") || value.fixture !== FIXTURE) {
    throw Object.assign(new Error("Entry not valid for this fixture"), { status: 401 });
  }
  return value.id;
}
function b64(input) { return Buffer.from(JSON.stringify(input)).toString("base64url"); }
async function getOAuthToken() {
  if (cachedAccessToken && cachedTokenExpiry > Date.now() + 60_000) return cachedAccessToken;
  const { clientEmail, privateKey } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: "RS256", typ: "JWT" });
  const payload = b64({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3500,
  });
  const unsigned = `${header}.${payload}`;
  const signed = sign("RSA-SHA256", Buffer.from(unsigned), createPrivateKey(privateKey)).toString("base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signed}` }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Could not authorise competition storage");
  cachedAccessToken = data.access_token;
  cachedTokenExpiry = Date.now() + Number(data.expires_in || 3500) * 1000;
  return cachedAccessToken;
}
async function firestore(method, path, body) {
  const { projectId } = config();
  const token = await getOAuthToken();
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents${path}`;
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error?.message || "Competition storage unavailable");
    err.status = response.status;
    throw err;
  }
  return data;
}
function stringField(value) { return { stringValue: String(value ?? "") }; }
function integerField(value) { return { integerValue: String(Math.trunc(Number(value) || 0)) }; }
function booleanField(value) { return { booleanValue: Boolean(value) }; }
function fields(document) {
  const result = {};
  for (const [key, value] of Object.entries(document)) {
    result[key] = typeof value === "boolean" ? booleanField(value) : typeof value === "number" ? integerField(value) : stringField(value);
  }
  return { fields: result };
}
function unpack(document) {
  const values = {};
  for (const [key, value] of Object.entries(document?.fields || {})) {
    values[key] = value.stringValue ?? (value.integerValue !== undefined ? Number(value.integerValue) : value.booleanValue);
  }
  values.id = document?.name?.split("/").pop();
  return values;
}
async function readDocument(collection, id) {
  try { return unpack(await firestore("GET", `/${collection}/${id}`)); }
  catch (error) { if (error.status === 404) return null; throw error; }
}
async function registerUniqueParticipant(id, username, email) {
  const handle = usernameId(username);
  if (await readDocument(PEOPLE, id)) {
    throw Object.assign(new Error("EMAIL ADDRESS ALREADY REGISTERED"), { status: 409 });
  }
  if (await readDocument(HANDLES, handle)) {
    throw Object.assign(new Error("USERNAME ALREADY TAKEN"), { status: 409 });
  }
  const { projectId } = config();
  const prefix = `projects/${projectId}/databases/(default)/documents`;
  const now = new Date().toISOString();
  const newDocument = (collection, documentId, record) => ({
    update: { ...fields(record), name: `${prefix}/${collection}/${documentId}` },
    currentDocument: { exists: false },
  });
  try {
    // A single Firestore commit reserves both the email identity and username
    // atomically. Competing registrations cannot claim the same username.
    await firestore("POST", ":commit", { writes: [
      newDocument(PEOPLE, id, {
        fixture: FIXTURE, username, email, termsAccepted: true,
        termsAcceptedAt: now, termsVersion: "2026-11-20", registeredAt: now, updatedAt: now,
      }),
      newDocument(HANDLES, handle, { fixture: FIXTURE, participantId: id, username }),
    ] });
  } catch (error) {
    // A simultaneous create can fail its precondition between the reads and
    // the commit; resolve it into the same clear field-level error message.
    if ([400, 409, 412].includes(error.status)) {
      if (await readDocument(PEOPLE, id)) {
        throw Object.assign(new Error("EMAIL ADDRESS ALREADY REGISTERED"), { status: 409 });
      }
      if (await readDocument(HANDLES, handle)) {
        throw Object.assign(new Error("USERNAME ALREADY TAKEN"), { status: 409 });
      }
    }
    throw error;
  }
}
async function listAttempts() {
  const rows = [];
  let pageToken = "";
  for (let i = 0; i < 100; i++) { // up to 20k attempts; deliberate pilot ceiling
    const suffix = `?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    let data;
    try { data = await firestore("GET", `/${ATTEMPTS}${suffix}`); }
    catch (error) { if (error.status === 404) return rows; throw error; }
    for (const doc of data.documents || []) {
      const row = unpack(doc);
      if (row.fixture === FIXTURE) rows.push(row);
    }
    if (!data.nextPageToken) return rows;
    pageToken = data.nextPageToken;
  }
  throw Object.assign(new Error("Leaderboard capacity reached"), { status: 503 });
}
export function buildLeaderboard(attempts, participant = null) {
  const best = new Map();
  for (const attempt of attempts) {
    const previous = best.get(attempt.participantId);
    if (!previous || compareMatchdayScores(attempt, previous) < 0 ||
        (compareMatchdayScores(attempt, previous) === 0 && String(attempt.createdAt) < String(previous.createdAt))) {
      best.set(attempt.participantId, attempt);
    }
  }
  const ordered = [...best.values()].sort((a, b) =>
    compareMatchdayScores(a, b) || String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)));
  const rows = ordered.map((entry, i) => ({
    id: entry.participantId,
    rank: i + 1,
    username: String(entry.username || "PLAYER").slice(0, 12),
    score: Number(entry.points),
  }));
  const mine = participant ? rows.find((row) => row.id === participant) || null : null;
  return { myRanking: mine, top5: rows.slice(0, 5).map((row) => ({ ...row, isUser: row.id === participant })), totalPlayers: rows.length };
}
function fail(res, error) {
  const status = error?.status >= 400 && error.status < 600 ? error.status : 503;
  // Do not surface Google errors or private identifiers in the response.
  const allowedConflicts = ["USERNAME ALREADY TAKEN", "EMAIL ADDRESS ALREADY REGISTERED"];
  res.status(status).json({ error: status === 401 ? "ENTRY EXPIRED OR NOT REGISTERED"
    : status === 409 && allowedConflicts.includes(error.message) ? error.message
    : status === 400 ? error.message : "COMPETITION SERVICE UNAVAILABLE" });
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    config();
    if (req.method === "GET") {
      let participant = null;
      if (req.headers.authorization) participant = tokenToId(req.headers.authorization);
      const list = await listAttempts();
      return res.status(200).json(buildLeaderboard(list, participant));
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
    if (Number(req.headers["content-length"] || 0) > 8_000) return res.status(413).json({ error: "Request too large" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (body.action === "register") {
      const username = String(body.username || "").toUpperCase().trim();
      const email = String(body.email || "").toLowerCase().trim();
      if (!/^[A-Z0-9]{1,12}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.termsAccepted !== true) {
        return res.status(400).json({ error: "VALID USERNAME AND EMAIL REQUIRED" });
      }
      const id = participantId(email);
      await registerUniqueParticipant(id, username, email);
      return res.status(200).json({ token: makeToken(id), username });
    }
    if (body.action === "submit") {
      const id = tokenToId(req.headers.authorization);
      const person = await readDocument(PEOPLE, id);
      if (!person || person.fixture !== FIXTURE) return res.status(401).json({ error: "ENTRY NOT REGISTERED" });
      if (!Array.isArray(body.shots) || body.shots.length !== 5 || body.shots.some((shot) =>
        !shot || !Number.isInteger(shot.power) || shot.power < 0 || shot.power > 100 ||
        !Number.isInteger(shot.accuracy) || shot.accuracy < 0 || shot.accuracy > 100 ||
        typeof shot.goal !== "boolean")) {
        return res.status(400).json({ error: "FIVE VALID PENALTIES REQUIRED" });
      }
      const summary = scoreMatchdayAttempts({ user: body.shots.map((shot) => ({ powerValue: shot.power, accuracyValue: shot.accuracy, goal: shot.goal })) });
      const attemptId = randomUUID();
      await firestore("POST", `/${ATTEMPTS}?documentId=${attemptId}`, fields({
        fixture: FIXTURE, participantId: id, username: person.username,
        points: summary.points, goalsScored: summary.goalsScored,
        accuracyTotal: summary.accuracyTotal, powerTotal: summary.powerTotal, perfectHits: summary.perfectHits,
        // Store stop values privately to assist auditing; never return them to other players.
        shotStops: JSON.stringify(body.shots), createdAt: new Date().toISOString(),
      }));
      return res.status(200).json(buildLeaderboard(await listAttempts(), id));
    }
    return res.status(400).json({ error: "UNKNOWN ACTION" });
  } catch (error) { return fail(res, error); }
}
