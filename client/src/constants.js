export const TABS = [
  ["all", "All Listing", "all"],
  ["mine", "My Listing", "mine"],
  ["draft", "My Draft", "mine"],
  ["live", "My Live", "mine"],
  ["pending", "My Pending", "mine"],
  ["archived", "My Archived", "mine"],
  ["duplicate", "My Duplicate", "mine"],
  ["pocket", "My Pocket Listing", "mine"],
];

export const TYPES = ["apartment", "villa", "townhouse", "penthouse", "office"];
export const PORTALS = [
  "pf",
  "pf_api",
  "bayut",
  "dubizzle",
  "website",
  "rightmove",
];
export const PORTAL_LABEL = {
  pf: "PF",
  pf_api: "PF API",
  bayut: "Bayut",
  dubizzle: "Dubizzle",
  website: "Website",
  rightmove: "Rightmove",
};
export const PAGE_SIZES = [10, 25, 50, 100];
export const STATUSES = [
  "draft",
  "live",
  "pending",
  "archived",
  "duplicate",
  "pocket",
];
export const PROJECT_STATUS_LABEL = {
  ready_secondary: "Ready / Secondary",
  offplan_secondary: "Off-Plan / Secondary",
  ready_primary: "Ready / Primary",
  offplan_primary: "Off-Plan / Primary",
};

export const emptyForm = {
  title: "",
  reference: "",
  community: "",
  sub_community: "",
  building: "",
  city: "Dubai",
  type: "apartment",
  purpose: "sale",
  status: "draft",
  category: "residential",
  project_status: "ready_secondary",
  beds: 1,
  baths: 1,
  area_sqft: 1000,
  price_aed: 0,
  photo: "",
  portals: [],
  unit_no: "",
  permit_number: "",
  landlord_name: "",
  landlord_email: "",
  landlord_phone: "",
  listing_agent: "",
  listing_owner: "",
  developer: "",
  portal_expiry: "",
};

export const emptyFilters = {
  tab: "all",
  status: "",
  scope: "",
  purpose: "",
  type: "",
  category: "",
  project_status: "",
  city: "",
  community: "",
  sub_community: "",
  building: "",
  listing_agent: "",
  listing_owner: "",
  landlord: "",
  developer: "",
  portal: "",
  listing_id: "",
  unit_no: "",
  permit_number: "",
  landlord_email: "",
  landlord_phone: "",
  q: "",
  minBeds: "",
  maxBeds: "",
  minPrice: "",
  maxPrice: "",
  page: 1,
  pageSize: 10,
};

export function money(n) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

export function layout(row) {
  return `${row.beds} / ${row.baths} · ${Number(row.area_sqft).toLocaleString()} sqft`;
}

export function when(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(status) {
  return status === "pocket" ? "Stock" : status;
}

export function locationPath(row) {
  return [row.city, row.community, row.sub_community, row.building]
    .filter(Boolean)
    .join(" > ");
}

export async function api(path, options) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (res.headers.get("content-type")?.includes("application/json") === false) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return body;
}

export function options(list) {
  return (list || []).filter(Boolean);
}

export function queryString(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === "tab") continue;
    if (value !== "" && value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function tabFilters(tab) {
  if (tab === "all") return { tab, scope: "", status: "", page: 1 };
  if (tab === "mine") return { tab, scope: "mine", status: "", page: 1 };
  return { tab, scope: "mine", status: tab, page: 1 };
}

export function countForTab(counts, key) {
  if (key === "all") return counts.all ?? 0;
  if (key === "mine") return counts.mine?.all ?? 0;
  return counts.mine?.[key] ?? 0;
}
