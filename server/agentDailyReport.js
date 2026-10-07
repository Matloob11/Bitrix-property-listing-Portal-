/** Agent daily / monthly CRM + lead-share report (Check only — no auto Bitrix load). */
import {
  CACHE_MS,
  crmRead,
  dateFilter,
  junkStatusIds,
  listFilteredPages,
  loadAgentHistory,
  mapLeadHistory,
  normalizeAgentId,
  periodRange,
  resolveCrmAgent,
  statusNameMap,
} from "./crmIntelligence.js";

import { listTlNotes } from "./tlNotes.js";

const memory = new Map();
const inflight = new Map();
const REPORT_CACHE_VER = "v4";

export function reportRange({ mode = "day", day = "", month = "", period = "" } = {}, now = new Date()) {
  const m = String(mode || "day").toLowerCase();
  if (m === "period" && period) {
    const range = periodRange(period, now);
    return { mode: "period", period: range.period, from: range.from, to: range.to, label: range.period };
  }
  if (m === "month") {
    const raw = String(month || "").trim();
    const match = /^(\d{4})-(\d{2})$/.exec(raw);
    if (match) {
      const y = Number(match[1]);
      const mo = Number(match[2]);
      const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      const from = `${y}-${String(mo).padStart(2, "0")}-01 00:00:00`;
      const to = `${y}-${String(mo).padStart(2, "0")}-${String(last).padStart(2, "0")} 23:59:59`;
      return { mode: "month", period: "Custom", from, to, label: `${y}-${String(mo).padStart(2, "0")}` };
    }
  }
  const today = periodRange("Today", now);
  const d = String(day || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return {
      mode: "day",
      period: "Custom",
      from: `${d} 00:00:00`,
      to: `${d} 23:59:59`,
      label: d,
    };
  }
  return { mode: "day", period: "Today", from: today.from, to: today.to, label: String(today.from).slice(0, 10) };
}

function personName(row) {
  return [row?.NAME, row?.LAST_NAME].map((part) => String(part || "").trim()).filter(Boolean).join(" ")
    || String(row?.EMAIL || "").trim()
    || `User ${row?.ID || ""}`.trim();
}

async function loadUser(post, id) {
  const body = await post("user.get", { ID: id });
  const rows = Array.isArray(body?.result) ? body.result : body?.result ? [body.result] : [];
  return rows[0] || { ID: id, NAME: "Agent" };
}

async function loadStatuses(post) {
  const [leadBody, sourceBody] = await Promise.all([
    post("crm.status.list", { filter: { ENTITY_ID: "STATUS" } }),
    post("crm.status.list", { filter: { ENTITY_ID: "SOURCE" } }),
  ]);
  return {
    leadStatuses: Array.isArray(leadBody?.result) ? leadBody.result : [],
    sources: Array.isArray(sourceBody?.result) ? sourceBody.result : [],
  };
}

async function loadActivities(post, sleep, agentId, from, to) {
  const id = String(agentId);
  const filter = { ...dateFilter(from, to, "CREATED"), RESPONSIBLE_ID: id };
  const select = ["ID", "SUBJECT", "CREATED", "TYPE_ID", "OWNER_ID", "OWNER_TYPE_ID", "RESPONSIBLE_ID", "AUTHOR_ID"];
  const meetings = await listFilteredPages({
    post,
    sleep,
    method: "crm.activity.list",
    filter: { ...filter, TYPE_ID: 1 },
    select,
    maxPages: 8,
  });
  const all = await listFilteredPages({
    post,
    sleep,
    method: "crm.activity.list",
    filter,
    select,
    maxPages: 8,
  });
  const onlyMine = (rows) =>
    (rows || []).filter((row) => {
      const owner = String(row?.RESPONSIBLE_ID || "").replace(/\D/g, "");
      return !owner || owner === String(id).replace(/\D/g, "");
    });
  const meetingRows = onlyMine(meetings.rows);
  const activityRows = onlyMine(all.rows);
  return {
    meetings: meetingRows,
    activities: activityRows,
    meetingsCount: meetingRows.length,
    activitiesCount: activityRows.length,
    truncated: meetings.truncated || all.truncated,
    calls: meetings.calls + all.calls,
  };
}

