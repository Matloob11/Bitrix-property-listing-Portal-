import { useEffect, useMemo, useRef, useState } from "react";
import { ListingStudio } from "./ListingStudio.jsx";
import "./studioIcons.js";

const TICKETS = [
  { id: "all", label: "All Listing", status: "all", scope: "" },
  { id: "mine", label: "My Listing", status: "all", scope: "mine" },
  { id: "draft", label: "My Draft", status: "draft", scope: "" },
  { id: "live", label: "My Live", status: "live", scope: "" },
  { id: "pending", label: "My Pending", status: "pending", scope: "" },
  { id: "archived", label: "My Archived", status: "archived", scope: "" },
  { id: "duplicate", label: "My Duplicate", status: "duplicate", scope: "" },
  { id: "pocket", label: "My Pocket Listing", status: "pocket", scope: "" },
];

const TYPES = ["apartment", "villa", "townhouse", "penthouse", "office", "warehouse", "shop"];
const CATEGORIES = ["residential", "commercial"];
const PORTALS = [
  { id: "pf", label: "PF", name: "Property Finder" },
  { id: "pf_api", label: "API", name: "PF API" },
  { id: "bayut", label: "BY", name: "Bayut" },
  { id: "dubizzle", label: "DZ", name: "Dubizzle" },
  { id: "website", label: "WEB", name: "Website" },
  { id: "rightmove", label: "RM", name: "Rightmove" },
];
function pretty(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const emptyFilters = {
  ticket: "all",
  listing_id: "",
  unit_no: "",
  permit_number: "",
  q: "",
  landlord_email: "",
  landlord_phone: "",
  minBeds: "",
  maxBeds: "",
  minPrice: "",
  maxPrice: "",
  city: "",
  community: "",
  building: "",
  category: "",
  type: "",
  purpose: "",
  listing_agent: "",
  listing_owner: "",
  landlord: "",
  developer: "",
  portal: "",
  sort: "updated_at",
  dir: "desc",
  page: 1,
  pageSize: 10,
};

const emptyForm = {
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
  title_deed: "",
  parking: "",
  furnished: "",
  portal_agent_different: "",
  notes: "",
  created_by: "",
  plot_size: "",
  lot_size: "",
  built_up_area: "",
  layout_type: "",
  project_name: "",
  ownership: "",
  build_year: "",
  listing_source: "",
  available_from: "",
  license_type: "rera",
  non_rera: "",
  permit_issue_date: "",
  permit_expiry_date: "",
  custom_portal_pricing: "",
  price_period: "yearly",
  price_yearly: "",
  price_monthly: "",
  price_weekly: "",
  price_daily: "",
  payment_method: "",
  cheques: "",
  service_charges: "",
  financial_status: "",
  title_ar: "",
  description: "",
  description_ar: "",
  amenities: [],
  portal_prices: {},
  gallery: [],
  videos: [],
  documents_list: [],
};

function money(n) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function when(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function relative(iso) {
  if (!iso) return "";
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} minutes ago`;
  if (sec < 86400) {
    const hours = Math.floor(sec / 3600);
    return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(sec / 86400);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function locationPath(row) {
  return [row.city, row.community, row.sub_community].filter(Boolean).join(" > ");
}

function shareLink(row, agent) {
  const url = new URL(
    `${window.location.origin}/p/${encodeURIComponent(row.reference)}`
  );
  if (agent?.name) url.searchParams.set("agent", agent.name);
  return url.toString();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

function startDownload(href) {
  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("download", "");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const MENU_ICONS = {
  view: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z",
  link: "M9 13.5a4.5 4.5 0 0 0 6.36 0l1.8-1.8a4.5 4.5 0 0 0-6.37-6.36L9.5 6.6M15 10.5a4.5 4.5 0 0 0-6.36 0l-1.8 1.8a4.5 4.5 0 0 0 6.37 6.36L14.5 17.4",
  pdf: "M7 3h8l5 5v13H7V3Zm8 0v5h5",
  image: "M4 6h16v12H4V6Zm2.8 8.2 3.2-3.6 2.6 2.8 2-1.8 3.2 2.6",
  brochure: "M5 4h10l4 4v12H5V4Zm10 0v4h4",
  copy: "M8 8h10v12H8V8Zm-3 3V5h10",
  live: "M5 12.5 9.2 17 19 7",
  archive: "M4 7h16l-1.4 13H5.4L4 7Zm4-3h8l1 3H7l1-3Z",
  pocket: "M6 8h12v10H6V8Zm3-3h6l1 3H8l1-3Z",
};

function MenuItem({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick}>
      <Icon d={MENU_ICONS[icon]} />
      {label}
    </button>
  );
}

function ticketCount(ticket, counts) {
  if (ticket.id === "all") return counts.all ?? 0;
  if (ticket.id === "mine") return counts.mine?.all ?? 0;
  return counts[ticket.status] ?? 0;
}

function queryString(filters, ticket) {
  const params = new URLSearchParams();
  if (ticket.status && ticket.status !== "all") params.set("status", ticket.status);
  if (ticket.scope) params.set("scope", ticket.scope);
  const keys = [
    "listing_id",
    "unit_no",
    "permit_number",
    "q",
    "landlord_email",
    "landlord_phone",
    "minBeds",
    "maxBeds",
    "minPrice",
    "maxPrice",
    "city",
    "community",
    "building",
    "category",
    "type",
    "purpose",
    "listing_agent",
    "listing_owner",
    "landlord",
    "developer",
    "portal",
    "sort",
    "dir",
    "page",
    "pageSize",
  ];
  for (const key of keys) {
    if (filters[key]) params.set(key, String(filters[key]));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function api(path, options) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return body;
}

function Icon({ d, className = "ico" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dash() {
  return <span className="muted">-</span>;
}

function Chevron({ open }) {
  return (
    <svg className={`chev${open ? " open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortMark() {
  return (
    <svg className="sort" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortTh({ label, field, sort, dir, onSort }) {
  return (
    <th>
      <button
        className={`sort-btn${sort === field ? " on" : ""}`}
        type="button"
        onClick={() => onSort(field)}
      >
        {label}
        <SortMark />
        {sort === field ? <small>{dir === "asc" ? "A" : "Z"}</small> : null}
      </button>
    </th>
  );
}

function PortalBadge({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#0bb783" />
      {children}
    </svg>
  );
}

function PortalMark({ id }) {
  if (id === "pf") {
    return (
      <PortalBadge>
        <circle cx="12" cy="12" r="5.2" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.1" fill="#fff" />
      </PortalBadge>
    );
  }
  if (id === "bayut") {
    return (
      <PortalBadge>
        <path
          d="M12 5.4c1.4 2.1 3.6 4 3.6 6.4a3.6 3.6 0 1 1-7.2 0c0-2.4 2.2-4.3 3.6-6.4Z"
          fill="#fff"
        />
      </PortalBadge>
    );
  }
  if (id === "dubizzle") {
    return (
      <PortalBadge>
        <path
          d="M8.6 7.2h4.4a3.4 3.4 0 0 1 0 6.8H8.6V7.2Zm1.7 1.6v3.6h2.7a1.8 1.8 0 1 0 0-3.6H10.3Z"
          fill="#fff"
          fillRule="evenodd"
        />
      </PortalBadge>
    );
  }
  if (id === "website") {
    return (
      <PortalBadge>
        <circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" strokeWidth="1.5" />
        <path d="M7.6 12h8.8" stroke="#fff" strokeWidth="1.3" />
        <path
          d="M12 7.4c1.3 1.5 1.9 3 1.9 4.6s-.6 3.1-1.9 4.6C10.7 15.1 10.1 13.6 10.1 12s.6-3.1 1.9-4.6Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.3"
        />
      </PortalBadge>
    );
  }
  if (id === "pf_api") {
    return (
      <PortalBadge>
        <rect x="8" y="8" width="8" height="8" rx="1.4" fill="none" stroke="#fff" strokeWidth="1.5" />
        <path d="M10.4 12h3.2M12 10.4v3.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </PortalBadge>
    );
  }
  return (
    <PortalBadge>
      <path d="M7.4 12h9.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M13.4 8.8 16.6 12l-3.2 3.2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </PortalBadge>
  );
}

function PortalDots({ portals }) {
  const items = PORTALS.filter((portal) => (portals || []).includes(portal.id));
  if (!items.length) return <Dash />;
  return (
    <div className="portals">
      {items.map((portal) => (
        <span className="portal-ico" key={portal.id} title={portal.name}>
          <PortalMark id={portal.id} />
        </span>
      ))}
    </div>
  );
}

const INFO_LEGEND = [
  { key: "sale", label: "Sale", color: "#f64e60" },
  { key: "rent", label: "Rent", color: "#3699ff" },
  { key: "pf", label: "Property Finder", color: "#b5b5c3" },
  { key: "bayut", label: "Bayut", color: "#8950fc" },
  { key: "website", label: "Website", color: "#1bc5bd" },
];

function infoValue(bucket, key) {
  if (key === "sale" || key === "rent") return Number(bucket?.[key] || 0);
  return Number(bucket?.portals?.[key] || 0);
}

function Donut({ segments }) {
  const size = 132;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  return (
    <svg className="donut" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#eef0f5"
        strokeWidth={stroke}
      />
      {total > 0 &&
        segments.map((item) => {
          if (!item.value) return null;
          const len = (item.value / total) * circ;
          const dash = -offset;
          offset += len;
          return (
            <circle
              key={item.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={dash}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
    </svg>
  );
}

function InfoColumn({ title, bucket }) {
  const rows = INFO_LEGEND.map((item) => ({
    ...item,
    value: infoValue(bucket, item.key),
  }));
  return (
    <article className="info-col">
      <h3>{title}</h3>
      <div className="info-split">
        <Donut
          segments={rows
            .filter((item) => item.key === "sale" || item.key === "rent")
            .map((item) => ({
              key: item.key,
              color: item.color,
              value: item.value,
            }))}
        />
        <ul className="info-legend">
          {rows.map((item) => (
            <li key={item.key}>
              <span className="legend-left">
                <i style={{ background: item.color }} />
                {item.label}
              </span>
              <b>{item.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

function PersonCell({ name }) {
  if (!name) return <Dash />;
  return (
    <div className="person">
      <span className="avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <span>{name}</span>
    </div>
  );
}

function expiryLabel(value) {
  if (!value) return "N/A";
  return when(value);
}

function pageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const marks = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    marks.add(2);
    marks.add(3);
    marks.add(4);
  }
  if (current >= total - 2) {
    marks.add(total - 3);
    marks.add(total - 2);
    marks.add(total - 1);
  }
  const nums = [...marks].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items = [];
  for (const num of nums) {
    if (items.length && num - items[items.length - 1] > 1) items.push("...");
    items.push(num);
  }
  return items;
}

function PagerArrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dir === "prev" ? (
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9.5 6.5 15 12l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function StatusCell({ status }) {
  if (status === "live") {
    return (
      <span className="status-live">
        <span className="tick">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
            <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        live
      </span>
    );
  }
  return <span className={`status-pill ${status}`}>{status}</span>;
}

export function App() {
  const [boot, setBoot] = useState("loading");
  const [user, setUser] = useState(null);
  const [gate, setGate] = useState("Opening Property Listing...");
  const [counts, setCounts] = useState({});
  const [info, setInfo] = useState(null);
  const [meta, setMeta] = useState({});
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [menuId, setMenuId] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [notice, setNotice] = useState("");
  const tableWrapRef = useRef(null);
  const [tablePin, setTablePin] = useState({
    show: false,
    left: false,
    right: false,
    top: 0,
    leftX: 0,
    rightX: 0,
  });

  function updateTableScroll() {
    const el = tableWrapRef.current;
    if (!el) {
      setTablePin({
        show: false,
        left: false,
        right: false,
        top: 0,
        leftX: 0,
        rightX: 0,
      });
      return;
    }
    const box = el.getBoundingClientRect();
    const viewTop = 16;
    const viewBottom = window.innerHeight - 16;
    const visibleTop = Math.max(box.top, viewTop);
    const visibleBottom = Math.min(box.bottom, viewBottom);
    const visibleH = visibleBottom - visibleTop;
    setTablePin({
      show: visibleH > 72,
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
      top: visibleTop + visibleH / 2,
      leftX: Math.max(8, box.left + 10),
      rightX: Math.max(8, window.innerWidth - box.right + 10),
    });
  }

  function scrollTable(dir) {
    const el = tableWrapRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, Math.round(el.clientWidth * 0.65)), behavior: "smooth" });
  }

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  async function copyListingLink(row, asAgent) {
    const ok = await copyText(shareLink(row, asAgent ? user : null));
    flash(ok ? "Link copied" : "Could not copy link");
  }

  useEffect(() => {
    if (!menuId) return undefined;
    const close = () => setMenuId("");
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuId]);

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return undefined;
    const onMove = () => updateTableScroll();
    updateTableScroll();
    el.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      el.removeEventListener("scroll", onMove);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [listings, total, filters.pageSize, editor, viewer]);

  async function refresh(next = filters) {
    const nextTicket = TICKETS.find((item) => item.id === next.ticket) || TICKETS[0];
    const qs = queryString(next, nextTicket);
    setBusy(true);
    try {
      const [summary, list, metaBody] = await Promise.all([
        api("/api/listings/summary"),
        api(`/api/listings${qs}`),
        api("/api/listings/meta"),
      ]);
      setCounts(summary.counts || {});
      setInfo(summary.infographics || null);
      setListings(list.listings || []);
      setTotal(list.total || 0);
      setMeta(metaBody.meta || {});
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function signInFromBitrix() {
      if (!window.BX24) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://api.bitrix24.com/api/v1/";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        }).catch(() => {});
      }
      if (!window.BX24) {
        throw new Error("Open this page from the Bitrix24 menu.");
      }
      await new Promise((resolve, reject) => {
        window.BX24.init(() => {
          const auth = window.BX24.getAuth();
          if (!auth) {
            reject(new Error("The portal did not provide a token."));
            return;
          }
          api("/api/auth/bitrix", {
            method: "POST",
            body: JSON.stringify({
              AUTH_ID: auth.access_token || auth.AUTH_ID,
              DOMAIN: auth.domain || auth.DOMAIN,
            }),
          })
            .then((body) => {
              setUser(body.user);
              resolve();
            })
            .catch(reject);
        });
      });
    }

    (async () => {
      try {
        const me = await api("/api/auth/me");
        if (cancelled) return;
        setUser(me.user);
        await refresh();
        setBoot("ready");
      } catch (first) {
        try {
          setGate("Signing in through Bitrix...");
          await signInFromBitrix();
          if (cancelled) return;
          await refresh();
          setBoot("ready");
        } catch {
          if (cancelled) return;
          setGate(
            first.status === 403
              ? "Open this page from Bitrix24. The public URL stays locked."
              : first.message
          );
          setBoot("gate");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pageSize = Number(filters.pageSize || 10);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (Number(filters.page || 1) - 1) * pageSize + 1;
  const to = Math.min(total, Number(filters.page || 1) * pageSize);

  const optionLists = useMemo(
    () => ({
      cities: [...new Set([...(meta.locations?.cities || []), ...(meta.cities || [])])],
      communities: [
        ...new Set([
          ...Object.values(meta.locations?.communities || {}).flat(),
          ...(meta.communities || []),
        ]),
      ],
      buildings: meta.buildings || [],
      agents: meta.agents || [],
      owners: meta.owners || [],
      landlords: meta.landlords || [],
      developers: meta.developers || [],
    }),
    [meta]
  );

  async function applyTicket(id) {
    const next = { ...filters, ticket: id, page: 1 };
    setFilters(next);
    setError("");
    try {
      await refresh(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyFilters() {
    const next = { ...draft, ticket: filters.ticket, page: 1 };
    setFilters(next);
    setError("");
    try {
      await refresh(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetFilters() {
    const next = { ...emptyFilters, ticket: filters.ticket };
    setDraft(next);
    setFilters(next);
    setError("");
    try {
      await refresh(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function changePage(page) {
    const next = { ...filters, page };
    setFilters(next);
    try {
      await refresh(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function applySort(field) {
    const dir = filters.sort === field && filters.dir === "desc" ? "asc" : "desc";
    const next = { ...filters, sort: field, dir, page: 1 };
    setFilters(next);
    try {
      await refresh(next);
    } catch (err) {
      setError(err.message);
    }
  }

  async function runBulk(status) {
    if (!picked.length) return;
    setBusy(true);
    try {
      await api("/api/listings/bulk-status", {
        method: "POST",
        body: JSON.stringify({ ids: picked, status }),
      });
      setPicked([]);
      flash(`${pretty(status)} updated`);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function transferPicked() {
    if (!picked.length) return;
    const listing_agent = window.prompt("Transfer to listing agent", user?.name || "");
    if (!listing_agent) return;
    setBusy(true);
    try {
      await api("/api/listings/transfer", {
        method: "POST",
        body: JSON.stringify({ ids: picked, listing_agent }),
      });
      setPicked([]);
      flash("Listings transferred");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setRowStatus(row, status) {
    setMenuId("");
    setBusy(true);
    try {
      await api(`/api/listings/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      flash(`Marked ${status}`);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function duplicateRow(row) {
    setMenuId("");
    setBusy(true);
    try {
      const body = await api(`/api/listings/${row.id}/duplicate`, { method: "POST" });
      flash("Duplicate created");
      await refresh();
      if (body.listing) setEditor(body.listing);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (boot === "loading" || boot === "gate") {
    return (
      <div className="gate">
        <div className="gate-card">
          <h1>Property Listing</h1>
          <p>{boot === "loading" ? "Opening Property Listing..." : gate}</p>
        </div>
      </div>
    );
  }

  if (editor) {
    return (
      <ListingStudio
        listing={editor}
        user={user}
        counts={counts}
        agents={optionLists.agents}
        owners={optionLists.owners}
        landlords={optionLists.landlords}
        developers={optionLists.developers}
        onChange={setEditor}
        onClose={() => setEditor(null)}
        onSaved={async () => {
          setEditor(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div className="shell">
      {notice && <div className="toast">{notice}</div>}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 16" fill="none">
              <path d="M3 13.5 20 3l17 10.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <b>A7</b>
          </span>
          <div className="brand-copy">
            <h1>
              <span>Property</span>
              <strong>Listing</strong>
            </h1>
            <em className="brand-kicker">A7 GROUP</em>
          </div>
        </div>
        <div className="top-metrics">
          <span className="metric-chip tone-availability">
            <span className="metric-chip-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.75a6.5 6.5 0 0 0-6.5 6.5c0 4.6 5.2 10.4 6.05 11.32a.6.6 0 0 0 .9 0C13.3 19.65 18.5 13.85 18.5 9.25A6.5 6.5 0 0 0 12 2.75Z"
                  fill="currentColor"
                  opacity="0.16"
                />
                <path
                  d="M12 2.75a6.5 6.5 0 0 0-6.5 6.5c0 4.6 5.2 10.4 6.05 11.32a.6.6 0 0 0 .9 0C13.3 19.65 18.5 13.85 18.5 9.25A6.5 6.5 0 0 0 12 2.75Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m9.6 9.4 1.7 1.7 3.2-3.3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="metric-chip-text">
              <span className="metric-chip-label">Availability</span>
              <b className="metric-chip-value">{counts.availability ?? 0}</b>
            </span>
          </span>
          <span className="metric-chip tone-listings">
            <span className="metric-chip-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="3.25"
                  y="4.75"
                  width="17.5"
                  height="14.5"
                  rx="2.4"
                  fill="currentColor"
                  opacity="0.16"
                />
                <rect
                  x="3.25"
                  y="4.75"
                  width="17.5"
                  height="14.5"
                  rx="2.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M7 9h10M7 12h10M7 15h6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="metric-chip-text">
              <span className="metric-chip-label">Listings</span>
              <b className="metric-chip-value">{counts.all ?? 0}</b>
            </span>
          </span>
        </div>
      </header>

      <section className={`panel panel-info${showInfo ? " open" : ""}`}>
        <button
          className="panel-head"
          type="button"
          onClick={() => setShowInfo((v) => !v)}
        >
          <span className="panel-title">
            <span className="panel-ico tone-blue" aria-hidden="true">
              <svg className="ico" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="12.5" width="4" height="6.5" rx="1.3" fill="currentColor" />
                <rect x="10" y="8" width="4" height="11" rx="1.3" fill="currentColor" />
                <rect x="16.5" y="4.5" width="4" height="14.5" rx="1.3" fill="currentColor" />
              </svg>
            </span>
            Listing Infographics
          </span>
          <Chevron open={showInfo} />
        </button>
        {showInfo && info && (
          <div className="panel-body">
            <div className="info-board">
              <InfoColumn
                title="Commercial"
                bucket={info.byCategory?.commercial}
              />
              <InfoColumn
                title="Residential"
                bucket={info.byCategory?.residential}
              />
            </div>
          </div>
        )}
      </section>

      <section className={`panel panel-filters${showFilters ? " open" : ""}`}>
        <button
          className="panel-head"
          type="button"
          onClick={() => setShowFilters((v) => !v)}
        >
          <span className="panel-title">
            <span className="panel-ico tone-teal" aria-hidden="true">
              <svg className="ico" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.3 5.6C4 5.2 4.28 4.6 4.8 4.6h14.4c.52 0 .8.6.5 1.02l-5.4 6.94a1 1 0 0 0-.2.6v4.06c0 .35-.22.66-.55.77l-2.4.82c-.53.18-1.05-.22-1.05-.77v-5.7a1 1 0 0 0-.2-.6L4.3 5.6Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Filters
          </span>
          <Chevron open={showFilters} />
        </button>
        {showFilters && (
          <div className="panel-body">
            <div className="filter-board">
              <div className="filter-group">
                <h4>Listing</h4>
                <div className="filter-grid">
                  <label>
                    Listing ID
                    <input
                      value={draft.listing_id}
                      onChange={(e) =>
                        setDraft({ ...draft, listing_id: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Unit no
                    <input
                      value={draft.unit_no}
                      onChange={(e) => setDraft({ ...draft, unit_no: e.target.value })}
                    />
                  </label>
                  <label>
                    Permit no
                    <input
                      value={draft.permit_number}
                      onChange={(e) =>
                        setDraft({ ...draft, permit_number: e.target.value })
                      }
                    />
                  </label>
                  <label className="wide">
                    Title / community / reference
                    <input
                      value={draft.q}
                      onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyFilters();
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="filter-group">
                <h4>Location & specs</h4>
                <div className="filter-grid">
                  <label>
                    City
                    <select
                      value={draft.city}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    >
                      <option value="">Any</option>
                      {optionLists.cities.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Community
                    <select
                      value={draft.community}
                      onChange={(e) =>
                        setDraft({ ...draft, community: e.target.value })
                      }
                    >
                      <option value="">Any</option>
                      {optionLists.communities.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Building
                    <select
                      value={draft.building}
                      onChange={(e) => setDraft({ ...draft, building: e.target.value })}
                    >
                      <option value="">Any</option>
                      {optionLists.buildings.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    >
                      <option value="">Any</option>
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {pretty(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Property type
                    <select
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                    >
                      <option value="">Any</option>
                      {TYPES.map((item) => (
                        <option key={item} value={item}>
                          {pretty(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Purpose
                    <select
                      value={draft.purpose}
                      onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                    >
                      <option value="">Any</option>
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                    </select>
                  </label>
                  <label>
                    Beds min
                    <input
                      type="number"
                      value={draft.minBeds}
                      onChange={(e) => setDraft({ ...draft, minBeds: e.target.value })}
                    />
                  </label>
                  <label>
                    Beds max
                    <input
                      type="number"
                      value={draft.maxBeds}
                      onChange={(e) => setDraft({ ...draft, maxBeds: e.target.value })}
                    />
                  </label>
                  <label>
                    Price min
                    <input
                      type="number"
                      value={draft.minPrice}
                      onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                    />
                  </label>
                  <label>
                    Price max
                    <input
                      type="number"
                      value={draft.maxPrice}
                      onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                    />
                  </label>
                </div>
              </div>
              <div className="filter-group">
                <h4>People & portals</h4>
                <div className="filter-grid">
                  <label>
                    Listing agent
                    <select
                      value={draft.listing_agent}
                      onChange={(e) =>
                        setDraft({ ...draft, listing_agent: e.target.value })
                      }
                    >
                      <option value="">Any</option>
                      {optionLists.agents.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Listing owner
                    <select
                      value={draft.listing_owner}
                      onChange={(e) =>
                        setDraft({ ...draft, listing_owner: e.target.value })
                      }
                    >
                      <option value="">Any</option>
                      {optionLists.owners.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Landlord
                    <select
                      value={draft.landlord}
                      onChange={(e) => setDraft({ ...draft, landlord: e.target.value })}
                    >
                      <option value="">Any</option>
                      {optionLists.landlords.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Developer
                    <input
                      value={draft.developer}
                      onChange={(e) =>
                        setDraft({ ...draft, developer: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Landlord email
                    <input
                      value={draft.landlord_email}
                      onChange={(e) =>
                        setDraft({ ...draft, landlord_email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Landlord phone
                    <input
                      value={draft.landlord_phone}
                      onChange={(e) =>
                        setDraft({ ...draft, landlord_phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Portal
                    <select
                      value={draft.portal}
                      onChange={(e) => setDraft({ ...draft, portal: e.target.value })}
                    >
                      <option value="">Any</option>
                      {PORTALS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="filter-actions">
                <button className="btn" type="button" onClick={resetFilters}>
                  Reset
                </button>
                <button className="btn primary" type="button" onClick={applyFilters}>
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="tickets-bar">
        <div className="tickets">
          {TICKETS.map((item) => (
            <button
              key={item.id}
              className={`ticket ${item.id}${filters.ticket === item.id ? " active" : ""}`}
              type="button"
              onClick={() => applyTicket(item.id)}
            >
              <span className="count">{ticketCount(item, counts)}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="err">{error}</p>}

      {picked.length > 0 && (
        <div className="bulk-bar">
          <b>{picked.length} selected</b>
          <button className="btn" type="button" onClick={() => runBulk("live")}>
            Mark live
          </button>
          <button className="btn" type="button" onClick={() => runBulk("pending")}>
            Pending
          </button>
          <button className="btn" type="button" onClick={() => runBulk("archived")}>
            Archive
          </button>
          <button className="btn" type="button" onClick={() => runBulk("pocket")}>
            Pocket
          </button>
          <button className="btn" type="button" onClick={() => runBulk("draft")}>
            Draft
          </button>
          <button className="btn" type="button" onClick={transferPicked}>
            Transfer agent
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => startDownload(`/api/listings.csv${queryString(filters, TICKETS.find((item) => item.id === filters.ticket) || TICKETS[0])}`)}
          >
            Download CSV
          </button>
          <button className="btn ghost" type="button" onClick={() => setPicked([])}>
            Clear
          </button>
        </div>
      )}

      <div className={`table-shell${busy ? " is-busy" : ""}`}>
        <div className="table-scroll-box">
        <div className="table-wrap" ref={tableWrapRef}>
        <table className="stock">
          <thead>
            <tr>
              <th>
                <input
                  className="check"
                  type="checkbox"
                  aria-label="Select all listings"
                  checked={listings.length > 0 && picked.length === listings.length}
                  onChange={(e) =>
                    setPicked(e.target.checked ? listings.map((row) => row.id) : [])
                  }
                />
              </th>
              <th>Actions</th>
              <th>Portals</th>
              <SortTh label="Reference" field="reference" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Title" field="title" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Layout" field="area_sqft" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Type" field="type" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Price" field="price_aed" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Created" field="created_at" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Updated" field="updated_at" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Status" field="status" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Community" field="community" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Listing Agent" field="listing_agent" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Listing Owner" field="listing_owner" sort={filters.sort} dir={filters.dir} onSort={applySort} />
              <SortTh label="Expiry Date For Portals" field="portal_expiry" sort={filters.sort} dir={filters.dir} onSort={applySort} />
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 && (
              <tr>
                <td colSpan={15} className="empty">
                  {filters.ticket === "all"
                    ? "No listings in this view."
                    : `No ${(TICKETS.find((item) => item.id === filters.ticket) || {}).label || "matching"} records.`}
                </td>
              </tr>
            )}
            {listings.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    className="check"
                    type="checkbox"
                    aria-label={`Select ${row.reference}`}
                    checked={picked.includes(row.id)}
                    onChange={(e) =>
                      setPicked((current) =>
                        e.target.checked
                          ? [...current, row.id]
                          : current.filter((id) => id !== row.id)
                      )
                    }
                  />
                </td>
                <td className="actions">
                  <button
                    className={`kebab${menuId === row.id ? " on" : ""}`}
                    type="button"
                    aria-label={`Actions for ${row.reference}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuId(menuId === row.id ? "" : row.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="5" r="2.1" />
                      <circle cx="12" cy="12" r="2.1" />
                      <circle cx="12" cy="19" r="2.1" />
                    </svg>
                  </button>
                  {menuId === row.id && (
                    <div className="menu" onClick={(event) => event.stopPropagation()}>
                      <MenuItem
                        icon="view"
                        label="View Details"
                        onClick={() => {
                          setViewer(row);
                          setMenuId("");
                        }}
                      />
                      <MenuItem
                        icon="link"
                        label="Copy Link"
                        onClick={() => {
                          setMenuId("");
                          copyListingLink(row, false);
                        }}
                      />
                      <MenuItem
                        icon="pdf"
                        label="Download PDF"
                        onClick={() => {
                          setMenuId("");
                          startDownload(`/api/listings/${row.id}/pdf`);
                        }}
                      />
                      <MenuItem
                        icon="image"
                        label="Download DLD Image"
                        onClick={() => {
                          setMenuId("");
                          startDownload(`/api/listings/${row.id}/dld`);
                        }}
                      />
                      <MenuItem
                        icon="link"
                        label="Copy Link as Logged in Agent"
                        onClick={() => {
                          setMenuId("");
                          copyListingLink(row, true);
                        }}
                      />
                      <MenuItem
                        icon="pdf"
                        label="Download PDF as Logged in Agent"
                        onClick={() => {
                          setMenuId("");
                          startDownload(`/api/listings/${row.id}/pdf?as=agent`);
                        }}
                      />
                      <MenuItem
                        icon="brochure"
                        label="Download Brochure"
                        onClick={() => {
                          setMenuId("");
                          startDownload(`/api/listings/${row.id}/brochure`);
                        }}
                      />
                      <MenuItem
                        icon="copy"
                        label="Duplicate listing"
                        onClick={() => duplicateRow(row)}
                      />
                      <MenuItem
                        icon="live"
                        label="Mark Live"
                        onClick={() => setRowStatus(row, "live")}
                      />
                      <MenuItem
                        icon="pdf"
                        label="Mark Pending"
                        onClick={() => setRowStatus(row, "pending")}
                      />
                      <MenuItem
                        icon="archive"
                        label="Archive"
                        onClick={() => setRowStatus(row, "archived")}
                      />
                      <MenuItem
                        icon="pocket"
                        label="Move to Pocket"
                        onClick={() => setRowStatus(row, "pocket")}
                      />
                    </div>
                  )}
                </td>
                <td>
                  <PortalDots portals={row.portals} />
                </td>
                <td className="ref">{row.reference}</td>
                <td>
                  <div className="title-cell">
                    {row.photo ? (
                      <img className="thumb" src={row.photo} alt="" />
                    ) : (
                      <div className="thumb" />
                    )}
                    <div>
                      <button
                        className="title-link"
                        type="button"
                        onClick={() => {
                          setEditor({ ...row });
                        }}
                      >
                        {row.title}
                      </button>
                      <div className="title-sub">{locationPath(row)}</div>
                    </div>
                  </div>
                </td>
                <td className="layout">
                  <div className="layout-line">
                    <b>{Number(row.area_sqft).toLocaleString()}</b> sq ft
                    <Icon d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
                  </div>
                  <div className="layout-line">
                    <Icon d="M4 19V10l8-5 8 5v9H4Z" />
                    <span>{row.beds}</span>
                    <Icon d="M4 12h16v7H4v-7Zm2-5h4v5H6V7Zm8 2h4v3h-4V9Z" />
                    <span>{row.baths}</span>
                  </div>
                </td>
                <td className="type-cell">
                  {pretty(row.type)}
                  <small>{pretty(row.category)}</small>
                </td>
                <td className="price">{money(row.price_aed)}</td>
                <td className="when">
                  {when(row.created_at)}
                  <small>{relative(row.created_at)}</small>
                </td>
                <td className="when">
                  {when(row.updated_at)}
                  <small>{relative(row.updated_at)}</small>
                </td>
                <td>
                  <StatusCell status={row.status} />
                </td>
                <td>{row.community}</td>
                <td>
                  <PersonCell name={row.listing_agent} />
                </td>
                <td>
                  <PersonCell name={row.listing_owner} />
                </td>
                <td className="expiry">{expiryLabel(row.portal_expiry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {tablePin.show && tablePin.left ? (
          <button
            className="table-scroll prev"
            type="button"
            aria-label="Scroll table left"
            style={{ top: tablePin.top, left: tablePin.leftX }}
            onClick={() => scrollTable(-1)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14.5 6 8.5 12l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        {tablePin.show && tablePin.right ? (
          <button
            className="table-scroll next"
            type="button"
            aria-label="Scroll table right"
            style={{ top: tablePin.top, right: tablePin.rightX }}
            onClick={() => scrollTable(1)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m9.5 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        </div>
        <div className="pager">
          <div className="pager-meta">
            Showing <b>{from}</b> to <b>{to}</b> of <b>{total}</b>
          </div>
          <div className="pager-controls">
            <label className="pager-size">
              Rows
              <select
                aria-label="Rows per page"
                value={filters.pageSize}
                onChange={(e) => {
                  const next = { ...filters, pageSize: Number(e.target.value), page: 1 };
                  setFilters(next);
                  refresh(next);
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="pager-pages">
              <button
                className="pager-btn"
                type="button"
                aria-label="Previous page"
                disabled={filters.page <= 1}
                onClick={() => changePage(filters.page - 1)}
              >
                <PagerArrow dir="prev" />
              </button>
              {pageList(filters.page, pages).map((item, index) =>
                item === "..." ? (
                  <span className="pager-gap" key={`gap-${index}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    className={`pager-btn${filters.page === item ? " on" : ""}`}
                    type="button"
                    aria-current={filters.page === item ? "page" : undefined}
                    onClick={() => changePage(item)}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                className="pager-btn"
                type="button"
                aria-label="Next page"
                disabled={filters.page >= pages}
                onClick={() => changePage(filters.page + 1)}
              >
                <PagerArrow dir="next" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        className="fab"
        type="button"
        onClick={() => {
          setEditor({
            ...emptyForm,
            type: "",
            purpose: "",
            category: "",
            listing_agent: "",
            listing_owner: "",
            created_by: "",
            area_sqft: "",
            beds: "",
            baths: "",
            reference: `a7group-${String(Date.now()).slice(-4)}`,
          });
        }}
      >
        <i>+</i>
        Create listing
      </button>

      {viewer && (
        <div
          className="overlay"
          role="dialog"
          aria-label="Listing details"
          onClick={() => setViewer(null)}
        >
          <div className="viewer" onClick={(event) => event.stopPropagation()}>
            <div className="viewer-top">
              <div>
                <small>{viewer.reference}</small>
                <h2>{viewer.title}</h2>
                <p>{locationPath(viewer)}</p>
              </div>
              <button className="btn ghost" type="button" onClick={() => setViewer(null)}>
                Close
              </button>
            </div>
            {viewer.photo ? <img className="viewer-photo" src={viewer.photo} alt="" /> : null}
            {(viewer.gallery || []).filter((item) => item.url && item.url !== viewer.photo).length ? (
              <div className="viewer-thumbs">
                {(viewer.gallery || [])
                  .filter((item) => item.url && item.url !== viewer.photo)
                  .slice(0, 8)
                  .map((item) => (
                    <img key={item.url} src={item.url} alt="" />
                  ))}
              </div>
            ) : null}
            <div className="viewer-grid">
              <div><span>Purpose</span><b>{pretty(viewer.purpose)}</b></div>
              <div><span>Type</span><b>{pretty(viewer.type)} / {pretty(viewer.category)}</b></div>
              <div><span>Layout</span><b>{viewer.beds} bed / {viewer.baths} bath / {Number(viewer.area_sqft).toLocaleString()} sqft</b></div>
              <div><span>Price</span><b>{money(viewer.price_aed)}</b></div>
              <div><span>Status</span><b>{pretty(viewer.status)}</b></div>
              <div><span>Community</span><b>{viewer.community || "-"}</b></div>
              <div><span>Building</span><b>{viewer.building || "-"}</b></div>
              <div><span>Agent</span><b>{viewer.listing_agent || "-"}</b></div>
              <div><span>Owner</span><b>{viewer.listing_owner || "-"}</b></div>
              <div><span>Permit</span><b>{viewer.permit_number || "-"}</b></div>
              <div><span>Unit</span><b>{viewer.unit_no || "-"}</b></div>
              <div><span>Portals</span><b>{(viewer.portals || []).join(", ") || "None"}</b></div>
              <div><span>Created</span><b>{when(viewer.created_at)}</b></div>
              <div><span>Portal expiry</span><b>{viewer.portal_expiry || "N/A"}</b></div>
            </div>
            {viewer.description ? <p className="viewer-copy">{viewer.description}</p> : null}
            {(viewer.amenities || []).length ? (
              <div className="viewer-tags">
                {viewer.amenities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
            <div className="wizard-actions">
              <button
                className="btn"
                type="button"
                onClick={() => startDownload(`/api/listings/${viewer.id}/pdf`)}
              >
                Download PDF
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => startDownload(`/api/listings/${viewer.id}/brochure`)}
              >
                Brochure
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setEditor({ ...viewer });
                  setViewer(null);
                }}
              >
                Edit listing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
