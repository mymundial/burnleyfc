import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../api/competition.js", import.meta.url), "utf8");
const registration = source.split("export function CompetitionRegistrationModal")[1]?.split("export function CompetitionRecoveryLinkModal")[0];
const verification = source.split("export function CompetitionRecoveryLinkModal")[1]?.split("export function CompetitionAvailabilityModal")[0];

test("recovery copy omits full stops and confirmation is the same white size as the welcome username", () => {
  assert.match(registration, /AN ACCOUNT ALREADY EXISTS WITH THIS EMAIL ADDRESS<\/p>/);
  assert.match(registration, /text-\[clamp\(21px,6vw,28px\)\] text-\[#F5F1E8\]">VERIFY YOUR EMAIL TO CONTINUE<\/p>/);
  assert.doesNotMatch(registration, /VERIFY YOUR EMAIL TO CONTINUE\./);
});

test("recovery errors are temporary text within the cyan button, not a separate error line", () => {
  assert.match(source, /RECOVERY_ERROR_HOLD_MS = 3000/);
  assert.match(verification, /setTimeout\(\(\) => setError\(""\), RECOVERY_ERROR_HOLD_MS\)/);
  assert.match(verification, /aria-live="polite">\{busy \? "VERIFYING\.\.\." : error \|\| \(verifiedTicket \? "CONTINUE" : "VERIFY EMAIL"\)\}/);
  assert.doesNotMatch(verification, /\{error && <p role="alert"/);
  assert.match(registration, /aria-live="polite">\{saving \? "SENDING\.\.\." : error \|\| "SEND SIGN-IN LINK"\}/);
});

test("sending another email link is not silently blocked by a separate per-email cooldown", () => {
  assert.doesNotMatch(api, /acquireRecoveryCooldown|RECOVERY_LIMITS|nextAllowedAt/);
  assert.match(api, /await authRequest\("sendOobCode"/);
  assert.match(api, /await checkRequestRate\(req, "recovery", 20\)/);
});
