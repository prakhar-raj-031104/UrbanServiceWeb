# UrbanService — On-Demand Home Services

A production-ready platform for booking **cooking, washing & home-cleaning** professionals.
React (Vite + GSAP) frontend · Node/Express backend · PostgreSQL (Prisma).

## Features

**Customer**
- Landing page with a cross-fading background-video hero, GSAP scroll reveals and a **pinned horizontal card scroll**.
- Services page with live **search**, category filters, **staff availability** and pricing.
- One-tap **request flow** — on submit the request is saved and a WhatsApp notification fires to the business number.
- **Track** page: enter your code to see status, the assigned professional (name/photo/phone) and a live timeline.

**Admin panel** (`/admin`, token-protected)
- Dashboard stats + filterable request list (auto-refresh every 10s).
- Workflow: **Accept → Assign staff → Mark Started (timestamp) → Complete & Bill (timestamp + auto cost)**.
- Assigning connects a stored staff profile (name, phone, photo) to the customer.
- Cost = `basePrice + hourlyRate × hours worked` (min 0.5h), computed from start/finish timestamps.

## Stack & structure

```
backend/    Express + Prisma + PostgreSQL
  prisma/schema.prisma   Service, Staff, ServiceRequest, RequestEvent
  src/routes/            services · requests · admin
  src/services/whatsapp.js   Twilio / Meta / log providers
frontend/   React + Vite + GSAP + react-router
  src/pages/  Landing · Services · Track · Admin
```

## Getting started

```bash
# 1. Install
npm run install:all           # or: cd backend && npm i ; cd ../frontend && npm i

# 2. Configure backend/.env  (DATABASE_URL is already set for local Postgres:5433)

# 3. Create tables + seed demo data
npm run db:push
npm run seed

# 4. Run both servers
npm run dev                   # api :4000  ·  web :5173
```

Open **http://localhost:5173**. Admin panel: **/admin** — token is `ADMIN_TOKEN` from `backend/.env`
(default `urban-admin-secret-change-me`).

## WhatsApp notifications

Every new request notifies the business number (`WHATSAPP_TO`). Provider is set by `WHATSAPP_PROVIDER`:

| Value    | Behaviour                                                        |
|----------|-----------------------------------------------------------------|
| `log`    | (default) prints the message + a `wa.me` click-to-chat link      |
| `twilio` | sends via Twilio WhatsApp API (set `TWILIO_*` vars)              |
| `meta`   | sends via Meta WhatsApp Cloud API (set `META_WA_*` vars)         |

> The business number is `WHATSAPP_TO=919888991549` (+91 98889 91549). To send real messages,
> switch `WHATSAPP_PROVIDER` to `twilio`/`meta` and add credentials.

## API

Public: `GET /api/services?q=&category=&available=` · `GET /api/services/:slug` ·
`POST /api/requests` · `GET /api/requests/:code`
Admin (Bearer token): `GET /api/admin/stats|requests|staff` ·
`POST /api/admin/requests/:id/{accept,assign,start,complete,cancel}`
