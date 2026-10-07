/** Bitrix CRM list UI query — must match Infographics Check filters (agent, period, stage). */

export function bitrixUiDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || "").trim());
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export function crmListPath(entity, { semantic, agentId, statusId, sourceId, from, to } = {}) {
  const base = entity === "deal" ? "/crm/deal/list/" : "/crm/lead/list/";
  const params = new URLSearchParams();
  if (semantic) {
    params.set("apply_filter", "Y");
    params.set(entity === "deal" ? "STAGE_SEMANTIC_ID" : "STATUS_SEMANTIC_ID", semantic);
  }
  if (statusId) {
    params.set("apply_filter", "Y");
    params.set(entity === "deal" ? "STAGE_ID" : "STATUS_ID", String(statusId));
  }
  if (sourceId) {
    params.set("apply_filter", "Y");
    params.set("SOURCE_ID", String(sourceId));
  }
  if (agentId) {
    params.set("apply_filter", "Y");
    params.set("ASSIGNED_BY_ID", String(agentId));
  }
  const dateFrom = bitrixUiDate(from);
  const dateTo = bitrixUiDate(to);
  if (dateFrom || dateTo) {
    params.set("apply_filter", "Y");
    params.set("DATE_CREATE_datesel", "RANGE");
    if (dateFrom) params.set("DATE_CREATE_from", dateFrom);
    if (dateTo) params.set("DATE_CREATE_to", dateTo);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
