import { useEffect, useMemo, useState } from "react";
import { STUDIO_ICONS } from "./studioIcons.js";

const STUDIO_STEPS = [
  { id: "details", label: "Details" },
  { id: "media", label: "Media" },
  { id: "location", label: "Location" },
  { id: "publishing", label: "Publish" },
  { id: "notes", label: "Notes" },
  { id: "documents", label: "Docs" },
  { id: "completed", label: "Finish" },
];

const RES_TYPES = ["apartment", "villa", "townhouse", "penthouse"];
const COM_TYPES = ["office", "warehouse", "shop"];
const FURNISHED = [
  { value: "", label: "Please select" },
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];
const PROJECT_STATUSES = [
  { value: "ready_secondary", label: "Ready Secondary" },
  { value: "offplan_secondary", label: "Off-plan Secondary" },
  { value: "ready_primary", label: "Ready Primary" },
  { value: "offplan_primary", label: "Off-plan Primary" },
];
const LAYOUTS = ["", "Standard", "Duplex", "Triplex", "Loft", "Penthouse Layout"];
const OWNERSHIP = ["", "Freehold", "Leasehold"];
const SOURCES = ["", "Company", "Agent", "Owner", "Referral"];
const PAYMENTS = ["", "Cheque", "Cash", "Bank Transfer", "Installments"];
const FINANCIAL = ["", "None", "Mortgage", "Cash Buyer"];
const PERIODS = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
  { id: "weekly", label: "Weekly" },
  { id: "daily", label: "Daily" },
];
const PORTALS = [
  { id: "pf", name: "Property Finder", note: "Ready on this desk. Live PF publish stays on the old portal engine." },
  { id: "pf_api", name: "PF API", note: "Flag the listing for PF API sync." },
  { id: "bayut", name: "Bayut", note: "Ready on this desk. Live Bayut publish stays on the old portal engine." },
  { id: "dubizzle", name: "Dubizzle", note: "Ready on this desk. Live Dubizzle publish stays on the old portal engine." },
  { id: "website", name: "Website", note: "Shows on the public /p/{reference} page." },
  { id: "rightmove", name: "Rightmove", note: "Flag the listing for Rightmove." },
];

const DOC_SLOTS = [
  { id: "title_deed", label: "Title Deed" },
  { id: "noc", label: "NOC" },
  { id: "form_a", label: "Form A" },
  { id: "passport", label: "Passport / Emirates ID" },
  { id: "ejari", label: "Ejari / Tenancy" },
  { id: "other", label: "Other document" },
];
const AMENITIES = [
  "Central A/C",
  "Built-in Wardrobes",
  "Kitchen Appliances",
  "Maid's Room",
  "Study",
  "Balcony",
  "Private Garden",
  "Private Pool",
  "Shared Pool",
  "Shared Gym",
  "Covered Parking",
  "Concierge",
  "Security",
  "Pets Allowed",
  "Children's Play Area",
  "Barbecue Area",
  "Jacuzzi",
  "Sauna",
  "Walk-in Closet",
  "View of Water",
  "View of Landmark",
  "Smart Home",
  "Storage Room",
  "Lobby in Building",
  "Maintenance",
  "Intercom",
  "Double Glazed Windows",
  "Broadband Internet",
];

