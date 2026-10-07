import { communityLabel } from "./displayEmpty.js";

export const STATUSES = [
  "draft",
  "live",
  "pending",
  "archived",
  "duplicate",
  "pocket",
];

// Portal ids. Order matters for the desk badges and feeds.
export const PORTALS = [
  "pf",
  "pf_api",
  "bayut",
  "dubizzle",
  "houza",
  "trb",
  "simsari",
  "sudonum",
  "properstar",
  "website",
  "rightmove",
];

export const PORTAL_NAMES = {
  pf: "Property Finder",
  pf_api: "Property Finder API",
  bayut: "Bayut",
  dubizzle: "Dubizzle",
  houza: "JE",
  trb: "TRB",
  simsari: "Simsari",
  sudonum: "Sudonum",
  properstar: "Properstar",
  website: "Website",
  rightmove: "Rightmove",
};

/** Portals the desk can unpublish from (API or XML feed). */
export const UNPUBLISH_PORTALS = [
  { id: "pf", label: "Property Finder" },
  { id: "bayut", label: "Bayut" },
  { id: "dubizzle", label: "Dubizzle" },
];

export function liveUnpublishTargets(row) {
  const portals = Array.isArray(row?.portals) ? row.portals : [];
  const out = [];
  if (
    portals.includes("pf") ||
    portals.includes("pf_api") ||
    String(row?.pf_is_live || "") === "1" ||
    String(row?.pf_state || "") === "live"
  ) {
    out.push("pf");
  }
  if (portals.includes("bayut")) out.push("bayut");
  if (portals.includes("dubizzle")) out.push("dubizzle");
  return out;
}

function listingHasPortal(row, portalId) {
  const portals = Array.isArray(row?.portals) ? row.portals : [];
  if (portalId === "pf") return portals.includes("pf") || portals.includes("pf_api");
  return portals.includes(portalId);
}

/** Actual live ads on PF / Bayut / Dubizzle — not the desk checkbox. */
export function listingIsLiveOnPortal(row, portalId) {
  const id = portalId === "pf_api" ? "pf" : String(portalId || "");
  if (!row || !id) return false;
  if (id === "pf") return flag(row.pf_is_live) === "1";
  if (id === "bayut") return flag(row.bayut_is_live) === "1";
  if (id === "dubizzle") return flag(row.dubizzle_is_live) === "1";
  return String(row.status || "") === "live" && listingHasPortal(row, id);
}

export const TYPES = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "office",
  "warehouse",
  "shop",
  "retail",
  "land",
  "duplex",
  "whole_building",
  "hotel_apartment",
  "showroom",
  "labor_camp",
  "farm",
  "bulk_units",
  "compound",
];

export const CATEGORIES = ["residential", "commercial"];

export const PROJECT_STATUSES = [
  "ready_secondary",
  "offplan_secondary",
  "ready_primary",
  "offplan_primary",
];

export const EXTRA_COLUMNS = [
  "unit_no",
  "permit_number",
  "landlord_name",
  "landlord_email",
  "landlord_phone",
  "sub_community",
  "building",
  "category",
  "project_status",
  "listing_agent",
  "listing_owner",
  "agent_id",
  "developer",
  "portal_expiry",
  "title_deed",
  "parking",
  "furnished",
  "portal_agent_different",
  "notes",
  "created_by",
  "plot_size",
  "lot_size",
  "built_up_area",
  "layout_type",
  "project_name",
  "ownership",
  "build_year",
  "listing_source",
  "available_from",
  "license_type",
  "non_rera",
  "permit_issue_date",
  "permit_expiry_date",
  "custom_portal_pricing",
  "price_period",
  "price_yearly",
  "price_monthly",
  "price_weekly",
  "price_daily",
  "payment_method",
  "cheques",
  "service_charges",
  "financial_status",
  "title_ar",
  // Added for parity with the old Property Listing app.
  "fireplace",
  "rental_period",
  "sale_price",
  "hide_price",
  "down_payment_price",
  "bayut_plan",
  "bayut_price_yearly",
  "bayut_price_monthly",
  "bayut_price_weekly",
  "bayut_price_daily",
  "listing_owner_role",
  "portal_agent_web",
  "portal_agent_bayut",
  "portal_agent_pf_api",
  "dtcm_permit",
  "youtube_link",
  "video_link",
  "qrcode_link",
  "latitude",
  "longitude",
  "bayut_city",
  "bayut_community",
  "bayut_sub_community",
  "bayut_building",
  "location_text",
  "pf_account",
  "bayut_account",
  "views",
  "contract_status",
  // Property Finder sync
  "pf_id",
  "pf_state",
  "pf_state_type",
  "pf_is_live",
  "bayut_is_live",
  "dubizzle_is_live",
  "pf_published_at",
  "pf_quality_score",
  "pf_location_id",
  "pf_agent_id",
  "pf_created_at",
  "pf_updated_at",
  "pf_synced_at",
];

