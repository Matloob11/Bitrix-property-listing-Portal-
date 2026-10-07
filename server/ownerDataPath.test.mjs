import assert from "node:assert/strict";
import test from "node:test";
import { ownerDataListPath } from "./ownerDataPath.js";

test("sale availability opens this agent's Owner Data sale stage", () => {
  const path = ownerDataListPath({
    agentId: 2297,
    purpose: "sale",
    stageIds: ["DT1042_14:SALE"],
    itemIds: ["881", "882"],
  });
  assert.match(path, /^\/crm\/type\/1042\/list\/category\/14\//);
  assert.match(path, /apply_filter=Y/);
  assert.match(path, /ASSIGNED_BY_ID=2297/);
  assert.match(path, /STAGE_ID=DT1042_14%3ASALE|STAGE_ID=DT1042_14:SALE/);
  assert.match(path, /ID/);
  assert.equal(path.includes("RENT"), false);
});

test("total opens the three availability stages for the agent", () => {
  const path = ownerDataListPath({ agentId: "2637" });
  assert.match(path, /ASSIGNED_BY_ID=2637/);
  assert.match(path, /RENT/);
  assert.match(path, /SALE/);
});
