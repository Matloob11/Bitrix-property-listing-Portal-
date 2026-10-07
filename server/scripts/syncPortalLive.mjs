import { loadEnv } from "../loadEnv.js";
import { openDb } from "../db.js";
import { fetchAllListings } from "../pf.js";
import { listingIsLiveOnPortal } from "../listingModel.js";
import { applyStalePfLive, syncEmpgPublicLive, PORTAL_PUBLIC_URLS } from "../empgLiveSync.js";

loadEnv();
const db = await openDb();
const atlas = await fetchAllListings();
const livePfIds = new Set(
  atlas.filter((row) => row.portals?.propertyfinder?.isLive).map((row) => String(row.id))
);
const pfFlags = await applyStalePfLive(db, livePfIds, { by: "Property Finder live sweep" });
const empg = await syncEmpgPublicLive(db, { by: "Bayut/Dubizzle public live" });
const rows = await db.all();
const count = (portal) => rows.filter((row) => listingIsLiveOnPortal(row, portal)).length;
console.log(
  JSON.stringify(
    {
      atlas_is_live: livePfIds.size,
      pf_flags: pfFlags,
      empg,
      desk_actual_live: { pf: count("pf"), bayut: count("bayut"), dubizzle: count("dubizzle") },
      urls: PORTAL_PUBLIC_URLS,
    },
    null,
    2
  )
);
process.exit(0);
