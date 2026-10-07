export function leadPortal(row) {
  const tags = Array.isArray(row?.tags) ? row.tags.map((item) => String(item || "").toLowerCase()) : [];
  const entity = String(row?.entity_type || "").toLowerCase();
  if (tags.includes("bayut") || entity === "bayut") return "bayut";
  if (tags.includes("dubizzle") || entity === "dubizzle") return "dubizzle";
  if (tags.includes("other") || entity === "other") return "other";
  if (String(row?.id || "").startsWith("crm-")) return "other";
  return "pf";
}

export function leadPortalLabel(portal) {
  if (portal === "bayut") return "Bayut";
  if (portal === "dubizzle") return "Dubizzle";
  if (portal === "other") return "Other CRM";
  return "Property Finder";
}
