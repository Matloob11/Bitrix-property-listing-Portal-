import assert from "node:assert/strict";
import test from "node:test";
import { listingCopyErrors, listingPublishError, primaryBedCount } from "./listingErrors.js";

test("description 4 bedrooms vs specs 3 is a publish error", () => {
  const errors = listingCopyErrors({
    beds: 3,
    title: "Spacious apartment in JVC",
    description: "This unit has 4 Bedrooms and a maid room.",
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Description says 4 Bedrooms/);
  assert.match(errors[0].message, /specifications say 3 Bedrooms/);
  assert.match(listingPublishError({ beds: 3, description: "Beautiful 4BR hall" }), /4 Bedrooms/);
});

test("matching copy does not block publish", () => {
  assert.deepEqual(
    listingCopyErrors({
      beds: 3,
      title: "3 Bedroom villa in Serena",
      description: "Spacious 3 bedrooms with maid. Close to 4 bedroom villas.",
    }),
    []
  );
});

test("title mismatch is caught even if description is empty", () => {
  const errors = listingCopyErrors({ beds: 2, title: "Luxury 4 Bedroom Apartment" });
  assert.equal(errors[0].field, "title");
  assert.equal(errors[0].found, 4);
});

test("studio specs match studio copy and ignore Studio City", () => {
  assert.equal(primaryBedCount("Bright studio apartment for rent"), 0);
  assert.deepEqual(
    listingCopyErrors({
      beds: 1,
      title: "1 Bedroom in Dubai Studio City",
      description: "One 1 bedroom hall in Dubai Studio City.",
    }),
    []
  );
});

test("Arabic bedroom count is checked", () => {
  const errors = listingCopyErrors({
    beds: 3,
    description_ar: "شقة واسعة 4 غرف نوم",
  });
  assert.equal(errors[0].found, 4);
});

test("no bedroom words means no detector error", () => {
  assert.equal(listingPublishError({ beds: 3, title: "Bright home", description: "Great view" }), "");
});