/** Activities on this agent's leads done by someone else (TL / another user). */
async function loadTeamLeadActions(post, sleep, agentId, leadIds, from, to) {
  const mine = String(agentId).replace(/\D/g, "");
  const ids = [...new Set((leadIds || []).map((value) => String(value || "").replace(/\D/g, "")).filter(Boolean))].slice(0, 60);
  if (!ids.length) return { rows: [], truncated: false, calls: 0 };
  const select = ["ID", "SUBJECT", "CREATED", "TYPE_ID", "OWNER_ID", "OWNER_TYPE_ID", "RESPONSIBLE_ID", "AUTHOR_ID"];
  const filter = {
    ...dateFilter(from, to, "CREATED"),
    OWNER_TYPE_ID: 1,
    "@OWNER_ID": ids,
  };
  let listed;
  try {
    listed = await listFilteredPages({
      post,
      sleep,
      method: "crm.activity.list",
      filter,
      select,
      maxPages: 6,
    });
  } catch {
    return { rows: [], truncated: false, calls: 0, error: "Could not load TL/other activities on agent leads" };
  }
  const rows = (listed.rows || []).filter((row) => {
    const responsible = String(row?.RESPONSIBLE_ID || "").replace(/\D/g, "");
    const author = String(row?.AUTHOR_ID || "").replace(/\D/g, "");
    // Keep actions by someone other than the agent (team lead / peer).
    if (responsible && responsible !== mine) return true;
    if (author && author !== mine && responsible === mine) return true;
    return Boolean(responsible && responsible !== mine);
  });
  return { rows, truncated: Boolean(listed.truncated), calls: listed.calls || 0 };
}

function mapActivityRow(row) {
  return {
    id: String(row.ID || ""),
    subject: String(row.SUBJECT || "Activity"),
    typeId: String(row.TYPE_ID || ""),
    created: String(row.CREATED || ""),
    leadId: String(row.OWNER_ID || ""),
    responsibleId: String(row.RESPONSIBLE_ID || ""),
    authorId: String(row.AUTHOR_ID || ""),
  };
}

function inRange(iso, from, to) {
  const t = Date.parse(String(iso || "").replace(" ", "T"));
  const a = Date.parse(String(from || "").replace(" ", "T"));
  const b = Date.parse(String(to || "").replace(" ", "T"));
  if (!Number.isFinite(t) || !Number.isFinite(a) || !Number.isFinite(b)) return false;
  return t >= a && t <= b;
}

/** Load ASSIGNED_BY_ID for lead ids (batched). */
async function loadLeadAssignees(post, leadIds) {
  const ids = [...new Set((leadIds || []).map((value) => String(value || "").replace(/\D/g, "")).filter(Boolean))];
  const map = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const body = await post("crm.lead.list", {
      filter: { "@ID": chunk },
      select: ["ID", "ASSIGNED_BY_ID", "TITLE", "STATUS_ID", "DATE_CREATE", "DATE_MODIFY", "SOURCE_ID", "NAME", "LAST_NAME"],
      start: 0,
    });
    const rows = Array.isArray(body?.result) ? body.result : Array.isArray(body?.result?.result) ? body.result.result : [];
    for (const row of rows) {
      map.set(String(row.ID || ""), row);
    }
  }
  return map;
}

/**
 * Daily report verify: a lead counts as worked for this agent only when
 * Bitrix says ASSIGNED_BY_ID = agent AND (created in the day/month OR agent activity on that lead).
 * Never count: old leads only DATE_MODIFIED, or activity on someone else's lead.
 */
export function verifyDailyLeadWork({
  agentId,
  from,
  to,
  history,
  myActivityLeadIds = [],
  leadStatuses = [],
} = {}) {
  const id = normalizeAgentId(agentId);
  const mineActs = new Set((myActivityLeadIds || []).map((value) => String(value || "").replace(/\D/g, "")).filter(Boolean));
  const names = statusNameMap(leadStatuses);
  const created = (history?.createdRows || []).filter((row) => normalizeAgentId(row?.ASSIGNED_BY_ID) === id);
  const createdMapped = created.map((row) => mapLeadHistory(row, names, new Map(), { forceWorked: mineActs.has(String(row?.ID || "")) }));

  const worked = new Map();
  for (const item of createdMapped) {
    if (!item.id) continue;
    if (item.worked || mineActs.has(item.id)) {
      worked.set(item.id, { ...item, worked: true, verify: mineActs.has(item.id) ? "activity" : "created_status" });
    }
  }
  // Activity on leads assigned to this agent but not in created-in-period list
  for (const leadId of mineActs) {
    if (worked.has(leadId)) continue;
    const fromHist = [...(history?.worked || []), ...(history?.idle || [])].find((row) => String(row.id) === leadId);
    if (fromHist && normalizeAgentId(fromHist.assignedById) === id) {
      worked.set(leadId, { ...fromHist, worked: true, verify: "activity" });
    }
  }

  const idle = createdMapped
    .filter((item) => item.id && !worked.has(item.id))
    .map((item) => ({ ...item, worked: false, verify: "assigned_idle" }));

  // Ignore DATE_MODIFY-only old leads (common false "worked" noise).
  return {
    worked: [...worked.values()],
    idle,
    ignoredModifyOnly: (history?.worked || []).filter(
      (row) => !worked.has(String(row.id)) && !inRange(row.created, from, to)
    ).length,
  };
}

