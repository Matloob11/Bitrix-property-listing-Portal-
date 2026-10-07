import assert from "node:assert/strict";
import test from "node:test";
import {
  diffHistory,
  dubaiToday,
  filterListings,
  groupListingHistory,
  historyActorLabel,
  listingHistoryRows,
  isListingExpired,
  isMine,
  isPortalLive,
  listingDeskStatus,
  listingExpiryError,
  listingIsLiveOnPortal,
  liveUnpublishTargets,
  normalizeListing,
  agentPortfolioSummary,
  filterAgentPortfolioItems,
} from "./listingModel.js";

test("listing edits keep who changed what from and to", () => {
  const before = normalizeListing({ id: "h1", title: "Old villa", price_aed: 1000000, status: "draft" });
  const after = normalizeListing({ ...before, title: "New villa", price_aed: 1200000 });
  const entries = diffHistory(before, after, "Abdul Malik");
  const title = entries.find((item) => item.field === "title");
  const price = entries.find((item) => item.field === "price_aed");
  assert.equal(title.from, "Old villa");
  assert.equal(title.value, "New villa");
  assert.equal(title.by, "Abdul Malik");
  assert.equal(price.from, "1000000");
  assert.equal(price.value, "1200000");
  const sessions = groupListingHistory(entries);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].by, "Abdul Malik");
  assert.ok(sessions[0].changes.length >= 2);
  const rows = listingHistoryRows(entries);
  assert.ok(rows.every((row) => row.by === "Abdul Malik"));
  assert.ok(rows.some((row) => row.label === "Title" && row.from === "Old villa" && row.value === "New villa"));
});

test("listing history stores Bitrix name with Bitrix ID", () => {
  const before = normalizeListing({ id: "h2", title: "Old title", status: "draft" });
  const after = normalizeListing({ ...before, title: "New title" });
  const entries = diffHistory(before, after, { name: "Abdul Malik", id: "2191" });
  const title = entries.find((item) => item.field === "title");
  assert.equal(title.by, "Abdul Malik");
  assert.equal(title.byId, "2191");
  const rows = listingHistoryRows(entries);
  assert.equal(rows[0].who, "Abdul Malik · Bitrix ID 2191");
  assert.equal(historyActorLabel("User 1", ""), "Bitrix ID 1");
  assert.equal(historyActorLabel("Saad", "2265"), "Saad · Bitrix ID 2265");
  const saved = normalizeListing({
    id: "h3",
    title: "Villa",
    listing_agent: "Saad",
    created_by: "Saad",
    agent_id: "2265",
    history: [{ at: "2026-09-21T08:53:45.182Z", by: "Saad", field: "title", value: "Villa" }],
  });
  assert.equal(saved.history[0].byId, "2265");
});

test("desk archive stays archived even when Property Finder is still live", () => {
  assert.equal(isPortalLive({ pf_is_live: "1" }), true);
  assert.equal(isPortalLive({ pf_state: "live" }), false);
  assert.equal(isPortalLive({ pf_is_live: "", pf_state: "draft" }), false);
  assert.equal(listingDeskStatus({ status: "archived", pf_is_live: "1" }), "archived");
  assert.equal(listingDeskStatus({ status: "archived", pf_state: "live" }), "archived");
  assert.equal(listingDeskStatus({ status: "archived", pf_is_live: "" }), "archived");
  assert.equal(listingDeskStatus({ status: "draft", pf_is_live: "1" }), "live");
  const row = normalizeListing({
    id: "t1",
    reference: "a7group-1715",
    title: "Studio",
    status: "archived",
    pf_is_live: "1",
    pf_state: "live",
  });
  assert.equal(row.status, "archived");
});

test("expired live ads archive even when they are still PF-live", () => {
  const today = dubaiToday();
  assert.equal(isListingExpired({ portal_expiry: "2020-01-01" }, today), true);
  assert.equal(isListingExpired({ portal_expiry: today }, today), false);
  assert.equal(isListingExpired({ portal_expiry: "" }, today), false);
  assert.equal(listingDeskStatus({ status: "live", pf_is_live: "1", portal_expiry: "2020-01-01" }), "archived");
  assert.equal(listingDeskStatus({ status: "live", pf_is_live: "1", portal_expiry: today }), "live");
  assert.equal(listingDeskStatus({ status: "draft", portal_expiry: "2020-01-01" }), "draft");
  assert.equal(listingDeskStatus({ status: "pending", permit_expiry_date: "2020-01-01" }), "archived");
  assert.match(listingExpiryError({ status: "live", portal_expiry: "2020-01-01" }), /expired/);
  assert.equal(listingExpiryError({ status: "live", portal_expiry: today }), "");
  const row = normalizeListing({
    id: "t2",
    reference: "a7group-expired",
    title: "Villa",
    status: "live",
    pf_is_live: "1",
    pf_state: "live",
    portal_expiry: "2024-01-01",
  });
  assert.equal(row.status, "archived");
});

