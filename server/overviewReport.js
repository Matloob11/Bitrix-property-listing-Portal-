import { historyActorLabel } from "./listingModel.js";

const WINDOWS = new Set([7, 14, 30]);
const SYNC_ACTOR = /property finder|portal list csv|old desk csv|portal live restore/i;
const WORKING = new Set(["live", "draft", "pending"]);

export function reportDays(value) {
  const n = Number(value);
  return WINDOWS.has(n) ? n : 7;
}

function sinceIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function historyOf(listing) {
  return Array.isArray(listing?.history) ? listing.history : [];
}

function isDeskEdit(entry) {
  return Boolean(entry?.at) && entry.field !== "created" && !SYNC_ACTOR.test(String(entry.by || ""));
}

export function listingActivity(listing) {
  const history = historyOf(listing);
  const created = history.find((entry) => entry.field === "created");
  const posted_at = created?.at || listing.created_at || "";
  const posted_by = historyActorLabel(created?.by || listing.created_by || listing.listing_agent || "", created?.byId || "");
  const edits = history.filter(isDeskEdit).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const edit = edits[0] || null;
  let edited_at = edit?.at || "";
  if (edited_at && posted_at) {
    const postedMs = new Date(posted_at).getTime();
    const editedMs = new Date(edited_at).getTime();
    if (Number.isFinite(postedMs) && Number.isFinite(editedMs) && Math.abs(editedMs - postedMs) < 2000) {
      edited_at = "";
    }
  }
  return {
    id: listing.id,
    reference: listing.reference,
    title: listing.title || "",
    status: listing.status,
    working: WORKING.has(listing.status),
    posted_at,
    posted_by,
    edited_at,
    edited_by: edited_at ? historyActorLabel(edit?.by || "", edit?.byId || "") : "",
  };
}

function laterIso(left, right) {
  if (!left) return right || "";
  if (!right) return left;
  return String(right).localeCompare(String(left)) > 0 ? right : left;
}

export function buildAgentActivity(listings) {
  const people = new Map();
  for (const row of listings || []) {
    const name = String(row.listing_agent || "").trim() || "Unassigned";
    if (!people.has(name)) {
      people.set(name, {
        name,
        ads: 0,
        working: 0,
        last_posted: "",
        last_edited: "",
        listings: [],
      });
    }
    const person = people.get(name);
    const item = listingActivity(row);
    person.ads += 1;
    if (item.working) person.working += 1;
    person.last_posted = laterIso(person.last_posted, item.posted_at);
    person.last_edited = laterIso(person.last_edited, item.edited_at);
    person.listings.push(item);
  }
  for (const person of people.values()) {
    person.listings.sort(
      (a, b) => String(b.posted_at || "").localeCompare(String(a.posted_at || "")) || String(a.reference).localeCompare(String(b.reference))
    );
  }
  return [...people.values()].sort((a, b) => b.ads - a.ads || a.name.localeCompare(b.name));
}

function photoCount(listing) {
  const gallery = Array.isArray(listing.gallery) ? listing.gallery : [];
  return gallery.filter((item) => item && item.kind !== "floorplan").length || (listing.photo ? 1 : 0);
}

function leadMaps(leads) {
  const byRef = new Map();
  const byId = new Map();
  const byAgent = new Map();
  for (const lead of leads) {
    if (lead.reference) byRef.set(lead.reference, (byRef.get(lead.reference) || 0) + 1);
    if (lead.listing_id) byId.set(lead.listing_id, (byId.get(lead.listing_id) || 0) + 1);
    const agent = String(lead.agent_name || "").trim();
    if (agent) byAgent.set(agent, (byAgent.get(agent) || 0) + 1);
  }
  return { byRef, byId, byAgent };
}

function leadsFor(listing, maps) {
  return maps.byId.get(listing.id) || maps.byRef.get(listing.reference) || 0;
}

function card(listing, count) {
  return {
    id: listing.id,
    reference: listing.reference,
    title: listing.title,
    photo: listing.photo,
    listing_agent: listing.listing_agent || "Unassigned",
    community: listing.community,
    score: listing.pf_quality_score === "" ? null : Number(listing.pf_quality_score),
    live: listing.pf_is_live === "1",
    photos: photoCount(listing),
    leads: count,
  };
}

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

export function attachLeadCounts(listings, leads) {
  const maps = leadMaps(leads);
  return listings.map((row) => ({ ...row, lead_count: leadsFor(row, maps) }));
}

