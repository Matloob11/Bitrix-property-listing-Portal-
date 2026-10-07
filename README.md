# Bitrix Property Listing Portal

A production-ready **property listing desk** built for Bitrix24. Agents manage listings inside CRM, publish to portals, sync live inventory from Property Finder, and handle UAE paperwork (tenancy, NOCs, Form A / Form I) from one place.

---

## Overview

This app runs as an isolated Node.js service and opens as a **Bitrix24 left-menu iframe**. It is designed for brokerage teams that need:

- A clean listings desk (draft → live → archived)
- Portal publishing and XML feeds (Property Finder, Bayut, Dubizzle, and more)
- Property Finder Atlas sync for real live ads, agents, locations, and leads
- CRM intelligence, owner-data inventory, and daily agent reports
- Tenancy contracts, e-sign links, NOCs, and booking forms with PDF output

**Stack:** Node.js 20+ · Express 5 · React 19 · Vite 7 · MySQL (production) / SQLite or JSON (local)

---

## Features

### Listings desk
- Ticket tabs: All / Mine / Draft / Live / Pending / Archived / Duplicate / Pocket
- Filters by purpose, type, community, agent, portal, quality, and more
- Listing Studio wizard for create / edit (details, media, location, publish, notes, docs)
- Bulk status, transfer, portal toggles, refresh, CSV import/export
- Public share pages at `/p/:reference`

### Portals
- XML feeds per portal: `/feeds/{portal}.xml`
- Property Finder Atlas publish + scheduled sync
- **Actual live filters** — portal filters use real PF `isLive` (and public Bayut/Dubizzle signals when available), not just desk checkboxes
- Feed URLs for Bayut, Dubizzle, Houza, TRB, Simsari, website, Rightmove, and others

### Bitrix24
- Left-menu install binding
- Session auth via Bitrix JS SDK (`BX24.getAuth`)
- Allowlisted desk access + admin gates
- Optional PF lead push into Bitrix CRM
- CRM intelligence, owner-data SPA inventory, TL daily reports

### UAE paperwork
- Tenancy tool (OCR extract, WhatsApp/email, e-sign, cheque receipts)
- NOC family (move-in / move-out / maintenance / Trakheesi)
- Form A, Form I, booking form, title-deed helpers
- In-process PDF generation

---

## Project structure

```
.
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── App.jsx         # Listings desk
│   │   ├── ListingStudio.jsx
│   │   └── styles.css
│   └── vite.config.js
├── server/                 # Express API + business logic
│   ├── index.js            # Entry + routes
│   ├── auth.js             # Bitrix session
│   ├── db.js               # MySQL / SQLite / JSON store
│   ├── listingModel.js     # Schema, filters, portal live rules
│   ├── pf.js / pfSync.js   # Property Finder Atlas
│   ├── feeds.js            # Portal XML feeds
│   ├── tenancy*.js / noc*.js / form*.js
│   └── deploy scripts…
├── deploy/                 # nginx + systemd unit examples
├── .env.example            # Safe env template (no secrets)
├── package.json
└── README.md
```

---

## Requirements

- **Node.js** ≥ 20
- **MySQL / MariaDB** for production (optional locally)
- Bitrix24 portal with a local/left-menu application
- Property Finder Atlas API credentials (for PF sync/publish)

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set SESSION_SECRET, PORTAL_DOMAIN, PUBLIC_ORIGIN
# For local UI without Bitrix: DEV_BYPASS=1

# 3. Build the client
npm run build

# 4. Run API + SPA
npm run dev
# → http://127.0.0.1:8844
```

Health check: `GET /healthz`

---

## Environment

Copy `.env.example` and fill values. **Never commit `.env`.**

| Variable | Purpose |
|---|---|
| `PORT` / `HOST` | Bind address (default `8844` / `127.0.0.1`) |
| `NODE_ENV` | `development` or `production` |
| `DEV_BYPASS` | `1` = local fake admin (never enable in production) |
| `SESSION_SECRET` | HMAC secret for session cookie |
| `PORTAL_DOMAIN` | Bitrix portal host |
| `PUBLIC_ORIGIN` | Public HTTPS origin of this app |
| `MYSQL_*` | MySQL connection (if empty → SQLite/JSON locally) |

Optional integrations (set only in server `.env`, never in git):

- `PF_API_KEY` / `PF_API_SECRET` — Property Finder Atlas
- `BITRIX_WEBHOOK` — inbound webhook for CRM helpers
- `OPENAI_API_KEY` — AI listing copy / OCR helpers
- `TENANCY_SMTP_*` — Gmail/SMTP for tenancy mail

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Express (serves API + built SPA) |
| `npm run build` | Vite production build → `client/dist` |
| `npm start` | Same as `dev` (production process) |

Utility CLIs under `server/scripts/` (run with `node`, after `.env` is set):

- `pfSyncNow.js` — one-shot Property Finder sync
- Import helpers for CSV / portal lists / tenancy

---

## Bitrix install

1. Deploy the app behind HTTPS with a stable `PUBLIC_ORIGIN`.
2. Create a Bitrix24 local application / left-menu handler pointing at your origin.
3. Open `/install` from Bitrix (or use the install API) so the left-menu binds to `/`.
4. Ensure CSP / iframe allows your CRM domain (see `deploy/*.conf` for `frame-ancestors`).

Auth flow: Bitrix iframe → `BX24.getAuth` → `POST /api/auth/bitrix` → signed session cookie.

---

## Production deploy (outline)

Example layout (adjust paths/hostnames to your VPS):

1. Place the app under `/opt/a7-listing-v2` (or similar).
2. Configure real `.env` on the server only (`NODE_ENV=production`, MySQL, PF keys, strong `SESSION_SECRET`).
3. `npm ci && npm run build`
4. Install systemd unit from `deploy/a7-listing-v2.service`
5. Point nginx to `127.0.0.1:8844` using `deploy/a7-listing-v2.conf`
6. Enable TLS (Let’s Encrypt) and restrict Node to localhost

```bash
sudo systemctl enable --now a7-listing-v2
sudo systemctl status a7-listing-v2
curl -sS http://127.0.0.1:8844/healthz
```

---

## Portal feeds

Authenticated desk users can list feed URLs via `GET /api/feeds`.

Public XML (example):

```
https://YOUR_ORIGIN/feeds/pf.xml
https://YOUR_ORIGIN/feeds/bayut.xml
https://YOUR_ORIGIN/feeds/dubizzle.xml
```

Feeds include listings with status `live` and that portal enabled.  
**Desk “live on portal” filters** prefer actual portal liveness (PF Atlas `isLive`, etc.) so counts match the public broker pages more closely.

---

## Security notes

- Do **not** commit `.env`, credentials, or private keys.
- Keep `DEV_BYPASS=0` (or unset) in production.
- Session cookies use `Secure` + `SameSite=None` in production for Bitrix iframes.
- Desk access is allowlisted; admins get destructive bulk actions.
- Treat uploads and `data/` as private runtime storage.

---

## License

Private / proprietary — for A7 Group Real Estate internal use unless otherwise agreed.

---

## Support

Issues and improvements: open a GitHub issue on this repository, or contact your Bitrix / Hostinger app maintainers.