test("status tabs show every listing, My Listing shows only that user", () => {
  const rows = [
    { id: "1", status: "live", listing_agent: "Malik", listing_owner: "Malik", created_by: "Malik", agent_id: "1" },
    { id: "2", status: "archived", listing_agent: "Saad", listing_owner: "Saad", created_by: "Saad", agent_id: "2" },
    { id: "3", status: "draft", listing_agent: "Ibrahim", listing_owner: "Ibrahim", created_by: "Ibrahim", agent_id: "9" },
  ];
  assert.equal(filterListings(rows, { status: "live" }).map((row) => row.id).join(), "1");
  assert.equal(filterListings(rows, { status: "archived" }).map((row) => row.id).join(), "2");
  assert.equal(filterListings(rows, { status: "draft" }).map((row) => row.id).join(), "3");
  assert.equal(filterListings(rows, { status: "all" }).length, 3);

  const ibrahim = { agentName: "Ibrahim", agentId: "9", admin: true };
  assert.equal(isMine(rows[0], ibrahim), false);
  assert.equal(isMine(rows[2], ibrahim), true);
  assert.equal(filterListings(rows, { ...ibrahim, scope: "mine" }).map((row) => row.id).join(), "3");
  assert.equal(filterListings(rows, { ...ibrahim, status: "live", scope: "mine" }).length, 0);
  assert.equal(
    filterListings(rows, { agentName: "Malik", agentId: "1", scope: "mine" }).map((row) => row.id).join(),
    "1"
  );
});

test("agent portfolio counts sale rent type beds and community", () => {
  const rows = [
    normalizeListing({ id: "1", listing_agent: "Asma Aslam", purpose: "rent", type: "apartment", beds: 0, community: "International City", status: "live" }),
    normalizeListing({ id: "2", listing_owner: "Asma Aslam", purpose: "sale", type: "shop", beds: 0, community: "Business Bay", status: "live" }),
    normalizeListing({ id: "3", listing_agent: "Asma Aslam", purpose: "rent", type: "apartment", beds: 2, community: "International City", status: "archived" }),
    normalizeListing({ id: "4", listing_agent: "Qasim Mehmood", purpose: "sale", type: "villa", beds: 4, community: "Arabian Ranches", status: "live" }),
  ];
  const got = agentPortfolioSummary(rows, "Asma Aslam");
  assert.equal(got.total, 3);
  assert.equal(got.live, 2);
  assert.equal(got.archived, 1);
  assert.equal(got.rent, 2);
  assert.equal(got.sale, 1);
  assert.equal(got.types.find((row) => row.id === "apartment").count, 2);
  assert.equal(got.types.find((row) => row.id === "shop").count, 1);
  assert.equal(got.beds.find((row) => row.id === "studio").count, 2);
  assert.equal(got.beds.find((row) => row.id === "2").count, 1);
  assert.equal(got.communities.find((row) => row.name === "International City").count, 2);
  assert.equal(got.liveSale, 1);
  assert.equal(got.liveRent, 1);
  assert.equal(got.cities.find((row) => row.name === "Dubai")?.count || got.cities[0]?.count, 3);
  assert.equal(got.liveCommunities.find((row) => row.name === "International City").count, 1);
  assert.equal(got.ads, 0);
  assert.equal(got.items.length, 3);
  assert.equal(got.items.filter((row) => row.purpose === "sale").length, 1);
  assert.equal(filterAgentPortfolioItems(got.items, "sale").length, 1);
  assert.equal(filterAgentPortfolioItems(got.items, "listings", { kind: "type", id: "apartment" }).length, 2);
  assert.equal(agentPortfolioSummary(rows, "Asma Asiam").total, 3);
  assert.equal(agentPortfolioSummary(rows, "Asma Aslam").items.length, 3);
  assert.equal(
    agentPortfolioSummary(
      [normalizeListing({ id: "5", listing_agent: "Other Name", agent_id: "81", purpose: "sale", status: "live" })],
      "Asma Aslam",
      "81"
    ).total,
    1
  );
});