function pretty(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function amenityList(value) {
  return Array.isArray(value) ? value : [];
}

function fileList(value) {
  return Array.isArray(value) ? value.filter((item) => item && item.url) : [];
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function watermarkDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const bar = Math.max(40, Math.round(canvas.height * 0.08));
      ctx.fillStyle = "rgba(24, 28, 50, 0.48)";
      ctx.fillRect(0, canvas.height - bar, canvas.width, bar);
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${Math.max(16, Math.round(canvas.width / 28))}px sans-serif`;
      ctx.fillText("A7 GROUP", 24, canvas.height - Math.round(bar * 0.35));
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function api(path, options) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

function Svg({ children, className = "studio-svg" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function Field({ label, required, boxed, tip, children }) {
  return (
    <label className={`studio-field${boxed ? " boxed" : ""}`}>
      <span>
        {label}
        {required ? <em>*</em> : null}
        {tip ? (
          <i className="studio-info" title={tip}>
            i
          </i>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function Choice({ active, label, image, onClick }) {
  return (
    <button
      className={`studio-choice${active ? " on" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className="studio-choice-label">{label}</span>
      <span className="studio-glyph">
        <img src={image} alt="" width="64" height="64" decoding="async" />
      </span>
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <h2>
      {children}
      <span className="studio-info" title={children}>
        i
      </span>
    </h2>
  );
}

function StepHero({ tone, kicker, title, children }) {
  return (
    <div className={`step-hero tone-${tone}`}>
      <span>{kicker}</span>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

function Switch({ on, onClick, label }) {
  return (
    <label className="studio-toggle">
      <span>{label}</span>
      <button
        className={`studio-switch${on ? " on" : ""}`}
        type="button"
        role="switch"
        aria-checked={Boolean(on)}
        onClick={onClick}
      />
    </label>
  );
}

export function ListingStudio({
  listing,
  user,
  counts,
  agents,
  owners,
  landlords,
  developers,
  onChange,
  onClose,
  onSaved,
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [descLang, setDescLang] = useState("en");
  const [amenityOpen, setAmenityOpen] = useState(false);
  const [dldNote, setDldNote] = useState("");
  const [catalog, setCatalog] = useState({
    cities: [],
    communities: {},
    sub_communities: {},
  });
  const [watermark, setWatermark] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const draft = listing || {};
  const types = draft.category === "commercial" ? COM_TYPES : RES_TYPES;
  const selectedAmenities = amenityList(draft.amenities);
  const gallery = fileList(draft.gallery);
  const videos = fileList(draft.videos);
  const documents = fileList(draft.documents_list);
  const portalPrices = draft.portal_prices && typeof draft.portal_prices === "object"
    ? draft.portal_prices
    : {};
  const people = useMemo(
    () => [...new Set([user?.name, ...(agents || []), ...(owners || [])].filter(Boolean))],
    [user, agents, owners]
  );
  const landlordNames = useMemo(
    () => [...new Set([...(landlords || []), draft.landlord_name].filter(Boolean))],
    [landlords, draft.landlord_name]
  );
  const developerNames = useMemo(
    () => [...new Set([...(developers || []), draft.developer].filter(Boolean))],
    [developers, draft.developer]
  );

  useEffect(() => {
    api("/api/locations")
      .then((body) => {
        if (body.locations) setCatalog(body.locations);
      })
      .catch(() => {});
  }, []);

  const cityOptions = catalog.cities || [];
  const communityOptions = catalog.communities?.[draft.city] || [];
  const subOptions = catalog.sub_communities?.[draft.city]?.[draft.community] || [];

  function patch(next) {
    onChange({ ...draft, ...next });
  }

  function selectedPrice() {
    const period = draft.price_period || "yearly";
    const map = {
      yearly: draft.price_yearly,
      monthly: draft.price_monthly,
      weekly: draft.price_weekly,
      daily: draft.price_daily,
    };
    return Number(map[period] || draft.price_aed || 0);
  }

  function validate(index) {
    if (index === 0) {
      if (!draft.category) return "Choose Residential or Commercial.";
      if (!draft.purpose) return "Choose Rent or Sale.";
      if (!draft.type) return "Property type is required.";
      if (!Number(draft.area_sqft)) return "Size (sq.ft) is required.";
      if (!String(draft.unit_no || "").trim()) return "Unit No is required.";
      if (!String(draft.project_status || "").trim()) return "Project status is required.";
      if (!String(draft.listing_agent || "").trim()) {
        return "Listing Agent (RERA Agent) is required.";
      }
      if (!String(draft.permit_number || "").trim()) {
        return "Listing Permit Number is required.";
      }
      if (!String(draft.title || "").trim()) return "Title is required.";
      if (!String(draft.description || "").trim()) return "Description is required.";
    }
    if (index === 1) {
      const photos = fileList(draft.gallery).filter((item) => item.kind !== "floorplan");
      if (!draft.photo && !photos.length) return "Add at least one photo.";
    }
    if (index === 2 && !String(draft.community || "").trim()) {
      return "Community is required.";
    }
    if (index === STUDIO_STEPS.length - 1) {
      return validate(0) || validate(1) || validate(2);
    }
    return "";
  }

  async function persist(nextStatus) {
    const payload = {
      ...draft,
      status: nextStatus || draft.status || "draft",
      listing_owner: draft.portal_agent_different
        ? draft.listing_owner
        : draft.listing_agent,
      created_by: draft.created_by || user?.name || "",
      price_aed: selectedPrice(),
      portal_expiry: draft.permit_expiry_date || draft.portal_expiry || "",
      amenities: selectedAmenities,
      portal_prices: portalPrices,
      gallery,
      videos,
      documents_list: documents,
      photo: draft.photo || gallery.find((item) => item.kind !== "floorplan")?.url || "",
    };
    if (draft.id) {
      const body = await api(`/api/listings/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onChange(body.listing);
      return body.listing;
    }
    const body = await api("/api/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    onChange(body.listing);
    return body.listing;
  }

  async function saveAndContinue() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const last = step === STUDIO_STEPS.length - 1;
      await persist(last ? "pending" : "draft");
      if (last) {
        await onSaved();
        return;
      }
      setStep(step + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(draft.reference || "");
    } catch {
      /* ignore */
    }
  }

  async function uploadBlob(file, kind) {
    let data = await readFile(file);
    if (watermark && String(file.type || "").startsWith("image/")) {
      data = await watermarkDataUrl(data);
    }
    const body = await api("/api/uploads", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        mime: file.type || (kind === "document" ? "application/pdf" : "image/jpeg"),
        data,
      }),
    });
    return { url: body.url, name: body.name || file.name, kind: kind || "photo" };
  }

  async function addPhotos(files, kind) {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of list) {
        uploaded.push(await uploadBlob(file, kind || "photo"));
      }
      const next = [...gallery, ...uploaded];
      patch({
        gallery: next,
        photo: draft.photo || uploaded.find((item) => item.kind !== "floorplan")?.url || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addDocument(slot, files) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadBlob(file, slot);
      const next = documents.filter((item) => item.kind !== slot);
      next.push(uploaded);
      const extra = {};
      if (slot === "title_deed") extra.title_deed = uploaded.url;
      patch({ documents_list: next, ...extra });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function addPhotoUrl() {
    const url = photoUrl.trim();
    if (!url) return;
    const item = { url, name: url, kind: "photo" };
    patch({
      gallery: [...gallery, item],
      photo: draft.photo || url,
    });
    setPhotoUrl("");
  }

  function addVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    patch({ videos: [...videos, { url, name: url, kind: "video" }] });
    setVideoUrl("");
  }

  async function finishAs(status) {
    const message = validate(STUDIO_STEPS.length - 1);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await persist(status);
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fetchDld() {
    const permit = String(draft.permit_number || "").trim();
    if (!permit) {
      setError("Listing Permit Number is required for DLD info.");
      setDldNote("");
      return;
    }
    setError("");
    const next = {};
    if (draft.permit_issue_date && !draft.permit_expiry_date) {
      const issued = new Date(draft.permit_issue_date);
      if (!Number.isNaN(issued.getTime())) {
        issued.setFullYear(issued.getFullYear() + 1);
        next.permit_expiry_date = issued.toISOString().slice(0, 10);
        next.portal_expiry = next.permit_expiry_date;
      }
    }
    if (Object.keys(next).length) patch(next);
    setDldNote(`Permit ${permit} is saved on this listing. Live DLD lookup is not connected on this desk.`);
  }

  const saveLabel = step === STUDIO_STEPS.length - 1 ? "Complete" : "Save & Continue";

  return (
    <div className="studio">
      <header className="studio-top">
        <div className="studio-brand">
          <button className="studio-home" type="button" onClick={onClose} aria-label="Back to listings">
            <Svg>
              <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" />
            </Svg>
          </button>
          <span className="brand-mark studio-logo" aria-hidden="true">
            <svg viewBox="0 0 40 16" fill="none">
              <path d="M3 13.5 20 3l17 10.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <b>A7</b>
          </span>
          <div className="studio-brand-text">
            <h1>
              <span>Property</span>
              <strong>Listing</strong>
            </h1>
            <em className="brand-kicker">A7 GROUP</em>
          </div>
        </div>
        <div className="studio-metrics">
          <span className="studio-metric avail">
            <i aria-hidden="true">
              <Svg>
                <path d="M12 21s-7-4.6-7-10a7 7 0 1 1 14 0c0 5.4-7 10-7 10Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="m9.6 11.2 1.7 1.7 3.2-3.3" stroke="currentColor" strokeWidth="1.7" />
              </Svg>
            </i>
            <span>
              <em>Availability</em>
              <b>{counts?.availability ?? 0}</b>
            </span>
          </span>
          <span className="studio-metric lists">
            <i aria-hidden="true">
              <Svg>
                <path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" strokeWidth="1.7" />
              </Svg>
            </i>
            <span>
              <em>Listings</em>
              <b>{counts?.all ?? 0}</b>
            </span>
          </span>
        </div>
        <button className="studio-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className="studio-steps">
        <div className="studio-step-track">
          {STUDIO_STEPS.map((item, index) => (
            <span
              className={`studio-step-wrap${index === step ? " on" : ""}${index < step ? " done" : ""}`}
              key={item.id}
            >
              {index > 0 ? <i className="studio-dash" /> : null}
              <button
                className="studio-step"
                type="button"
                onClick={() => {
                  if (index <= step || draft.id) setStep(index);
                }}
              >
                <b>
                  {index < step ? (
                    <Svg>
                      <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2.2" />
                    </Svg>
                  ) : (
                    index + 1
                  )}
                </b>
                <span>{item.label}</span>
              </button>
            </span>
          ))}
        </div>
        <button className="studio-save" type="button" disabled={busy} onClick={saveAndContinue}>
          {saveLabel}
          <Svg>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
          </Svg>
        </button>
      </div>

      {error ? <p className="studio-error">{error}</p> : null}

      <div className="studio-body">
        {step === 0 && (
          <div className="studio-grid">
            <div className="studio-main">
              <section className="studio-card">
                <SectionTitle>Choose Property Type</SectionTitle>
                <div className="studio-choices">
                  <div className="studio-choice-row">
                    <Choice
                      active={draft.category === "residential"}
                      label="Residential"
                      image={STUDIO_ICONS.residential}
                      onClick={() => {
                        patch({
                          category: "residential",
                          type: RES_TYPES.includes(draft.type) ? draft.type : "",
                        });
                      }}
                    />
                    <Choice
                      active={draft.category === "commercial"}
                      label="Commercial"
                      image={STUDIO_ICONS.commercial}
                      onClick={() => {
                        patch({
                          category: "commercial",
                          type: COM_TYPES.includes(draft.type) ? draft.type : "",
                        });
                      }}
                    />
                  </div>
                  <i className="studio-split" />
                  <div className="studio-choice-row">
                    <Choice
                      active={draft.purpose === "rent"}
                      label="Rent"
                      image={STUDIO_ICONS.rent}
                      onClick={() => {
                        patch({ purpose: "rent" });
                      }}
                    />
                    <Choice
                      active={draft.purpose === "sale"}
                      label="Sale"
                      image={STUDIO_ICONS.sale}
                      onClick={() => {
                        patch({ purpose: "sale" });
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="studio-card">
                <SectionTitle>Specifications</SectionTitle>
                <div className="studio-fields">
                  <Field label="Title deed">
                    <input value={draft.title_deed || ""} onChange={(e) => patch({ title_deed: e.target.value })} />
                  </Field>
                  <Field label="Property type" required>
                    <select value={draft.type || ""} onChange={(e) => patch({ type: e.target.value })}>
                      <option value="">Please select</option>
                      {types.map((item) => (
                        <option key={item} value={item}>
                          {pretty(item)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Size (sq.ft)" required>
                    <input
                      type="number"
                      min="1"
                      value={draft.area_sqft || ""}
                      onChange={(e) => patch({ area_sqft: e.target.value })}
                    />
                  </Field>
                  <Field label="Unit No" required>
                    <input value={draft.unit_no || ""} onChange={(e) => patch({ unit_no: e.target.value })} />
                  </Field>
                  <Field label="Number of bedrooms">
                    <input
                      type="number"
                      min="0"
                      value={draft.beds ?? ""}
                      onChange={(e) => patch({ beds: e.target.value })}
                    />
                  </Field>
                  <Field label="Number of bathrooms">
                    <input
                      type="number"
                      min="0"
                      value={draft.baths ?? ""}
                      onChange={(e) => patch({ baths: e.target.value })}
                    />
                  </Field>
                  <Field label="No of parking spaces">
                    <input
                      type="number"
                      min="0"
                      value={draft.parking || ""}
                      onChange={(e) => patch({ parking: e.target.value })}
                    />
                  </Field>
                  <Field label="Select furnished">
                    <select value={draft.furnished || ""} onChange={(e) => patch({ furnished: e.target.value })}>
                      {FURNISHED.map((item) => (
                        <option key={item.value || "none"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Total plot size (sq.ft)">
                    <input value={draft.plot_size || ""} onChange={(e) => patch({ plot_size: e.target.value })} />
                  </Field>
                  <Field label="Lot size (sq.ft)">
                    <input value={draft.lot_size || ""} onChange={(e) => patch({ lot_size: e.target.value })} />
                  </Field>
                  <Field label="Built-up Area">
                    <input value={draft.built_up_area || ""} onChange={(e) => patch({ built_up_area: e.target.value })} />
                  </Field>
                  <Field label="Layout Type">
                    <select value={draft.layout_type || ""} onChange={(e) => patch({ layout_type: e.target.value })}>
                      {LAYOUTS.map((item) => (
                        <option key={item || "none"} value={item}>
                          {item || "Please select"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Project Name">
                    <input value={draft.project_name || ""} onChange={(e) => patch({ project_name: e.target.value })} />
                  </Field>
                  <Field label="Project status" required>
                    <select
                      value={draft.project_status || "ready_secondary"}
                      onChange={(e) => patch({ project_status: e.target.value })}
                    >
                      {PROJECT_STATUSES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ownership">
                    <select value={draft.ownership || ""} onChange={(e) => patch({ ownership: e.target.value })}>
                      {OWNERSHIP.map((item) => (
                        <option key={item || "none"} value={item}>
                          {item || "Please select"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Developer">
                    <input
                      list="studio-developers"
                      value={draft.developer || ""}
                      onChange={(e) => patch({ developer: e.target.value })}
                      placeholder="Please select"
                    />
                  </Field>
                  <Field label="Build year">
                    <input
                      type="number"
                      min="1950"
                      max="2100"
                      value={draft.build_year || ""}
                      onChange={(e) => patch({ build_year: e.target.value })}
                    />
                  </Field>
                  <Field label="Listing Source">
                    <select
                      value={draft.listing_source || ""}
                      onChange={(e) => patch({ listing_source: e.target.value })}
                    >
                      {SOURCES.map((item) => (
                        <option key={item || "none"} value={item}>
                          {item || "Please select"}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="studio-card">
                <div className="studio-head">
                  <SectionTitle>Pricing</SectionTitle>
                  <Switch
                    label="Custom Pricing for Each Portal"
                    on={Boolean(draft.custom_portal_pricing)}
                    onClick={() =>
                      patch({ custom_portal_pricing: draft.custom_portal_pricing ? "" : "1" })
                    }
                  />
                </div>
                <div className="studio-price-list">
                  {PERIODS.map((item) => (
                    <label
                      key={item.id}
                      className={`studio-price-row${(draft.price_period || "yearly") === item.id ? " on" : ""}`}
                    >
                      <input
                        type="radio"
                        name="price-period"
                        checked={(draft.price_period || "yearly") === item.id}
                        onChange={() => patch({ price_period: item.id })}
                      />
                      <span>{item.label}</span>
                      <input
                        className="studio-price-box"
                        inputMode="decimal"
                        placeholder="Price"
                        value={draft[`price_${item.id}`] || ""}
                        onChange={(e) => patch({ [`price_${item.id}`]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>
                {draft.custom_portal_pricing ? (
                  <div className="studio-fields studio-portal-prices">
                    {PORTALS.map((portal) => (
                      <Field key={portal.id} label={`${portal.name} price`} boxed>
                        <input
                          inputMode="decimal"
                          placeholder="Price"
                          value={portalPrices[portal.id] || ""}
                          onChange={(e) =>
                            patch({
                              portal_prices: { ...portalPrices, [portal.id]: e.target.value },
                            })
                          }
                        />
                      </Field>
                    ))}
                  </div>
                ) : null}
                <div className="studio-fields">
                  <Field label="Payment Method">
                    <select
                      value={draft.payment_method || ""}
                      onChange={(e) => patch({ payment_method: e.target.value })}
                    >
                      {PAYMENTS.map((item) => (
                        <option key={item || "none"} value={item}>
                          {item || "Please select"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Number Of cheques">
                    <input
                      type="number"
                      min="0"
                      value={draft.cheques || ""}
                      onChange={(e) => patch({ cheques: e.target.value })}
                    />
                  </Field>
                  <Field label="Service Charges">
                    <input
                      value={draft.service_charges || ""}
                      onChange={(e) => patch({ service_charges: e.target.value })}
                    />
                  </Field>
                  <Field label="Financial Status">
                    <select
                      value={draft.financial_status || ""}
                      onChange={(e) => patch({ financial_status: e.target.value })}
                    >
                      {FINANCIAL.map((item) => (
                        <option key={item || "none"} value={item}>
                          {item || "Please select"}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="studio-card">
                <SectionTitle>Description</SectionTitle>
                <div className="studio-langs" role="tablist">
                  <button
                    type="button"
                    className={descLang === "en" ? "on" : ""}
                    onClick={() => setDescLang("en")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={descLang === "ar" ? "on" : ""}
                    onClick={() => setDescLang("ar")}
                  >
                    Arabic
                  </button>
                </div>
                {descLang === "en" ? (
                  <>
                    <Field label="Title" required>
                      <input
                        value={draft.title || ""}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                    </Field>
                    <Field label="Description" required>
                      <textarea
                        className="studio-desc"
                        rows={7}
                        placeholder="Enter English Description"
                        value={draft.description || ""}
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Title">
                      <input
                        dir="rtl"
                        value={draft.title_ar || ""}
                        onChange={(e) => patch({ title_ar: e.target.value })}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className="studio-desc"
                        dir="rtl"
                        rows={7}
                        placeholder="أدخل الوصف بالعربية"
                        value={draft.description_ar || ""}
                        onChange={(e) => patch({ description_ar: e.target.value })}
                      />
                    </Field>
                  </>
                )}
              </section>

              <section className="studio-card">
                <SectionTitle>Select Amenities</SectionTitle>
                {selectedAmenities.length === 0 ? (
                  <p className="studio-empty">There are no amenities uploaded yet</p>
                ) : (
                  <div className="studio-chips">
                    {selectedAmenities.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="studio-chip"
                        onClick={() =>
                          patch({
                            amenities: selectedAmenities.filter((name) => name !== item),
                          })
                        }
                      >
                        {item}
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="studio-ghost"
                  type="button"
                  onClick={() => setAmenityOpen(true)}
                >
                  Update Amenities
                </button>
              </section>
            </div>

            <aside className="studio-side">
              <section className="studio-card">
                <h2>Draft Property</h2>
                <div className="studio-fields one">
                  <Field label="Last update">
                    <input readOnly value={draft.updated_at ? when(draft.updated_at) : ""} />
                  </Field>
                  <Field label="Creation date">
                    <input readOnly value={draft.created_at ? when(draft.created_at) : ""} />
                  </Field>
                  <Field label="Created by">
                    <input readOnly value={draft.id ? (draft.created_by || "") : ""} />
                  </Field>
                </div>
              </section>

              <section className="studio-card">
                <h2>Management</h2>
                <Field label="Reference">
                  <div className="studio-ref">
                    <input value={draft.reference || "-"} readOnly />
                    <button type="button" onClick={copyRef} aria-label="Copy reference">
                      <Svg>
                        <rect x="8" y="8" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M6 16V4h10" stroke="currentColor" strokeWidth="1.6" />
                      </Svg>
                    </button>
                  </div>
                </Field>
                <Switch
                  label="is Different Agent for portal"
                  on={Boolean(draft.portal_agent_different)}
                  onClick={() =>
                    patch({
                      portal_agent_different: draft.portal_agent_different ? "" : "1",
                    })
                  }
                />
                <Field label="Listing Agent (RERA Agent)" required>
                  <input
                    list="studio-people"
                    value={draft.listing_agent || ""}
                    onChange={(e) => patch({ listing_agent: e.target.value })}
                    placeholder="Please select"
                  />
                </Field>
                <Field label="Listing Owner (non-RERA Agent)">
                  <input
                    list="studio-people"
                    value={
                      draft.portal_agent_different
                        ? draft.listing_owner || ""
                        : draft.listing_agent || ""
                    }
                    onChange={(e) => patch({ listing_owner: e.target.value })}
                    placeholder="Please select"
                    disabled={!draft.portal_agent_different}
                  />
                </Field>
                <Field label="Landlord Name">
                  <input
                    list="studio-landlords"
                    value={draft.landlord_name || ""}
                    onChange={(e) => patch({ landlord_name: e.target.value })}
                  />
                </Field>
                <Field label="Landlord Email">
                  <input
                    type="email"
                    value={draft.landlord_email || ""}
                    onChange={(e) => patch({ landlord_email: e.target.value })}
                  />
                </Field>
                <Field label="Landlord Contact">
                  <input
                    value={draft.landlord_phone || ""}
                    onChange={(e) => patch({ landlord_phone: e.target.value })}
                  />
                </Field>
                <Field label="Available From" boxed>
                  <input
                    type="date"
                    value={draft.available_from || ""}
                    onChange={(e) => patch({ available_from: e.target.value })}
                  />
                </Field>
              </section>

              <section className="studio-card">
                <h2>Property Permit</h2>
                <p className="studio-hint">Select your license type</p>
                <label className="studio-check">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.non_rera) || draft.license_type === "non_rera"}
                    onChange={(e) =>
                      patch({
                        non_rera: e.target.checked ? "1" : "",
                        license_type: e.target.checked ? "non_rera" : "rera",
                      })
                    }
                  />
                  Enable NON-RERA
                </label>
                {draft.non_rera || draft.license_type === "non_rera" ? null : (
                  <div className="studio-license">
                    <button
                      type="button"
                      className={draft.license_type !== "dtcm" ? "on" : ""}
                      onClick={() => patch({ license_type: "rera", non_rera: "" })}
                    >
                      RERA
                    </button>
                    <button
                      type="button"
                      className={draft.license_type === "dtcm" ? "on" : ""}
                      onClick={() => patch({ license_type: "dtcm", non_rera: "" })}
                    >
                      DTCM
                    </button>
                  </div>
                )}
                <Field label="Listing Permit Number" required tip="DLD / RERA permit">
                  <input
                    value={draft.permit_number || ""}
                    onChange={(e) => patch({ permit_number: e.target.value })}
                  />
                </Field>
                <Field label="Permit Issue Date" boxed>
                  <input
                    type="date"
                    value={draft.permit_issue_date || ""}
                    onChange={(e) => patch({ permit_issue_date: e.target.value })}
                  />
                </Field>
                <Field label="Permit Expiration Date" boxed>
                  <input
                    type="date"
                    value={draft.permit_expiry_date || ""}
                    onChange={(e) =>
                      patch({
                        permit_expiry_date: e.target.value,
                        portal_expiry: e.target.value,
                      })
                    }
                  />
                </Field>
                <button className="studio-dld" type="button" onClick={fetchDld}>
                  Get DLD INFO
                  <Svg>
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" />
                  </Svg>
                </button>
                {dldNote ? <p className="studio-dld-note">{dldNote}</p> : null}
              </section>
            </aside>
          </div>
        )}

        {step === 1 && (
          <section className="studio-stage">
            <StepHero tone="media" kicker="Step 02" title="Media gallery">
              Photos, floor plans and videos for this listing. Set one main image for the desk.
            </StepHero>
            <div className="stage-grid media-grid">
              <article className="studio-card stage-card">
                <div className="stage-card-head">
                  <h3>Property photos</h3>
                  <Switch
                    on={watermark}
                    onClick={() => setWatermark((value) => !value)}
                    label="A7 watermark"
                  />
                </div>
                <label className="step-drop">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addPhotos(e.target.files, "photo");
                      e.target.value = "";
                    }}
                  />
                  <b>Drop or browse photos</b>
                  <small>JPG, PNG or WEBP. 8 MB each.</small>
                </label>
                <div className="studio-url-row">
                  <input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Paste a photo URL"
                  />
                  <button className="btn" type="button" onClick={addPhotoUrl}>
                    Add URL
                  </button>
                </div>
                <div className="studio-media-grid">
                  {gallery
                    .filter((item) => item.kind !== "floorplan")
                    .map((item) => (
                      <article className={`studio-media${draft.photo === item.url ? " main" : ""}`} key={item.url}>
                        <img src={item.url} alt="" />
                        <div>
                          <button className="btn" type="button" onClick={() => patch({ photo: item.url })}>
                            {draft.photo === item.url ? "Main photo" : "Set main"}
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => {
                              const next = gallery.filter((file) => file.url !== item.url);
                              patch({
                                gallery: next,
                                photo:
                                  draft.photo === item.url
                                    ? next.find((file) => file.kind !== "floorplan")?.url || ""
                                    : draft.photo,
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </article>
              <div className="stage-stack">
                <article className="studio-card stage-card">
                  <h3>Floor plans</h3>
                  <label className="step-drop slim">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={(e) => {
                        addPhotos(e.target.files, "floorplan");
                        e.target.value = "";
                      }}
                    />
                    <b>Upload plan</b>
                    <small>Image or PDF</small>
                  </label>
                  <div className="studio-media-grid">
                    {gallery
                      .filter((item) => item.kind === "floorplan")
                      .map((item) => (
                        <article className="studio-media" key={item.url}>
                          {String(item.url).toLowerCase().endsWith(".pdf") ? (
                            <a href={item.url} target="_blank" rel="noreferrer">
                              {item.name || "Floor plan PDF"}
                            </a>
                          ) : (
                            <img src={item.url} alt="" />
                          )}
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() =>
                              patch({ gallery: gallery.filter((file) => file.url !== item.url) })
                            }
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                  </div>
                </article>
                <article className="studio-card stage-card">
                  <h3>Videos</h3>
                  <div className="studio-url-row">
                    <input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube or MP4 URL"
                    />
                    <button className="btn" type="button" onClick={addVideo}>
                      Add
                    </button>
                  </div>
                  <ul className="studio-link-list">
                    {videos.map((item) => (
                      <li key={item.url}>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.name || item.url}
                        </a>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() =>
                            patch({ videos: videos.filter((file) => file.url !== item.url) })
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="studio-stage">
            <StepHero tone="location" kicker="Step 03" title="Pin the location">
              City, community and building for search, filters and the public page.
            </StepHero>
            <div className="loc-path">
              {[draft.city || "City", draft.community || "Community", draft.sub_community || "Sub community", draft.building || "Building"]
                .map((item, index) => (
                  <span key={`${item}-${index}`}>
                    {item}
                    {index < 3 ? <i>/</i> : null}
                  </span>
                ))}
            </div>
            <article className="studio-card stage-card">
              <div className="studio-fields">
                <Field label="City" required>
                  <select
                    value={draft.city || ""}
                    onChange={(e) =>
                      patch({
                        city: e.target.value,
                        community: "",
                        sub_community: "",
                      })
                    }
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Community" required>
                  <select
                    value={draft.community || ""}
                    onChange={(e) => patch({ community: e.target.value, sub_community: "" })}
                  >
                    <option value="">Select community</option>
                    {communityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                    {draft.community && !communityOptions.includes(draft.community) ? (
                      <option value={draft.community}>{draft.community}</option>
                    ) : null}
                  </select>
                </Field>
                <Field label="Sub community">
                  <select
                    value={draft.sub_community || ""}
                    onChange={(e) => patch({ sub_community: e.target.value })}
                  >
                    <option value="">Select sub community</option>
                    {subOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                    {draft.sub_community && !subOptions.includes(draft.sub_community) ? (
                      <option value={draft.sub_community}>{draft.sub_community}</option>
                    ) : null}
                  </select>
                </Field>
                <Field label="Building / Cluster">
                  <input
                    value={draft.building || ""}
                    onChange={(e) => patch({ building: e.target.value })}
                    placeholder="Tower, cluster or villa number"
                  />
                </Field>
                <Field label="Unit No">
                  <input
                    value={draft.unit_no || ""}
                    onChange={(e) => patch({ unit_no: e.target.value })}
                  />
                </Field>
                <Field label="Project name">
                  <input
                    value={draft.project_name || ""}
                    onChange={(e) => patch({ project_name: e.target.value })}
                  />
                </Field>
              </div>
            </article>
          </section>
        )}

        {step === 3 && (
          <section className="studio-stage">
            <StepHero tone="publish" kicker="Step 04" title="Publishing desk">
              Turn portals on for this listing. Badges update on the desk immediately.
            </StepHero>
            <article className="studio-card stage-card publish-meta">
              <div className="studio-fields">
                <Field label="Price AED">
                  <input
                    type="number"
                    min="0"
                    value={draft.price_aed || selectedPrice() || ""}
                    onChange={(e) => patch({ price_aed: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Portal expiry">
                  <input
                    type="date"
                    value={draft.portal_expiry || draft.permit_expiry_date || ""}
                    onChange={(e) => patch({ portal_expiry: e.target.value })}
                  />
                </Field>
              </div>
            </article>
            <div className="studio-portal-grid">
              {PORTALS.map((portal) => {
                const on = (draft.portals || []).includes(portal.id);
                return (
                  <article className={`studio-portal-card portal-${portal.id}${on ? " on" : ""}`} key={portal.id}>
                    <div className="portal-top">
                      <strong>{portal.name}</strong>
                      <em>{on ? "On" : "Off"}</em>
                    </div>
                    <p>{portal.note}</p>
                    <Switch
                      on={on}
                      label={on ? "Visible on desk" : "Hidden"}
                      onClick={() => {
                        const current = draft.portals || [];
                        patch({
                          portals: on
                            ? current.filter((item) => item !== portal.id)
                            : [...current, portal.id],
                        });
                      }}
                    />
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="studio-stage">
            <StepHero tone="notes" kicker="Step 05" title="Private notes">
              Internal only. These notes do not go to portals or the public page.
            </StepHero>
            <article className="studio-card stage-card notes-card">
              <textarea
                className="studio-notes"
                rows={12}
                value={draft.notes || ""}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Owner instructions, viewing times, keys, pocket remarks..."
              />
              <div className="notes-meta">{String(draft.notes || "").length} characters</div>
            </article>
          </section>
        )}

        {step === 5 && (
          <section className="studio-stage">
            <StepHero tone="docs" kicker="Step 06" title="Documents vault">
              Title deed, NOC, Form A and related files. Images or PDF, up to 8 MB.
            </StepHero>
            <article className="studio-card stage-card">
              <div className="studio-fields">
                <Field label="Permit number">
                  <input
                    value={draft.permit_number || ""}
                    onChange={(e) => patch({ permit_number: e.target.value })}
                  />
                </Field>
                <Field label="Landlord email">
                  <input
                    value={draft.landlord_email || ""}
                    onChange={(e) => patch({ landlord_email: e.target.value })}
                  />
                </Field>
                <Field label="Landlord phone">
                  <input
                    value={draft.landlord_phone || ""}
                    onChange={(e) => patch({ landlord_phone: e.target.value })}
                  />
                </Field>
              </div>
            </article>
            <div className="studio-doc-grid">
              {DOC_SLOTS.map((slot) => {
                const file = documents.find((item) => item.kind === slot.id);
                return (
                  <article className={`studio-doc${file ? " ready" : ""}`} key={slot.id}>
                    <strong>{slot.label}</strong>
                    {file ? (
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {file.name || "Open file"}
                      </a>
                    ) : (
                      <span className="muted">Waiting for file</span>
                    )}
                    <label className="doc-browse">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          addDocument(slot.id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {file ? "Replace" : "Upload"}
                    </label>
                    {file ? (
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() =>
                          patch({
                            documents_list: documents.filter((item) => item.kind !== slot.id),
                          })
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="studio-stage">
            <StepHero tone="done" kicker="Step 07" title="Ready to finish">
              Review the listing, then save as draft, send for approval, or mark live.
            </StepHero>
            <article className="studio-card stage-card done-card">
              {draft.photo ? <img className="studio-preview" src={draft.photo} alt="" /> : null}
              <div className="studio-review">
                <div><span>Reference</span><b>{draft.reference || "-"}</b></div>
                <div><span>Title</span><b>{draft.title || "-"}</b></div>
                <div><span>Type</span><b>{pretty(draft.type)} / {pretty(draft.purpose)}</b></div>
                <div><span>Size / Unit</span><b>{draft.area_sqft || "-"} sqft / {draft.unit_no || "-"}</b></div>
                <div>
                  <span>Location</span>
                  <b>{[draft.city, draft.community, draft.sub_community, draft.building].filter(Boolean).join(" > ") || "-"}</b>
                </div>
                <div><span>Price</span><b>{selectedPrice() || draft.price_aed || 0} AED</b></div>
                <div><span>Agent</span><b>{draft.listing_agent || "-"}</b></div>
                <div><span>Permit</span><b>{draft.permit_number || "-"}</b></div>
                <div><span>Photos</span><b>{gallery.filter((item) => item.kind !== "floorplan").length}</b></div>
                <div><span>Portals</span><b>{(draft.portals || []).join(", ") || "None"}</b></div>
                <div><span>Documents</span><b>{documents.length}</b></div>
                <div><span>Amenities</span><b>{selectedAmenities.length}</b></div>
              </div>
              <div className="studio-finish">
                <button className="finish-btn draft" type="button" disabled={busy} onClick={() => finishAs("draft")}>
                  Save draft
                </button>
                <button className="finish-btn pending" type="button" disabled={busy} onClick={() => finishAs("pending")}>
                  Submit pending
                </button>
                <button className="finish-btn live" type="button" disabled={busy} onClick={() => finishAs("live")}>
                  Publish live
                </button>
              </div>
            </article>
          </section>
        )}
      </div>

      <footer className="studio-foot">
        <small>© 2026</small>
        <div className="studio-foot-actions">
          {step > 0 ? (
            <button className="btn" type="button" disabled={busy} onClick={() => setStep(step - 1)}>
              Previous
            </button>
          ) : null}
          <button className="studio-save" type="button" disabled={busy} onClick={saveAndContinue}>
            {saveLabel}
            <Svg>
              <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2" />
            </Svg>
          </button>
        </div>
      </footer>

      <datalist id="studio-people">
        {people.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="studio-landlords">
        {landlordNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="studio-developers">
        {developerNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {amenityOpen ? (
        <div className="studio-modal" role="dialog" aria-label="Update Amenities">
          <div className="studio-modal-card">
            <div className="studio-head">
              <h2>Update Amenities</h2>
              <button type="button" className="studio-close" onClick={() => setAmenityOpen(false)}>
                ×
              </button>
            </div>
            <div className="studio-amenity-grid">
              {AMENITIES.map((item) => {
                const on = selectedAmenities.includes(item);
                return (
                  <label key={item} className={`studio-amenity${on ? " on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        patch({
                          amenities: on
                            ? selectedAmenities.filter((name) => name !== item)
                            : [...selectedAmenities, item],
                        })
                      }
                    />
                    {item}
                  </label>
                );
              })}
            </div>
            <button className="studio-save" type="button" onClick={() => setAmenityOpen(false)}>
              Save amenities
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
