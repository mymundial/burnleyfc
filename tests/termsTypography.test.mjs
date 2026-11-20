import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const terms = readFileSync(new URL("../src/components/competition/CompetitionTerms.jsx", import.meta.url), "utf8");

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(escaped + "\\s*\\{([^}]*)\\}"));
  assert.ok(m, `Missing CSS rule: ${selector}`);
  return m[1];
}

test("Denim weight declarations use separate light and regular licensed file paths", () => {
  assert.match(css, /DenimWD-Light\.otf/);
  assert.match(css, /DenimWD-Regular\.otf/);
  assert.match(css, /font-weight: 300/);
  assert.match(css, /font-weight: 400/);
});

test("terms typography is scoped and has agreed sizes and spacing", () => {
  const body = rule(".burnley-terms-body");
  assert.match(body, /font-size: 14px/);
  assert.match(body, /line-height: 1\.6/);
  const heading = rule(".burnley-terms-body h3");
  assert.match(heading, /font-weight: 300/);
  assert.match(heading, /font-size: 18px/);
  assert.match(heading, /text-transform: uppercase/);
  assert.match(heading, /margin: 0 0 12px/);
  assert.match(rule(".burnley-terms-body > section + section"), /margin-top: 24px/);
  assert.match(rule(".burnley-terms-body section > :not(h3) + :not(h3)"), /margin-top: 10px/);
});

test("15 term sections preserve paragraph structure without National heading override", () => {
  assert.equal((terms.match(/<section>/g) || []).length, 15);
  assert.equal((terms.match(/<h3>/g) || []).length, 15);
  assert.doesNotMatch(terms, /home-copy-bold/);
  assert.ok((terms.match(/<p>/g) || []).length > 15);
});