export function buildOverviewReport(listings, leads, days) {
  const windowDays = reportDays(days);
  const windowLeads = leads.filter((lead) => lead.created_at && lead.created_at >= sinceIso(windowDays));
  const allMaps = leadMaps(leads);
  const winMaps = leadMaps(windowLeads);

  const people = new Map();
  for (const row of listings) {
    const name = String(row.listing_agent || "").trim() || "Unassigned";
    if (!people.has(name)) people.set(name, { name, ads: 0, live: 0, leads_all: 0, leads_window: 0 });
    const person = people.get(name);
    person.ads += 1;
    if (row.pf_is_live === "1") person.live += 1;
  }
  for (const [name, count] of winMaps.byAgent) {
    if (!people.has(name)) people.set(name, { name, ads: 0, live: 0, leads_all: 0, leads_window: 0 });
    people.get(name).leads_window += count;
  }
  for (const [name, count] of allMaps.byAgent) {
    if (!people.has(name)) people.set(name, { name, ads: 0, live: 0, leads_all: 0, leads_window: 0 });
    people.get(name).leads_all += count;
  }

  const ranked = listings
    .map((row) => card(row, leadsFor(row, winMaps)))
    .sort((a, b) => b.leads - a.leads || String(a.reference).localeCompare(String(b.reference)));
  const withLeads = ranked.filter((row) => row.leads > 0);
  const highest = withLeads[0] || null;
  const lowest = withLeads.length ? withLeads[withLeads.length - 1] : null;
  const zeroLeads = ranked.filter((row) => row.leads === 0).length;

  const scores = listings
    .filter((row) => row.pf_quality_score !== "")
    .map((row) => ({
      ...card(row, leadsFor(row, winMaps)),
      score: Number(row.pf_quality_score),
    }))
    .sort((a, b) => b.score - a.score);

  const high = withLeads.slice(0, 5);
  const low = [...withLeads].reverse().slice(0, 5);
  const reasons = [];
  if (!withLeads.length) {
    reasons.push(`No listing received a lead in the last ${windowDays} days, so a high-vs-low comparison is not possible yet.`);
  } else {
    const highLive = high.filter((row) => row.live).length;
    const lowLive = low.filter((row) => row.live).length;
    const highScore = avg(high.map((row) => row.score).filter((n) => n != null));
    const lowScore = avg(low.map((row) => row.score).filter((n) => n != null));
    const highPhotos = avg(high.map((row) => row.photos));
    const lowPhotos = avg(low.map((row) => row.photos));
    const communities = [...new Set(high.map((row) => row.community).filter(Boolean))];
    if (highLive > lowLive) {
      reasons.push(`Ads that stayed live on Property Finder collected more leads (${highLive} of the top ${high.length} are live vs ${lowLive} of the lowest).`);
    }
    if (highScore && lowScore && highScore > lowScore) {
      reasons.push(`Higher PF quality scores line up with more leads (top ads average ${highScore}, lowest ads average ${lowScore}).`);
    }
    if (highPhotos > lowPhotos) {
      reasons.push(`Top ads show more photos on average (${highPhotos} vs ${lowPhotos}).`);
    }
    if (communities.length) {
      reasons.push(`Most leads in this window clustered in: ${communities.slice(0, 5).join(", ")}.`);
    }
    if (highest) {
      reasons.push(`${highest.reference} has the most leads (${highest.leads}) in the last ${windowDays} days — agent ${highest.listing_agent}.`);
    }
    if (!reasons.length) {
      reasons.push("Lead volume is close across listings in this window; no single quality or location gap stands out.");
    }
  }

  return {
    days: windowDays,
    featured_premium: {
      available: false,
      featured: 0,
      premium: 0,
      note: "The Property Finder listings API on this account does not send featured or premium product type. Counts stay 0 rather than guessed.",
    },
    ads_per_person: [...people.values()].sort((a, b) => b.ads - a.ads || a.name.localeCompare(b.name)),
    agent_activity: buildAgentActivity(listings),
    leads_per_person: [...people.values()].sort((a, b) => b.leads_window - a.leads_window || a.name.localeCompare(b.name)),
    leads_per_listing: ranked.slice(0, 25),
    scores: scores.slice(0, 20),
    extremes: {
      highest,
      lowest,
      zero_leads: zeroLeads,
      listings_with_leads: withLeads.length,
    },
    reasons,
    window_leads: windowLeads.length,
  };
}
