// Actual Bayut / Dubizzle live ads from the public agency pages (not the XML feed checkbox).
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const PORTAL_PUBLIC_URLS = {
  pf: "https://www.propertyfinder.ae/en/broker/a7-group-real-estate-8706",
  bayut: "https://www.bayut.com/companies/a7-group-real-estate-102128/",
  dubizzle: "https://uae.dubizzle.com/property-agencies/a7-group-real-estate-7171/",
};

const BAYUT_PAGES = [
  PORTAL_PUBLIC_URLS.bayut,
  "https://www.bayut.com/companies/a7-group-real-estate-102128/to-rent/",
  "https://www.bayut.com/companies/a7-group-real-estate-102128/for-sale/",
  "https://www.bayut.com/to-rent/property/uae/?agencies=102128",
  "https://www.bayut.com/for-sale/property/uae/?agencies=102128",
];

const DUBIZZLE_PAGES = [
  PORTAL_PUBLIC_URLS.dubizzle,
  "https://uae.dubizzle.com/property-for-rent/?agencies=7171",
  "https://uae.dubizzle.com/property-for-sale/?agencies=7171",
  "https://dubai.dubizzle.com/property-for-rent/?agencies=7171",
  "https://dubai.dubizzle.com/property-for-sale/?agencies=7171",
];

const REF_RE = /a7group-[\w-]+/gi;

export function extractAgencyRefs(html) {
  return new Set(
    [...String(html || "").matchAll(REF_RE)].map((match) => match[0].toLowerCase())
  );
}

function refKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  if (/captcha|pardon our interruption|verify your identity/i.test(text) && text.length < 8000) {
    throw new Error(`blocked ${url}`);
  }
  return text;
}

async function collectRefs(urls, extraPages = 8) {
  const refs = new Set();
  const errors = [];
  for (const url of urls) {
    try {
      const html = await fetchText(url);
      for (const ref of extractAgencyRefs(html)) refs.add(ref);
      for (let page = 2; page <= extraPages; page += 1) {
        const sep = url.includes("?") ? "&" : "?";
        const htmlPage = await fetchText(`${url}${sep}page=${page}`);
        const before = refs.size;
        for (const ref of extractAgencyRefs(htmlPage)) refs.add(ref);
        if (refs.size === before) break;
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  return { refs, errors };
}

export async function fetchBayutLiveRefs() {
  return collectRefs(BAYUT_PAGES);
}

export async function fetchDubizzleLiveRefs() {
  return collectRefs(DUBIZZLE_PAGES, 6);
}

function applyRefFlags(rows, refs, field) {
  let changed = 0;
  const next = [];
  for (const row of rows) {
    const live = refs.has(refKey(row.reference)) ? "1" : "";
    if (String(row[field] || "") === live) continue;
    next.push({ row, patch: { [field]: live } });
    changed += 1;
  }
  return { changed, next };
}

export async function syncEmpgPublicLive(db, { by = "Portal live sync" } = {}) {
  const summary = { bayut: 0, dubizzle: 0, updated: 0, errors: [] };
  const rows = await db.all();
  const bayut = await fetchBayutLiveRefs();
  const dubizzle = await fetchDubizzleLiveRefs();
  summary.errors.push(...bayut.errors, ...dubizzle.errors);

  const patches = [];
  if (bayut.refs.size >= 8) {
    const applied = applyRefFlags(rows, bayut.refs, "bayut_is_live");
    summary.bayut = bayut.refs.size;
    patches.push(...applied.next);
  } else {
    summary.errors.push(`bayut: only ${bayut.refs.size} public refs (skipped so flags are not wiped)`);
  }
  if (dubizzle.refs.size >= 8) {
    const applied = applyRefFlags(rows, dubizzle.refs, "dubizzle_is_live");
    summary.dubizzle = dubizzle.refs.size;
    patches.push(...applied.next);
  } else {
    summary.errors.push(`dubizzle: only ${dubizzle.refs.size} public refs (skipped so flags are not wiped)`);
  }

  const byId = new Map();
  for (const item of patches) {
    const current = byId.get(item.row.id) || { row: item.row, patch: {} };
    Object.assign(current.patch, item.patch);
    byId.set(item.row.id, current);
  }
  for (const item of byId.values()) {
    await db.updateDirect(item.row, item.patch, by);
    summary.updated += 1;
  }
  await db.setSetting("portal_public_live", {
    fetched_at: new Date().toISOString(),
    bayut_refs: summary.bayut,
    dubizzle_refs: summary.dubizzle,
    updated: summary.updated,
    errors: summary.errors.slice(0, 8),
    urls: PORTAL_PUBLIC_URLS,
  });
  return summary;
}

export async function applyStalePfLive(db, livePfIds, { by = "Property Finder sync" } = {}) {
  const live = livePfIds instanceof Set ? livePfIds : new Set(livePfIds || []);
  let cleared = 0;
  let kept = 0;
  for (const row of await db.all()) {
    const shouldLive = Boolean(row.pf_id && live.has(String(row.pf_id)));
    if (shouldLive) {
      kept += 1;
      if (row.pf_is_live !== "1") await db.updateDirect(row, { pf_is_live: "1" }, by);
      continue;
    }
    if (row.pf_is_live === "1" || row.pf_state === "live") {
      const patch = { pf_is_live: "" };
      if (row.pf_state === "live") patch.pf_state = "unpublished";
      await db.updateDirect(row, patch, by);
      cleared += 1;
    }
  }
  return { kept, cleared };
}
