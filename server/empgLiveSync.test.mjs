import assert from "node:assert/strict";
import test from "node:test";
import { extractAgencyRefs } from "./empgLiveSync.js";

test("extractAgencyRefs picks A7 references from portal HTML", () => {
  const html = `
    <a href="/property/details-123.html">a7group-1820</a>
    ref: A7GROUP-1675
    duplicate a7group-1820
    ignore listing-99
  `;
  const refs = extractAgencyRefs(html);
  assert.equal(refs.has("a7group-1820"), true);
  assert.equal(refs.has("a7group-1675"), true);
  assert.equal(refs.size, 2);
});