test("agent portfolio counts portal ads", () => {
  const rows = [
    normalizeListing({
      id: "1",
      listing_agent: "Asma Aslam",
      purpose: "rent",
      status: "live",
      portals: ["pf", "bayut"],
      pf_is_live: "1",
      bayut_is_live: "1",
    }),
    normalizeListing({
      id: "2",
      listing_agent: "Asma Aslam",
      purpose: "sale",
      status: "live",
      portals: ["dubizzle"],
      dubizzle_is_live: "1",
    }),
    normalizeListing({
      id: "3",
      listing_agent: "Asma Aslam",
      purpose: "rent",
      status: "archived",
      portals: [],
    }),
  ];
  const got = agentPortfolioSummary(rows, "Asma Aslam");
  assert.equal(got.ads, 2);
  assert.equal(got.pf, 1);
  assert.equal(got.bayut, 1);
  assert.equal(got.dubizzle, 1);
  assert.equal(filterAgentPortfolioItems(got.items, "sale").length, 1);
  assert.equal(filterAgentPortfolioItems(got.items, "ads").length, 2);
  assert.equal(filterAgentPortfolioItems(got.items, "live").length, 2);
});

test("liveUnpublishTargets only lists PF / Bayut / Dubizzle that are on", () => {
  assert.deepEqual(
    liveUnpublishTargets({
      portals: ["pf", "bayut", "website"],
      pf_is_live: "1",
      pf_state: "live",
    }),
    ["pf", "bayut"]
  );
  assert.deepEqual(
    liveUnpublishTargets({ portals: ["dubizzle"], pf_is_live: "", pf_state: "draft" }),
    ["dubizzle"]
  );
  assert.deepEqual(
    liveUnpublishTargets({ portals: ["pf_api"], pf_is_live: "", pf_state: "" }),
    ["pf"]
  );
  assert.deepEqual(liveUnpublishTargets({ portals: ["website"], pf_is_live: "" }), []);
});

test("portal filter shows only actual live ads on that portal", () => {
  const pfLive = normalizeListing({
    id: "1",
    reference: "a7-pf",
    status: "live",
    pf_is_live: "1",
    pf_state: "live",
    portals: ["pf"],
  });
  const bayutLive = normalizeListing({
    id: "2",
    reference: "a7-by",
    status: "live",
    portals: ["bayut"],
    bayut_is_live: "1",
  });
  const bayutArchived = normalizeListing({
    id: "3",
    reference: "a7-old",
    status: "archived",
    portals: ["bayut"],
  });
  const pfCheckboxOnly = normalizeListing({
    id: "4",
    reference: "a7-api",
    status: "live",
    portals: ["pf_api"],
  });
  const pfActualDraft = normalizeListing({
    id: "5",
    reference: "a7-draft",
    status: "draft",
    pf_is_live: "1",
    pf_state: "live",
    portals: ["pf"],
  });
  assert.equal(listingIsLiveOnPortal(pfLive, "pf"), true);
  assert.equal(listingIsLiveOnPortal(bayutLive, "bayut"), true);
  assert.equal(listingIsLiveOnPortal(bayutArchived, "bayut"), false);
  assert.equal(listingIsLiveOnPortal(pfCheckboxOnly, "pf"), false);
  assert.equal(listingIsLiveOnPortal(pfActualDraft, "pf"), true);
  const rows = [pfLive, bayutLive, bayutArchived, pfCheckboxOnly, pfActualDraft];
  const bayutRows = filterListings(rows, { portal: "bayut" });
  assert.deepEqual(bayutRows.map((row) => row.id), ["2"]);
  const pfRows = filterListings(rows, { portal: "pf", status: "live" });
  assert.deepEqual(pfRows.map((row) => row.id).sort(), ["1", "5"]);
});

test("listing_id filter matches reference case-insensitively and a7group number", () => {
  const rows = [
    { id: "60047991b38688cd", reference: "a7group-1683", status: "live" },
    { id: "other", reference: "a7group-1684", status: "live" },
  ];
  assert.equal(filterListings(rows, { listing_id: "A7GROUP-1683" }).length, 1);
  assert.equal(filterListings(rows, { listing_id: "1683" })[0].id, "60047991b38688cd");
  assert.equal(filterListings(rows, { listing_id: "60047991b38688cd" }).length, 1);
  assert.equal(filterListings(rows, { listing_id: "1684" })[0].reference, "a7group-1684");
});
