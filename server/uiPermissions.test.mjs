import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_SECTION_IDS,
  INFOGRAPHICS_PART_IDS,
  canManageUiPermissions,
  canManageUiPermissionsFor,
  canOpenInfographics,
  defaultSectionsForUser,
  normalizeSavedSections,
  sanitizeSections,
} from "./uiPermissions.js";

test("sanitizeSections keeps only known unique ids", () => {
  assert.deepEqual(sanitizeSections(["listings", "nope", "listings", "leads"]), ["listings", "leads"]);
});

test("normalizeSavedSections expands legacy infographics-only rows", () => {
  const out = normalizeSavedSections(["infographics"]);
  assert.ok(out.includes("infographics"));
  assert.ok(out.includes("ci-owner"));
  assert.ok(out.includes("ci-daily"));
  assert.equal(out.filter((id) => INFOGRAPHICS_PART_IDS.includes(id)).length, INFOGRAPHICS_PART_IDS.length);
});

test("defaultSectionsForUser: full desk gets all sections", () => {
  const out = defaultSectionsForUser({ id: "1", email: "khurram162@gmail.com" });
  assert.equal(out.length, ALL_SECTION_IDS.length);
});

test("defaultSectionsForUser: report-only gets daily report page parts", () => {
  assert.deepEqual(defaultSectionsForUser({ id: "2297" }), ["infographics", "ci-daily"]);
});

test("canOpenInfographics true for any CI part", () => {
  assert.equal(canOpenInfographics(["ci-owner"]), true);
  assert.equal(canOpenInfographics(["listings"]), false);
});

test("canManageUiPermissions is true for every Bitrix admin", () => {
  assert.equal(canManageUiPermissions({ admin: true }), true);
  assert.equal(canManageUiPermissions({ admin: true, id: "8888" }), true);
  assert.equal(canManageUiPermissions({ admin: 1, id: "12" }), true);
  assert.equal(canManageUiPermissions({ admin: true, id: "2311" }), true);
  assert.equal(canManageUiPermissions({ id: "1", email: "khurram162@gmail.com" }), false);
  assert.equal(canManageUiPermissions({ id: "2311", admin: false }), false);
  assert.equal(canManageUiPermissions({ id: "2297" }), false);
  assert.equal(canManageUiPermissions(null), false);
});

test("canManageUiPermissionsFor matches admin-only, even with full sections", async () => {
  const db = {
    async getSetting() {
      return {};
    },
  };
  assert.equal(await canManageUiPermissionsFor(db, { admin: true, id: "1" }), true);
  assert.equal(
    await canManageUiPermissionsFor(db, { id: "1", email: "khurram162@gmail.com", admin: false }),
    false
  );
  assert.equal(await canManageUiPermissionsFor(db, { id: "2311", admin: false }), false);
});