export const EXTRA_TEXT_COLUMNS = [
  "description",
  "description_ar",
  "amenities",
  "portal_prices",
  "gallery",
  "videos",
  "documents_list",
  "notes_list",
  "history",
  "upgrades",
  "pf_quality",
  "pf_reasons",
];

const PRICE_PERIODS = ["yearly", "monthly", "weekly", "daily"];
const LICENSE_TYPES = ["rera", "dtcm", "non_rera"];
export const HISTORY_LIMIT = 300;

function flag(value) {
  return value === true || value === "1" || value === 1 ? "1" : "";
}

export function isPortalLive(row) {
  return Boolean(row) && (
    flag(row.pf_is_live) === "1" ||
    flag(row.bayut_is_live) === "1" ||
    flag(row.dubizzle_is_live) === "1"
  );
}

export function dubaiToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

export function listingExpiryDate(row) {
  const raw = String(row?.portal_expiry || row?.permit_expiry_date || "").trim();
  if (!raw) return "";
  const day = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

export function isListingExpired(row, today = dubaiToday()) {
  const day = listingExpiryDate(row);
  return Boolean(day && day < today);
}

export function listingExpiryError(listing) {
  if (!isListingExpired(listing)) return "";
  return "This listing has expired, so it cannot stay live. It moves to Archive. Update the permit or portal expiry to publish again.";
}

export function listingOccupiesDeskLive(input) {
  const status = STATUSES.includes(input?.status) ? input.status : "";
  return status === "live" || status === "pending" || isPortalLive(input);
}

export function listingDeskStatus(input) {
  if (isListingExpired(input) && listingOccupiesDeskLive(input)) return "archived";
  const stored = STATUSES.includes(input?.status) ? input.status : "draft";
  if (stored === "archived") return "archived";
  if (isPortalLive(input)) return "live";
  return stored;
}

function asList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function asFiles(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return { url: item, name: "", kind: "file" };
        if (item && typeof item === "object" && item.url) {
          return {
            url: String(item.url),
            name: String(item.name || ""),
            kind: String(item.kind || "file"),
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return asFiles(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function asPrices(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, amount]) => [key, String(amount || "")])
    );
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return asPrices(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return {};
}

function asObjects(value, shape) {
  let list = value;
  if (typeof list === "string" && list.trim()) {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const out = {};
      for (const key of shape) out[key] = String(item[key] ?? "");
      return out;
    })
    .filter(Boolean);
}

export function asNotes(value) {
  return asObjects(value, ["at", "by", "type", "text"]).filter((item) => item.text);
}

export function asHistory(value) {
  return asObjects(value, ["at", "by", "field", "value", "from", "byId"]).slice(-HISTORY_LIMIT);
}

export function historyActor(by) {
  if (by && typeof by === "object") {
    const name = String(by.by || by.name || "").trim();
    const id = String(by.byId || by.id || "").trim();
    return {
      by: name || (id ? `User ${id}` : "System"),
      byId: /^\d+$/.test(id) ? id : "",
    };
  }
  const text = String(by || "System");
  return { by: text, byId: historyActorId(text, "") };
}

export function historyActorName(by, byId) {
  const text = String(by || "").trim();
  const cleaned = text
    .replace(/\s*[·•]\s*Bitrix ID\s+\d+\s*$/i, "")
    .replace(/\s*\((?:Bitrix\s*)?ID\s+\d+\)\s*$/i, "")
    .trim();
  if (cleaned && !/^User\s+\d+$/i.test(cleaned)) return cleaned;
  return historyActorId(by, byId) ? "Bitrix user" : cleaned || "Empty";
}

export function historyActorId(by, byId) {
  const raw = String(byId || "").trim();
  if (/^\d+$/.test(raw)) return raw;
  const text = String(by || "").trim();
  const tagged = text.match(/Bitrix ID\s+(\d+)/i) || text.match(/\((?:Bitrix\s*)?ID\s+(\d+)\)/i) || text.match(/^User\s+(\d+)$/i);
  return tagged ? tagged[1] : "";
}

export function historyActorLabel(by, byId) {
  const name = historyActorName(by, byId);
  const id = historyActorId(by, byId);
  if (id && name && name !== "Bitrix user") return `${name} · Bitrix ID ${id}`;
  if (id) return `Bitrix ID ${id}`;
  return name || "Empty";
}

function withKnownBitrixIds(history, listing) {
  const id = String(listing?.agent_id || "").trim();
  if (!/^\d+$/.test(id)) return history;
  const names = new Set(
    [listing.listing_agent, listing.created_by]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (!names.size) return history;
  return history.map((item) => {
    if (item.byId) return item;
    const name = String(item.by || "").trim().toLowerCase();
    return names.has(name) ? { ...item, byId: id } : item;
  });
}

function parseObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function nowIso() {
  return new Date().toISOString();
}

export function autoTitle(input) {
  if (String(input.title || "").trim()) return String(input.title).trim();
  const beds = Number(input.beds || 0);
  const type = String(input.type || "apartment").replace(/_/g, " ");
  const purpose = input.purpose === "rent" ? "Rent" : "Sale";
  const head = beds > 0 ? `${beds} Bedroom ${type}` : type;
  return `${head} for ${purpose}`.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function nextA7Reference(rows) {
  let max = 0;
  const taken = new Set();
  for (const row of rows || []) {
    const ref = String(row?.reference || "").trim();
    if (ref) taken.add(ref.toLowerCase());
    const match = /^a7group-(\d+)$/i.exec(ref);
    if (match) max = Math.max(max, Number(match[1]));
  }
  let n = max + 1;
  let reference = `a7group-${n}`;
  while (taken.has(reference.toLowerCase())) {
    n += 1;
    reference = `a7group-${n}`;
  }
  return reference;
}

export function normalizeListing(input, options = {}) {
  const stamp = nowIso();
  const portals = Array.isArray(input.portals)
    ? [...new Set(input.portals.filter((item) => PORTALS.includes(item)))]
    : [];
  return {
    id: String(input.id),
    reference: String(input.reference || "").trim(),
    title: String(input.title || "").trim(),
    community: String(input.community || "").trim(),
    city: String(input.city || "Dubai"),
    type: TYPES.includes(input.type) ? input.type : "apartment",
    purpose: input.purpose === "rent" ? "rent" : "sale",
    status: listingDeskStatus(input),
    beds: Number(input.beds || 0),
    baths: Number(input.baths || 0),
    area_sqft: Number(input.area_sqft || 0),
    price_aed: Number(input.price_aed || 0),
    photo: String(
      input.photo ||
        (asFiles(input.gallery).find((item) => item.kind !== "floorplan") || {}).url ||
        ""
    ),
    portals,
    created_at: input.created_at || stamp,
    updated_at: options.keepDates ? input.updated_at || stamp : stamp,
    unit_no: String(input.unit_no || ""),
    permit_number: String(input.permit_number || ""),
    landlord_name: String(input.landlord_name || ""),
    landlord_email: String(input.landlord_email || ""),
    landlord_phone: String(input.landlord_phone || ""),
    sub_community: String(input.sub_community || ""),
    building: String(input.building || ""),
    category: CATEGORIES.includes(input.category)
      ? input.category
      : "residential",
    project_status: PROJECT_STATUSES.includes(input.project_status)
      ? input.project_status
      : "ready_secondary",
    listing_agent: String(input.listing_agent || ""),
    listing_owner: String(input.listing_owner || ""),
    agent_id: String(input.agent_id || ""),
    developer: String(input.developer || ""),
    portal_expiry: String(input.portal_expiry || ""),
    title_deed: String(input.title_deed || ""),
    parking: String(input.parking || ""),
    furnished: String(input.furnished || ""),
    portal_agent_different: flag(input.portal_agent_different),
    notes: String(input.notes || ""),
    created_by: String(input.created_by || ""),
    plot_size: String(input.plot_size || ""),
    lot_size: String(input.lot_size || ""),
    built_up_area: String(input.built_up_area || ""),
    layout_type: String(input.layout_type || ""),
    project_name: String(input.project_name || ""),
    ownership: String(input.ownership || ""),
    build_year: String(input.build_year || ""),
    listing_source: String(input.listing_source || ""),
    available_from: String(input.available_from || ""),
    license_type: LICENSE_TYPES.includes(input.license_type)
      ? input.license_type
      : flag(input.non_rera)
        ? "non_rera"
        : "rera",
    non_rera: flag(input.non_rera) || (input.license_type === "non_rera" ? "1" : ""),
    permit_issue_date: String(input.permit_issue_date || ""),
    permit_expiry_date: String(input.permit_expiry_date || ""),
    custom_portal_pricing: flag(input.custom_portal_pricing),
    price_period: PRICE_PERIODS.includes(input.price_period)
      ? input.price_period
      : "yearly",
    price_yearly: String(input.price_yearly || ""),
    price_monthly: String(input.price_monthly || ""),
    price_weekly: String(input.price_weekly || ""),
    price_daily: String(input.price_daily || ""),
    payment_method: String(input.payment_method || ""),
    cheques: String(input.cheques || ""),
    service_charges: String(input.service_charges || ""),
    financial_status: String(input.financial_status || ""),
    title_ar: String(input.title_ar || ""),
    fireplace: String(input.fireplace || ""),
    rental_period: String(input.rental_period || ""),
    sale_price: String(input.sale_price || ""),
    hide_price: flag(input.hide_price),
    down_payment_price: String(input.down_payment_price || ""),
    bayut_plan: PRICE_PERIODS.includes(input.bayut_plan) ? input.bayut_plan : "yearly",
    bayut_price_yearly: String(input.bayut_price_yearly || ""),
    bayut_price_monthly: String(input.bayut_price_monthly || ""),
    bayut_price_weekly: String(input.bayut_price_weekly || ""),
    bayut_price_daily: String(input.bayut_price_daily || ""),
    listing_owner_role: String(input.listing_owner_role || ""),
    portal_agent_web: String(input.portal_agent_web || ""),
    portal_agent_bayut: String(input.portal_agent_bayut || ""),
    portal_agent_pf_api: String(input.portal_agent_pf_api || ""),
    dtcm_permit: String(input.dtcm_permit || ""),
    youtube_link: String(input.youtube_link || ""),
    video_link: String(input.video_link || ""),
    qrcode_link: String(input.qrcode_link || ""),
    latitude: String(input.latitude || ""),
    longitude: String(input.longitude || ""),
    bayut_city: String(input.bayut_city || ""),
    bayut_community: String(input.bayut_community || ""),
    bayut_sub_community: String(input.bayut_sub_community || ""),
    bayut_building: String(input.bayut_building || ""),
    location_text: String(input.location_text || ""),
    pf_account: String(input.pf_account || ""),
    bayut_account: String(input.bayut_account || ""),
    views: String(Number(input.views || 0)),
    contract_status: String(input.contract_status || ""),
    pf_id: String(input.pf_id || ""),
    pf_state: String(input.pf_state || ""),
    pf_state_type: String(input.pf_state_type || ""),
    pf_is_live: flag(input.pf_is_live),
    bayut_is_live: flag(input.bayut_is_live),
    dubizzle_is_live: flag(input.dubizzle_is_live),
    pf_published_at: String(input.pf_published_at || ""),
    pf_quality_score: String(input.pf_quality_score || ""),
    pf_location_id: String(input.pf_location_id || ""),
    pf_agent_id: String(input.pf_agent_id || ""),
    pf_created_at: String(input.pf_created_at || ""),
    pf_updated_at: String(input.pf_updated_at || ""),
    pf_synced_at: String(input.pf_synced_at || ""),
    pf_quality: parseObject(input.pf_quality),
    pf_reasons: asList(input.pf_reasons),
    description: String(input.description || ""),
    description_ar: String(input.description_ar || ""),
    amenities: asList(input.amenities),
    portal_prices: asPrices(input.portal_prices),
    gallery: asFiles(input.gallery),
    videos: asFiles(input.videos),
    documents_list: asFiles(input.documents_list),
    notes_list: asNotes(input.notes_list),
    history: withKnownBitrixIds(asHistory(input.history), input),
    upgrades: asList(input.upgrades),
  };
}

export function hydrateRow(row) {
  if (!row) return null;
  let portals = row.portals;
  if (typeof portals === "string") {
    try {
      portals = JSON.parse(portals || "[]");
    } catch {
      portals = [];
    }
  }
  return normalizeListing(
    {
      ...row,
      portals,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    { keepDates: true }
  );
}

const BASE_COLUMNS = [
  "id",
  "reference",
  "title",
  "community",
  "city",
  "type",
  "purpose",
  "status",
  "beds",
  "baths",
  "area_sqft",
  "price_aed",
  "photo",
  "portals",
  "created_at",
  "updated_at",
];

const ALL_COLUMNS = [...BASE_COLUMNS, ...EXTRA_COLUMNS, ...EXTRA_TEXT_COLUMNS];
const JSON_COLUMNS = new Set([
  "portals",
  "amenities",
  "portal_prices",
  "gallery",
  "videos",
  "documents_list",
  "notes_list",
  "history",
  "upgrades",
  "pf_quality",
  "pf_reasons",
]);

export function listingToParams(listing) {
  return ALL_COLUMNS.map((column) => {
    const value = listing[column];
    if (JSON_COLUMNS.has(column)) {
      return JSON.stringify(value ?? (column === "portal_prices" || column === "pf_quality" ? {} : []));
    }
    return value ?? "";
  });
}

export const LISTING_SQL_COLUMNS = ALL_COLUMNS.join(", ");

export const LISTING_SQL_PLACEHOLDERS = ALL_COLUMNS.map(() => "?").join(",");

export function listingUpdateSql() {
  const columns = ALL_COLUMNS.filter((column) => column !== "id");
  return `UPDATE listings SET ${columns.map((column) => `${column}=?`).join(", ")} WHERE id=?`;
}

// Fields that are recorded in the per-listing History panel when they change.
const TRACKED = ALL_COLUMNS.filter(
  (column) =>
    !["id", "created_at", "updated_at", "history", "views", "photo", "pf_quality", "pf_synced_at", "pf_updated_at", "pf_reasons", "pf_quality_score"].includes(column)
);

function historyValue(column, value) {
  if (Array.isArray(value)) {
    if (column === "gallery" || column === "documents_list" || column === "videos") {
      return `${value.length} file${value.length === 1 ? "" : "s"}`;
    }
    if (column === "notes_list") return `${value.length} note${value.length === 1 ? "" : "s"}`;
    return value.join(", ") || "-";
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  const text = String(value ?? "");
  return text.length > 500 ? `${text.slice(0, 497)}...` : text || "-";
}

export function historyEntry(by, field, value, from = "") {
  const actor = historyActor(by);
  return {
    at: nowIso(),
    by: actor.by,
    byId: actor.byId,
    field: String(field),
    value: String(value),
    from: String(from ?? ""),
  };
}

const HISTORY_FIELD_LABELS = {
  title: "Title",
  title_ar: "Title (Arabic)",
  description: "Description",
  description_ar: "Description (Arabic)",
  reference: "Reference",
  status: "Status",
  purpose: "Purpose",
  type: "Property type",
  category: "Category",
  price_aed: "Price (AED)",
  sale_price: "Sale price",
  price_yearly: "Yearly price",
  community: "Community",
  city: "City",
  beds: "Bedrooms",
  baths: "Bathrooms",
  area_sqft: "Size (sq ft)",
  unit_no: "Unit no.",
  building: "Building",
  project_name: "Project",
  listing_agent: "Listing agent",
  listing_owner: "Listing owner",
  landlord_name: "Landlord name",
  landlord_phone: "Landlord phone",
  landlord_email: "Landlord email",
  permit_number: "Permit number",
  title_deed: "Title deed",
  portal_expiry: "Portal expiry",
  permit_expiry_date: "Permit expiry",
  portals: "Portals",
  amenities: "Amenities",
  gallery: "Photos",
  created: "Listing created",
};

export function historyFieldLabel(field) {
  if (HISTORY_FIELD_LABELS[field]) return HISTORY_FIELD_LABELS[field];
  return String(field || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function listingHistoryRows(history) {
  return groupListingHistory(history).flatMap((session) =>
    session.changes.map((item) => {
      const by = item.by || session.by || "Unknown";
      const byId = item.byId || session.byId || "";
      return {
        at: item.at || session.at,
        by,
        byId,
        who: historyActorLabel(by, byId),
        field: item.field,
        label: item.field === "created" ? "Listing created" : historyFieldLabel(item.field),
        from: item.from,
        value: item.value,
      };
    })
  );
}

export function groupListingHistory(history) {
  const sessions = [];
  for (const raw of history || []) {
    const item = {
      at: String(raw.at || ""),
      by: String(raw.by || "System"),
      byId: historyActorId(raw.by, raw.byId),
      field: String(raw.field || ""),
      value: String(raw.value ?? ""),
      from: String(raw.from ?? ""),
    };
    const last = sessions[sessions.length - 1];
    const time = Date.parse(item.at) || 0;
    const lastTime = last ? Date.parse(last.at) || 0 : 0;
    if (last && last.by === item.by && last.byId === item.byId && Math.abs(time - lastTime) <= 4000) {
      last.changes.push(item);
      if (time > lastTime) last.at = item.at;
    } else {
      sessions.push({ at: item.at, by: item.by, byId: item.byId, changes: [item] });
    }
  }
  return sessions.reverse();
}

export function diffHistory(previous, next, by) {
  const at = nowIso();
  const actor = historyActor(by);
  const entries = [];
  for (const column of TRACKED) {
    const before = JSON.stringify(previous?.[column] ?? "");
    const after = JSON.stringify(next?.[column] ?? "");
    if (before !== after) {
      entries.push({
        at,
        by: actor.by,
        byId: actor.byId,
        field: column,
        value: historyValue(column, next[column]),
        from: historyValue(column, previous?.[column]),
      });
    }
  }
  return entries;
}

export function withHistory(listing, entries) {
  const history = [...(listing.history || []), ...entries].slice(-HISTORY_LIMIT);
  return { ...listing, history };
}

function sameName(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

export function listingQualityScore(row) {
  if (row?.pf_quality_score === "" || row?.pf_quality_score == null) return null;
  const n = Number(row.pf_quality_score);
  return Number.isFinite(n) ? n : null;
}

export function listingMatchesQuality(row, quality) {
  if (!quality) return true;
  const score = listingQualityScore(row);
  if (quality === "below70") return score != null && score < 70;
  if (quality === "70to89") return score != null && score >= 70 && score < 90;
  if (quality === "90plus") return score != null && score >= 90;
  if (quality === "none") return score == null;
  return true;
}

export function isMine(row, filters) {
  if (!filters.agentId && !filters.agentName) return false;
  if (filters.agentId && row.agent_id && row.agent_id === filters.agentId) return true;
  if (!filters.agentName) return false;
  return (
    sameName(row.listing_agent, filters.agentName) ||
    sameName(row.listing_owner, filters.agentName) ||
    sameName(row.created_by, filters.agentName)
  );
}

function nameTokens(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

function lastNameClose(left, right) {
  if (left === right) return true;
  if (left.startsWith(right) || right.startsWith(left)) return true;
  if (left.length < 3 || right.length < 3) return false;
  let distance = 0;
  const a = left.length >= right.length ? left : right;
  const b = left.length >= right.length ? right : left;
  if (a.length - b.length > 2) return false;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    distance += 1;
    if (distance > 2) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return distance + (a.length - i) + (b.length - j) <= 2;
}

export function portfolioNameMatch(listingName, wanted) {
  const haveName = String(listingName || "").replace(/\s*[·•]\s*Bitrix ID\s+\d+\s*$/i, "").trim();
  const needName = String(wanted || "").replace(/\s*[·•]\s*Bitrix ID\s+\d+\s*$/i, "").trim();
  if (sameName(haveName, needName)) return true;
  const have = nameTokens(haveName);
  const need = nameTokens(needName);
  if (have.length < 2 || need.length < 2) return false;
  return have[0] === need[0] && lastNameClose(have[have.length - 1], need[need.length - 1]);
}

function countMap(items, keyFn, nameFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const name = nameFn(item);
    const prev = map.get(key) || { id: key, name, count: 0 };
    prev.count += 1;
    map.set(key, prev);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function prettyType(value) {
  return String(value || "other").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function bedBucket(row) {
  const n = Number(row?.beds);
  if (!Number.isFinite(n) || n <= 0) return { key: "studio", name: "Studio" };
  return { key: String(n), name: n === 1 ? "1 Bedroom" : `${n} Bedroom` };
}

function listingPortalAds(row) {
  const pf = listingIsLiveOnPortal(row, "pf") ? 1 : 0;
  const bayut = listingIsLiveOnPortal(row, "bayut") ? 1 : 0;
  const dubizzle = listingIsLiveOnPortal(row, "dubizzle") ? 1 : 0;
  const website = listingIsLiveOnPortal(row, "website") ? 1 : 0;
  const ads = pf || bayut || dubizzle || website ? 1 : 0;
  return { ads, pf, bayut, dubizzle, website };
}

export function emptyAgentPortfolio(agentName = "") {
  return {
    ok: true,
    agentName: String(agentName || "").trim(),
    total: 0,
    live: 0,
    archived: 0,
    sale: 0,
    rent: 0,
    liveSale: 0,
    liveRent: 0,
    expired: 0,
    expiredSale: 0,
    expiredRent: 0,
    ads: 0,
    pf: 0,
    bayut: 0,
    dubizzle: 0,
    website: 0,
    types: [],
    beds: [],
    communities: [],
    cities: [],
    liveCommunities: [],
    items: [],
  };
}

export function portfolioListingItem(row) {
  const tip = listingPortalAds(row);
  return {
    id: row?.id || "",
    reference: String(row?.reference || "").trim(),
    title: String(row?.title || row?.reference || "Listing").trim() || "Listing",
    purpose: String(row?.purpose || ""),
    status: String(row?.status || ""),
    type: String(row?.type || "other"),
    typeLabel: prettyType(row?.type),
    beds: row?.beds,
    bedKey: bedBucket(row).key,
    bedLabel: bedBucket(row).name,
    community: communityLabel(row?.community),
    communityKey: String(row?.community || "").trim().toLowerCase() || "none",
    city: String(row?.city || "").trim() || "No area",
    cityKey: String(row?.city || "").trim().toLowerCase() || "none",
    listing_agent: String(row?.listing_agent || "").trim(),
    building: String(row?.building || row?.sub_community || "").trim(),
    price_aed: row?.price_aed ?? null,
    expired: isListingExpired(row),
    ads: Boolean(tip.ads),
    pf: Boolean(tip.pf),
    bayut: Boolean(tip.bayut),
    dubizzle: Boolean(tip.dubizzle),
    website: Boolean(tip.website),
  };
}

export function filterAgentPortfolioItems(items = [], slice = "listings", chip = null) {
  return (items || []).filter((row) => {
    if (slice === "live" && row.status !== "live") return false;
    if (slice === "sale" && row.purpose !== "sale") return false;
    if (slice === "rent" && row.purpose !== "rent") return false;
    if (slice === "ads" && !row.ads) return false;
    if (slice === "liveSale" && !(row.status === "live" && row.purpose === "sale")) return false;
    if (slice === "liveRent" && !(row.status === "live" && row.purpose === "rent")) return false;
    if (slice === "archived" && row.status !== "archived") return false;
    if (slice === "expired" && !row.expired) return false;
    if (slice === "expiredSale" && !(row.expired && row.purpose === "sale")) return false;
    if (slice === "expiredRent" && !(row.expired && row.purpose === "rent")) return false;
    if (slice === "pf" && !row.pf) return false;
    if (slice === "bayut" && !row.bayut) return false;
    if (slice === "dubizzle" && !row.dubizzle) return false;
    if (slice === "website" && !row.website) return false;
    if (chip?.kind === "type" && row.type !== chip.id) return false;
    if (chip?.kind === "beds" && row.bedKey !== chip.id) return false;
    if (chip?.kind === "community" && row.communityKey !== chip.id) return false;
    if (chip?.kind === "city" && row.cityKey !== chip.id) return false;
    if (chip?.kind === "liveCommunity" && (row.status !== "live" || row.communityKey !== chip.id)) return false;
    return true;
  });
}

export function listingBelongsToAgent(row, agentName, agentId = "") {
  if (!row || row.status === "duplicate") return false;
  const uid = String(agentId || "").trim();
  if (uid && /^\d+$/.test(uid)) {
    if (String(row.agent_id || "").trim() === uid) return true;
    if (historyActorId(row.listing_agent) === uid) return true;
    if (historyActorId(row.listing_owner) === uid) return true;
    if (historyActorId(row.created_by) === uid) return true;
  }
  const name = String(agentName || "").trim();
  if (!name) return false;
  return (
    portfolioNameMatch(row.listing_agent, name) ||
    portfolioNameMatch(row.listing_owner, name) ||
    portfolioNameMatch(row.created_by, name)
  );
}

export function agentPortfolioSummary(rows, agentName, agentId = "") {
  const name = String(agentName || "").trim();
  const id = String(agentId || "").trim();
  if (!name && !id) return emptyAgentPortfolio("");
  const mine = (rows || []).filter((row) => listingBelongsToAgent(row, name, id));
  const liveRows = mine.filter((row) => row.status === "live");
  const expiredRows = mine.filter((row) => isListingExpired(row));
  const portalTotals = mine.reduce(
    (acc, row) => {
      const tip = listingPortalAds(row);
      acc.ads += tip.ads;
      acc.pf += tip.pf;
      acc.bayut += tip.bayut;
      acc.dubizzle += tip.dubizzle;
      acc.website += tip.website;
      return acc;
    },
    { ads: 0, pf: 0, bayut: 0, dubizzle: 0, website: 0 }
  );
  return {
    ok: true,
    agentName: name,
    total: mine.length,
    live: liveRows.length,
    archived: mine.filter((row) => row.status === "archived").length,
    sale: mine.filter((row) => row.purpose === "sale").length,
    rent: mine.filter((row) => row.purpose === "rent").length,
    liveSale: liveRows.filter((row) => row.purpose === "sale").length,
    liveRent: liveRows.filter((row) => row.purpose === "rent").length,
    expired: expiredRows.length,
    expiredSale: expiredRows.filter((row) => row.purpose === "sale").length,
    expiredRent: expiredRows.filter((row) => row.purpose === "rent").length,
    ...portalTotals,
    types: countMap(mine, (row) => String(row.type || "other"), (row) => prettyType(row.type)),
    beds: countMap(mine, (row) => bedBucket(row).key, (row) => bedBucket(row).name),
    communities: countMap(
      mine,
      (row) => String(row.community || "").trim().toLowerCase() || "none",
      (row) => communityLabel(row.community)
    ),
    cities: countMap(
      mine,
      (row) => String(row.city || "").trim().toLowerCase() || "none",
      (row) => String(row.city || "").trim() || "No area"
    ),
    liveCommunities: countMap(
      liveRows,
      (row) => String(row.community || "").trim().toLowerCase() || "none",
      (row) => communityLabel(row.community)
    ),
    items: mine.map(portfolioListingItem),
  };
}

export function filterListings(rows, filters) {
  return rows.filter((row) => {
    if (filters.portal && !listingIsLiveOnPortal(row, filters.portal)) {
      return false;
    }
    const portalLiveView =
      Boolean(filters.portal) &&
      (!filters.status || filters.status === "all" || filters.status === "live");
    if (!portalLiveView) {
      if (filters.status === "expired") {
        if (!isListingExpired(row)) return false;
      } else if (filters.status && filters.status !== "all" && row.status !== filters.status) {
        return false;
      }
    }
    if (filters.scope === "mine" && !isMine(row, filters)) return false;
    if (filters.purpose && row.purpose !== filters.purpose) return false;
    if (filters.type && row.type !== filters.type) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.project_status && row.project_status !== filters.project_status) {
      return false;
    }
    if (filters.city && row.city !== filters.city) return false;
    if (filters.community && row.community !== filters.community) return false;
    if (filters.sub_community && row.sub_community !== filters.sub_community) {
      return false;
    }
    if (filters.building && row.building !== filters.building) return false;
    if (filters.listing_agent && row.listing_agent !== filters.listing_agent) {
      return false;
    }
    if (filters.listing_owner && row.listing_owner !== filters.listing_owner) {
      return false;
    }
    if (filters.landlord && row.landlord_name !== filters.landlord) return false;
    if (filters.developer && !sameName(row.developer, filters.developer)) return false;
    if (filters.listing_id) {
      const wanted = String(filters.listing_id).trim().toLowerCase();
      const ref = String(row.reference || "").trim().toLowerCase();
      const id = String(row.id || "").trim().toLowerCase();
      const suffix = /^\d+$/.test(wanted) ? `a7group-${wanted}` : "";
      if (ref !== wanted && id !== wanted && (!suffix || ref !== suffix)) return false;
    }
    if (filters.unit_no && row.unit_no !== filters.unit_no) return false;
    if (filters.permit_number && row.permit_number !== filters.permit_number) {
      return false;
    }
    if (filters.landlord_email && !sameName(row.landlord_email, filters.landlord_email)) {
      return false;
    }
    if (filters.landlord_phone && row.landlord_phone !== filters.landlord_phone) {
      return false;
    }
    if (filters.minBeds && row.beds < Number(filters.minBeds)) return false;
    if (filters.maxBeds && row.beds > Number(filters.maxBeds)) return false;
    if (filters.minPrice && row.price_aed < Number(filters.minPrice)) return false;
    if (filters.maxPrice && row.price_aed > Number(filters.maxPrice)) return false;
    if (!listingMatchesQuality(row, filters.quality)) return false;
    if (filters.q) {
      const q = String(filters.q).toLowerCase();
      const hay = [
        row.title,
        row.reference,
        row.community,
        row.sub_community,
        row.building,
        row.listing_agent,
        row.unit_no,
        row.permit_number,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortListings(rows, sort, dir) {
  const key = String(sort || "updated_at");
  const factor = dir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (typeof a === "number" || typeof b === "number") {
      return (Number(a || 0) - Number(b || 0)) * factor;
    }
    return String(a || "").localeCompare(String(b || "")) * factor;
  });
  return copy;
}

export function paginate(rows, page, pageSize) {
  const size = [10, 25, 50, 100].includes(Number(pageSize))
    ? Number(pageSize)
    : 10;
  const total = rows.length;
  const maxPage = Math.max(1, Math.ceil(total / size) || 1);
  const current = Math.min(maxPage, Math.max(1, Number(page || 1)));
  const start = (current - 1) * size;
  return {
    listings: rows.slice(start, start + size),
    total,
    page: current,
    pageSize: size,
  };
}

export function summarize(rows, filters) {
  const mine = rows.filter((row) => isMine(row, filters));
  const byStatus = (list) => {
    const out = { all: list.length };
    for (const status of STATUSES) out[status] = 0;
    for (const row of list) out[row.status] += 1;
    return out;
  };
  const emptyCategory = () => ({
    total: 0,
    sale: 0,
    rent: 0,
    portals: Object.fromEntries(PORTALS.map((portal) => [portal, 0])),
  });
  const infographics = {
    purpose: { sale: 0, rent: 0 },
    category: { residential: 0, commercial: 0 },
    type: Object.fromEntries(TYPES.map((type) => [type, 0])),
    portals: Object.fromEntries(PORTALS.map((portal) => [portal, 0])),
    status: byStatus(rows),
    byCategory: {
      commercial: emptyCategory(),
      residential: emptyCategory(),
    },
  };
  for (const row of rows) {
    infographics.purpose[row.purpose] += 1;
    infographics.category[row.category] += 1;
    infographics.type[row.type] += 1;
    const bucket =
      infographics.byCategory[
        row.category === "commercial" ? "commercial" : "residential"
      ];
    bucket.total += 1;
    if (row.purpose === "rent") bucket.rent += 1;
    else bucket.sale += 1;
    for (const portal of PORTALS) {
      if (!listingIsLiveOnPortal(row, portal)) continue;
      infographics.portals[portal] += 1;
      if (bucket.portals[portal] !== undefined) bucket.portals[portal] += 1;
    }
  }
  return {
    counts: {
      ...byStatus(rows),
      availability: rows.filter((row) => row.status === "live").length,
      mine: byStatus(mine),
    },
    infographics,
  };
}

export function collectMeta(rows) {
  const uniq = (key) =>
    [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
  return {
    cities: uniq("city"),
    communities: uniq("community"),
    sub_communities: uniq("sub_community"),
    buildings: uniq("building"),
    agents: uniq("listing_agent"),
    owners: uniq("listing_owner"),
    landlords: uniq("landlord_name"),
    developers: uniq("developer"),
    pf_accounts: uniq("pf_account"),
    bayut_accounts: uniq("bayut_account"),
    types: TYPES,
    portals: PORTALS,
    portal_names: PORTAL_NAMES,
    categories: CATEGORIES,
    project_statuses: PROJECT_STATUSES,
  };
}

export function locationPath(row) {
  return [row.city, row.community, row.sub_community, row.building]
    .filter(Boolean)
    .join(" > ");
}
