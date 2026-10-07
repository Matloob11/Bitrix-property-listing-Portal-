const BED_RE = /(\d+)\s*[-–]?\s*(?:bed(?:room)?s?|br\b)/gi;
const AR_BED_RE = /(\d+)\s*غرف(?:ة)?(?:\s*نوم)?/g;
const STUDIO_PLACE_RE = /\bstudio\s+(?:city|one|district|compound)\b/gi;

export function bedsLabel(count) {
  const n = Number(count);
  if (n === 0) return "Studio";
  if (n === 1) return "1 Bedroom";
  return `${n} Bedrooms`;
}

function stripStudioPlaces(text) {
  return String(text || "").replace(STUDIO_PLACE_RE, " ");
}

export function extractBedMentions(text) {
  const src = stripStudioPlaces(text);
  const mentions = [];
  const push = (re) => {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(src))) {
      mentions.push({ count: Number(match[1]), index: match.index, raw: match[0] });
    }
  };
  push(BED_RE);
  push(AR_BED_RE);
  mentions.sort((a, b) => a.index - b.index);
  return mentions;
}

export function primaryBedCount(text) {
  const mentions = extractBedMentions(text);
  if (mentions.length) return mentions[0].count;
  if (/\bstudio\b/i.test(stripStudioPlaces(text))) return 0;
  return null;
}

export function listingCopyErrors(listing) {
  const beds = Number(listing?.beds);
  if (!Number.isFinite(beds)) return [];
  const title = [listing.title, listing.title_ar].filter(Boolean).join("\n");
  const description = [listing.description, listing.description_ar].filter(Boolean).join("\n");
  const errors = [];
  const titleCount = primaryBedCount(title);
  const descCount = primaryBedCount(description);
  if (titleCount != null && titleCount !== beds) {
    errors.push({
      field: "title",
      found: titleCount,
      specs: beds,
      message: `Title says ${bedsLabel(titleCount)}, but the specifications say ${bedsLabel(beds)}.`,
    });
  }
  if (descCount != null && descCount !== beds) {
    errors.push({
      field: "description",
      found: descCount,
      specs: beds,
      message: `Description says ${bedsLabel(descCount)}, but the specifications say ${bedsLabel(beds)}.`,
    });
  }
  return errors;
}

export function listingPublishError(listing) {
  return listingCopyErrors(listing)[0]?.message || "";
}
