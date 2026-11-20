import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const competition = readFileSync(new URL("../src/components/competition/CompetitionUI.jsx", import.meta.url), "utf8");
const terms = readFileSync(new URL("../src/components/competition/CompetitionTerms.jsx", import.meta.url), "utf8");
const directions = readFileSync(new URL("../src/components/match/FootballGameView.jsx", import.meta.url), "utf8");

test("terms wording is consistent in modal, consent link and document", () => {
  assert.match(competition, /<ModalHeader title="TERMS AND CONDITIONS"/);
  assert.match(competition, /validEmail && termsAccepted/);
  assert.match(competition, />TERMS AND CONDITIONS<\/button>/);
  assert.match(terms, /accept these Terms and Conditions/);
  assert.match(terms, /agree to these Terms and Conditions/);
  assert.doesNotMatch(`${competition}\n${terms}`, /Terms\s*&(?:amp;)?\s*Conditions/i);
});

test("home button panel border matches the inactive game direction controls", () => {
  assert.match(directions, /border-\[1\.5px\]/);
  assert.match(directions, /selected\.id === direction\.id \? "#9CCEEB" : "#934D7B"/);
  const home = competition.split("export function CompetitionHomeOverlay")[1]?.split("function FormInput")[0];
  assert.ok(home);
  assert.match(home, /rounded-\[1\.65rem\] border-\[1\.5px\] border-\[#934D7B\]/);
  assert.doesNotMatch(home, /border-\[#F5F1E8\]\/16/);
});

test("registration submit is outside the input panel but inside its form", () => {
  const registration = competition.split('return <ModalFrame label="Competition registration" entrySized>')[1]?.split("const LB_GRID")[0];
  assert.ok(registration);
  assert.match(registration, /<form onSubmit=\{handleSubmit\} className="flex flex-col gap-3">/);
  assert.match(registration, /<div className=\{`\$\{INNER\} flex flex-col gap-2 p-3`\}>/);
  assert.match(registration, /<\/div>\n\s*\{error && <p[^\n]+\n\s*<button type="submit" disabled=\{saving \|\| !formReady\}/);
  assert.match(registration, /<\/button>\n\s*<\/form>/);
});
