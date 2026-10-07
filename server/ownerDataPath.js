export const OWNER_DATA_TYPE_ID = 1042;
export const OWNER_DATA_CATEGORY_ID = 14;

export const OWNER_LIST_FILTER_FIELDS = {
  community: "PARENT_ID_1058",
  communityAlt: "parentId1058",
  subCommunity: "PARENT_ID_1062",
  subCommunityAlt: "parentId1062",
  unitType: "UF_CRM5_1734246899822",
  unitTypeAlt: "ufCrm5_1734246899822",
  beds: "UF_CRM5_1734246780476",
  bedsAlt: "ufCrm5_1734246780476",
};

function fallbackStageIds(purpose = "") {
  const prefix = `DT${OWNER_DATA_TYPE_ID}_${OWNER_DATA_CATEGORY_ID}`;
  if (purpose === "rent") return [`${prefix}:RENT`];
  if (purpose === "sale") return [`${prefix}:SALE`];
  if (purpose === "sale_rent") return [`${prefix}:BOTH`, `${prefix}:SALERENT`];
  return [`${prefix}:RENT`, `${prefix}:SALE`, `${prefix}:BOTH`, `${prefix}:SALERENT`];
}

function uniqueIds(values) {
  return [...new Set((values || []).map((id) => String(id || "").replace(/\D/g, "")).filter(Boolean))];
}

function uniqueText(values) {
  return [...new Set((values || []).map((id) => String(id || "").trim()).filter(Boolean))];
}

function setFilterField(params, field, values) {
  const list = uniqueIds(values);
  if (!list.length) return;
  if (list.length === 1) params.set(field, list[0]);
  else for (const id of list) params.append(`${field}[]`, id);
}

export function ownerDataListPath({
  agentId = "",
  purpose = "",
  stageIds = [],
  itemIds = [],
  communityIds = [],
  subCommunityIds = [],
  unitTypeIds = [],
  bedValues = [],
} = {}) {
  const params = new URLSearchParams();
  params.set("apply_filter", "Y");
  const agent = String(agentId || "").replace(/\D/g, "");
  if (agent) params.set("ASSIGNED_BY_ID", agent);

  const ids = uniqueIds(itemIds);
  // Many ID[] values get truncated, so Bitrix keeps only Responsible person and shows mixed stages.
  if (ids.length === 1) params.set("ID", ids[0]);

  setFilterField(params, OWNER_LIST_FILTER_FIELDS.community, communityIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.communityAlt, communityIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.subCommunity, subCommunityIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.subCommunityAlt, subCommunityIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.unitType, unitTypeIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.unitTypeAlt, unitTypeIds);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.beds, bedValues);
  setFilterField(params, OWNER_LIST_FILTER_FIELDS.bedsAlt, bedValues);

  const stages = uniqueText(stageIds);
  if (stages.length) {
    for (const id of stages) params.append("STAGE_ID[]", id);
  } else if (ids.length !== 1) {
    const list = fallbackStageIds(purpose);
    for (const id of list) params.append("STAGE_ID[]", id);
  }
  return `/crm/type/${OWNER_DATA_TYPE_ID}/list/category/${OWNER_DATA_CATEGORY_ID}/?${params}`;
}