export async function fetchShareReport({ agentId, from, to } = {}) {
  const token = String(process.env.BITRIX_SHARE_REPORT_TOKEN || "").trim();
  const base = String(process.env.BITRIX_SHARE_REPORT_URL || "https://crm.a7grouprealestatedxb.com/bitrix/tools/a7_lead_share_report.php").trim();
  if (!token) {
    return { ok: false, error: "Share report token is not configured", sharedOut: [], sharedIn: [], idleAlerts: [], totals: {} };
  }
  const url = new URL(base);
  url.searchParams.set("token", token);
  url.searchParams.set("agentId", String(agentId));
  if (from) url.searchParams.set("from", String(from).slice(0, 19).replace("T", " "));
  if (to) url.searchParams.set("to", String(to).slice(0, 19).replace("T", " "));
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) {
    return {
      ok: false,
      error: body?.error || `Share report failed (${res.status})`,
      sharedOut: [],
      sharedIn: [],
      idleAlerts: [],
      totals: {},
    };
  }
  return body;
}

function summarizeLeads(history, leadStatuses) {
  const names = statusNameMap(leadStatuses);
  const junkIds = new Set(junkStatusIds(leadStatuses));
  const worked = history.worked || [];
  const idle = history.idle || [];
  const proceeded = worked.filter((row) => {
    const semantic = String(row.status || "").toLowerCase();
    return /progress|contact|meeting|option|booking|qualified|prospect|answer/i.test(semantic)
      || /converted|success/i.test(semantic);
  });
  const junk = [...worked, ...idle].filter((row) => {
    const id = [...junkIds].find((jid) => names.get(jid) === row.status) || "";
    return /junk/i.test(String(row.status || "")) || Boolean(id);
  });
  return {
    workedCount: worked.length,
    idleCount: idle.length,
    proceededCount: proceeded.length,
    junkCount: junk.length,
    worked,
    idle,
    proceeded,
    junk,
  };
}

