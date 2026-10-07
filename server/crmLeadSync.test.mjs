import assert from "node:assert/strict";
import test from "node:test";
import {
  crmDateToIso,
  crmLeadId,
  crmLeadName,
  crmPortalSource,
  isPfCrmSource,
  mapCrmPortalLead,
  pullCrmPortalLeads,
} from "./crmLeadSync.js";
import { leadPortal } from "./leadPortal.js";
import { leadView } from "./leadRecording.js";

test("Bayut and Dubizzle sources map; Property Finder sources stay out", () => {
  assert.deepEqual(crmPortalSource("UC_Y3VNS9"), { id: "UC_Y3VNS9", portal: "bayut", channel: "whatsapp" });
  assert.deepEqual(crmPortalSource("UC_JPSVQU"), { id: "UC_JPSVQU", portal: "dubizzle", channel: "call" });
  assert.equal(crmPortalSource("UC_KQ0WO3"), null);
  assert.equal(isPfCrmSource("UC_KQ0WO3"), true);
  assert.equal(isPfCrmSource("UC_Y3VNS9"), false);
});

test("CRM portal lead becomes a desk row with crm id and Bayut tag", () => {
  const lead = mapCrmPortalLead(
    {
      ID: "88001",
      TITLE: "Bayut WhatsApp — Sara Ali — A7-100",
      NAME: "Sara",
      LAST_NAME: "Ali",
      SOURCE_ID: "UC_Y3VNS9",
      STATUS_ID: "NEW",
      DATE_CREATE: "2026-09-10 11:30:00",
      PHONE: [{ VALUE: "+971501112222" }],
      EMAIL: [{ VALUE: "sara@example.com" }],
      UF_CRM_1760707563281: "A7-100",
    },
    new Map([["a7-100", { id: "lst-1", reference: "A7-100" }]])
  );
  assert.equal(lead.id, "crm-88001");
  assert.equal(lead.bitrix_id, "88001");
  assert.equal(lead.channel, "whatsapp");
  assert.equal(lead.entity_type, "bayut");
  assert.deepEqual(lead.tags, ["bayut"]);
  assert.equal(lead.sender_name, "Sara Ali");
  assert.equal(lead.sender_phone, "+971501112222");
  assert.equal(lead.listing_id, "lst-1");
  assert.equal(lead.reference, "A7-100");
  assert.equal(leadPortal(lead), "bayut");
  assert.match(lead.created_at, /^2026-09-10T/);
});

test("Property Finder CRM rows are not imported again", () => {
  assert.equal(mapCrmPortalLead({ ID: "1", SOURCE_ID: "UC_KQ0WO3", TITLE: "PF" }), null);
  assert.equal(crmLeadId(""), "");
  assert.equal(crmLeadName({ TITLE: "Bayut WhatsApp — Omar" }), "Omar");
  assert.match(crmDateToIso("2026-09-01 08:00:00"), /^2026-09-01T/);
});

test("Personal CRM source lands as other, not Property Finder", () => {
  const lead = mapCrmPortalLead({
    ID: "12",
    TITLE: "Personal WhatsApp",
    SOURCE_ID: "UC_7J0E2Q",
    DATE_CREATE: "2026-09-03 09:00:00",
  });
  assert.equal(lead.entity_type, "other");
  assert.equal(leadPortal(lead), "other");
});

test("pull skips Property Finder sources and upserts Bayut pages", async () => {
  const saved = [];
  const db = {
    getSetting: async () => ({}),
    setSetting: async () => {},
    all: async () => [],
    upsertLeads: async (rows) => {
      saved.push(...rows);
      return rows.length;
    },
  };
  const bx = async (_user, method, params) => {
    assert.equal(method, "crm.lead.list");
    if (params.filter.SOURCE_ID === "UC_Y3VNS9" && params.start === 0) {
      return {
        ok: true,
        result: [{ ID: "9", TITLE: "Bayut", SOURCE_ID: "UC_Y3VNS9", DATE_CREATE: "2026-09-02 10:00:00" }],
      };
    }
    return { ok: true, result: [] };
  };
  const out = await pullCrmPortalLeads(db, { bx, sleep: async () => {}, maxPages: 2, ready: () => true });
  assert.equal(out.fetched, 1);
  assert.equal(out.upserted, 1);
  assert.equal(saved[0].id, "crm-9");
  assert.equal(saved[0].entity_type, "bayut");
});

test("lead view exposes portal label and hides raw/call url", () => {
  const view = leadView({
    id: "crm-9",
    channel: "whatsapp",
    entity_type: "bayut",
    tags: ["bayut"],
    bitrix_id: "9",
    call_record: "https://example.test/secret.mp3",
    raw: { source_id: "UC_Y3VNS9" },
  });
  assert.equal(view.portal, "bayut");
  assert.equal(view.portal_label, "Bayut");
  assert.equal(view.raw, undefined);
  assert.equal(view.call_record, undefined);
});