export async function checkAgentDailyReport({
  db,
  agentId,
  agentName,
  mode,
  day,
  month,
  period,
  force = false,
  post = crmRead,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let id = normalizeAgentId(agentId);
  if (!id && String(agentName || "").trim()) {
    const found = await resolveCrmAgent({ post, name: agentName, includeInactive: true });
    if (!found) {
      const error = new Error("This name is not in CRM. Check spelling or pick from the list.");
      error.status = 404;
      throw error;
    }
    id = found.id;
  }
  if (!id) {
    const error = new Error("Search and select an agent first — Bitrix is only called after Check.");
    error.status = 400;
    throw error;
  }

  const range = reportRange({ mode, day, month, period });
  // Reject inverted / empty ranges so day/month never silently return another window.
  if (!range.from || !range.to || String(range.from) > String(range.to)) {
    const error = new Error("Pick a valid day or month before Check.");
    error.status = 400;
    throw error;
  }
  const key = `${REPORT_CACHE_VER}:daily:${id}:${range.from}:${range.to}`;
  const settingKey = `agent_daily_${key}`;
  if (!force) {
    const fresh = memory.get(key) || (db ? await db.getSetting(settingKey, null) : null);
    if (fresh?.checkedAt && Date.now() - Number(fresh.checkedAt) < CACHE_MS) {
      // Never return a cached payload for a different agent/range.
      if (normalizeAgentId(fresh.agentId) === id && fresh.range?.from === range.from && fresh.range?.to === range.to) {
        memory.set(key, fresh);
        return { ...fresh, cached: true };
      }
    }
  }
  if (inflight.has(key)) return inflight.get(key);

  const run = (async () => {
    const user = await loadUser(post, id);
    const meta = await loadStatuses(post);
    // Activities first — real calls/meetings prove work even if status still looks idle.
    const acts = await loadActivities(post, sleep, id, range.from, range.to);
    const activityOwnerIds = (acts.activities || [])
      .filter((row) => String(row.OWNER_TYPE_ID || "1") === "1")
      .map((row) => String(row.OWNER_ID || ""))
      .filter(Boolean);
    // Only activities on leads Bitrix assigns to THIS agent count toward "leads worked".
    const leadRowsById = await loadLeadAssignees(post, activityOwnerIds);
    const myActivityLeadIds = activityOwnerIds.filter((leadId) => {
      const row = leadRowsById.get(String(leadId));
      return normalizeAgentId(row?.ASSIGNED_BY_ID) === id;
    });
    const history = await loadAgentHistory({
      post,
      sleep,
      agentId: id,
      from: range.from,
      to: range.to,
      period: range.period,
      leadStatuses: meta.leadStatuses,
      dealStages: [],
      sources: meta.sources,
      activityLeadIds: myActivityLeadIds,
    });
    const verified = verifyDailyLeadWork({
      agentId: id,
      from: range.from,
      to: range.to,
      history,
      myActivityLeadIds,
      leadStatuses: meta.leadStatuses,
    });
    // Enrich activity-only worked rows that were missing titles from assignee fetch.
    for (const row of verified.worked) {
      if (row.title && row.title !== `Lead #${row.id}`) continue;
      const raw = leadRowsById.get(String(row.id));
      if (!raw) continue;
      const mapped = mapLeadHistory(raw, statusNameMap(meta.leadStatuses), statusNameMap(meta.sources), { forceWorked: true });
      Object.assign(row, mapped, { worked: true, verify: row.verify || "activity" });
    }
    const leadIdsForTl = [
      ...verified.worked.map((row) => row.id),
      ...verified.idle.map((row) => row.id),
      ...(history.createdRows || []).map((row) => String(row.ID || "")),
    ];
    const tlActs = await loadTeamLeadActions(post, sleep, id, leadIdsForTl, range.from, range.to);
    const verifiedHistory = { worked: verified.worked, idle: verified.idle };
    const leadSummary = summarizeLeads(verifiedHistory, meta.leadStatuses);
    const share = await fetchShareReport({ agentId: id, from: range.from, to: range.to });
    const noteDay = range.mode === "day" ? range.label : "";
    const noteMonth = range.mode === "month" ? range.label : String(range.from || "").slice(0, 7);
    const tlNotes = await listTlNotes(db, {
      agentId: id,
      day: noteDay,
      month: range.mode === "month" ? noteMonth : "",
    });

    const report = {
      ok: true,
      cached: false,
      checkedAt: Date.now(),
      cacheUntil: Date.now() + CACHE_MS,
      agentId: id,
      agentName: personName(user),
      range,
      note: "Verified from Bitrix: leads worked = assigned to this agent AND (created in this period or agent activity on that lead). Activities on other agents' leads are listed under Activities only. Shared in/out comes from the lead-share tool.",
      verify: {
        bitrixCreatedAssigned: (history.createdRows || []).length,
        activityOnOwnLeads: myActivityLeadIds.length,
        activityTotal: (acts.activities || []).length,
        ignoredModifyOnly: verified.ignoredModifyOnly,
      },
      summary: {
        leadsWorked: leadSummary.workedCount,
        leadsNotWorked: leadSummary.idleCount,
        leadsProceeded: leadSummary.proceededCount,
        leadsJunk: leadSummary.junkCount,
        meetings: acts.meetingsCount,
        activities: acts.activitiesCount,
        tlActions: tlActs.rows.length,
        sharedOut: share.totals?.sharedOut ?? (share.sharedOut || []).length,
        sharedOutWorked: share.totals?.sharedOutWorked ?? 0,
        sharedOutIdle: share.totals?.sharedOutIdle ?? 0,
        sharedIn: share.totals?.sharedIn ?? (share.sharedIn || []).length,
        idleAlerts: share.totals?.idleAlerts ?? (share.idleAlerts || []).length,
      },
      leads: {
        worked: leadSummary.worked.slice(0, 200),
        notWorked: leadSummary.idle.slice(0, 200),
        proceeded: leadSummary.proceeded.slice(0, 200),
        junk: leadSummary.junk.slice(0, 100),
        truncated: Boolean(history.truncated),
      },
      activities: {
        meetings: (acts.meetings || []).slice(0, 100).map(mapActivityRow),
        rows: (acts.activities || []).slice(0, 150).map(mapActivityRow),
        truncated: Boolean(acts.truncated),
      },
      teamLeadActions: {
        rows: (tlActs.rows || []).slice(0, 150).map(mapActivityRow),
        truncated: Boolean(tlActs.truncated),
        error: tlActs.error || "",
      },
      tlNotes,
      shares: {
        ok: share.ok !== false,
        error: share.error || "",
        sharedOut: share.sharedOut || [],
        sharedIn: share.sharedIn || [],
        idleAlerts: share.idleAlerts || [],
        totals: share.totals || {},
      },
    };
    memory.set(key, report);
    if (db?.setSetting) await db.setSetting(settingKey, report).catch(() => {});
    return report;
  })().finally(() => inflight.delete(key));

  inflight.set(key, run);
  return run;
}
