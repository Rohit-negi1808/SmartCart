# SmartCart

**AI-powered product discovery and recommendation platform**, focused on laptops and tech products — built as a full MERN project with real email verification and a Gemini-grounded AI layer, not a toy CRUD app with a chatbot bolted on.

Describe what you need in plain language — *"a laptop under ₹70,000 for coding with 16GB RAM and good battery life"* — and SmartCart uses Gemini to understand your intent, searches a real MongoDB product catalog, ranks the results with a transparent, adaptive scoring engine, and explains *why* each product matches. Gemini never invents a product or a spec — it only interprets intent and explains real, stored data.

---

## Key features

### 🔐 Real email-verified authentication (SMTP + OTP)
No account exists until the user proves they control their inbox. Three-step, backend-enforced flow:
```
POST /api/auth/register            email only → 6-digit OTP sent via SMTP (Nodemailer)
POST /api/auth/verify-otp          OTP checked server-side (hashed, expiring, attempt-limited)
                                    → short-lived, purpose-scoped token issued (NOT a login session)
POST /api/auth/complete-registration   name + password, authorized by that token → account created
```
- OTP is bcrypt-hashed before storage — the raw code is never persisted, logged, or returned in any API response
- Expires after a configurable window, resend is rate-limited, verification attempts are capped
- `emailVerified` and password-presence are both enforced **on the backend**, at login and on every protected route — never trusted from the frontend
- No admin approval step anywhere; the user verifies themselves automatically

### 🤖 Gemini-powered AI, grounded in real data
- **Natural-language product search** — Gemini extracts structured requirements (budget, RAM, storage, use case, GPU preference, battery preference) from free text; MongoDB supplies the actual products
- **Floating laptop chatbot** — answers spec questions, comparisons, and recommendations using only real catalog data it retrieves first; explicitly says "I don't have that information" rather than guessing
- **AI match explanations** — a plain-language "why this fits" summary generated only from a product's real stored specs
- **AI-assisted comparison** — compares 2–4 real products, highlighting actual differences
- Built on `@google/genai` (Google's current SDK) targeting `gemini-flash-latest`, with automatic one-time retry on transient model-overload errors and specific, classified error messages (missing key / invalid key / rate-limited / overloaded) surfaced all the way to the UI instead of one generic failure message

### 🎯 Adaptive, explainable recommendation engine
Not one universal formula — scoring weights shift by use case (a gaming query weighs GPU heavily; a student query weighs price and battery instead), computed deterministically in one configurable file, never duplicated across controllers. Every result ships with a transparent match percentage.

### 📋 Comprehensive, honestly-sourced laptop data
- Deep product schema: processor, GPU (with a deterministic performance tier the scoring engine actually uses), memory, storage, display, battery, ports, connectivity, camera, audio, keyboard/touchpad, physical dimensions, cooling, security, upgradeability, software support, warranty, and a `source` field tracking where each spec came from
- Seed data is a small set of **real, currently-sold laptop configurations** with cited sources and prices — not randomly generated placeholder data

### 🛒 Full commerce-adjacent feature set
Product browsing with server-side search/filter/sort/pagination, authenticated wishlist, side-by-side comparison, search history, a role-gated admin page for catalog management — all wired to real API calls, nothing frontend-only.

---

## Tech stack

**Frontend:** React 18 + Vite, React Router, Axios, React Icons, Framer Motion. No Redux — plain Context API (`AuthContext`, `CompareContext`) and local component state throughout.

**Backend:** Node.js + Express, Mongoose/MongoDB, JWT, bcryptjs, Nodemailer (SMTP), `@google/genai` (Gemini), dotenv, CORS.

**Database:** MongoDB (Atlas in production, local MongoDB for development).

---

## Architecture

```text
                       USER
                         |
                         v
                  React Frontend (Vite, :5173)
                         |
                   HTTP / REST API
                         |
                         v
             Node.js + Express (:5000)
             /          |           \
            /           |            \
           v            v             v
       MongoDB      Gemini API    SMTP (Nodemailer)
           |
           v
     Product catalog (real, sourced specs)
```

The frontend never talks to MongoDB, Gemini, or SMTP directly. `GEMINI_API_KEY`, `MONGO_URI`, `JWT_SECRET`, and `SMTP_*` live only in `backend/.env`.

### AI search flow
```text
Natural-language query
        ↓
POST /api/ai/search
        ↓
geminiService.extractRequirements()  →  validated, schema-checked JSON
        ↓
MongoDB query built from those requirements
        ↓
utils/recommendationEngine.js scores + ranks the REAL results
        ↓
Ranked products + match %  →  React
```

### Chatbot flow (grounded, not free-floating)
```text
User message
        ↓
POST /api/chat
        ↓
Requirements extracted (reuses AI search's extractor)
        ↓
Relevant products pulled from MongoDB (text search or filtered query)
        ↓
Gemini answers using ONLY that retrieved data, told explicitly not to invent specs
        ↓
Reply  →  React chat widget
```

### Auth flow (see Key Features above for the full breakdown)
```text
email → OTP (SMTP) → verify-otp → registrationToken (15 min, single-purpose)
     → complete-registration (name + password) → account created → JWT issued
```

---

## Folder structure

```text
smartcart/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # authController, productController, aiController, chatController, wishlistController, searchController
│   ├── middleware/         # authMiddleware (protect/adminOnly/optionalAuth), errorMiddleware
│   ├── models/             # User, Product, SearchHistory
│   ├── routes/             # authRoutes, productRoutes, aiRoutes, chatRoutes, wishlistRoutes, searchRoutes
│   ├── services/
│   │   ├── geminiService.js   # all Gemini calls + error classification + retry logic live here
│   │   └── emailService.js    # all Nodemailer/SMTP logic lives here
│   ├── utils/recommendationEngine.js  # single source of truth for adaptive match-score weighting
│   ├── seed/products.js    # curated, sourced, real laptop data (upsert-based, safe to re-run)
│   ├── .env.example
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/     # Navbar, Footer, ProductCard, ProductGrid, SearchBar, FilterPanel, Loading, ChatWidget
        ├── pages/          # Home, AISearch, Products, ProductDetails, Compare, Wishlist,
        │                   # Login, Register, VerifyEmail, CompleteProfile, Dashboard, Admin
        ├── context/        # AuthContext, CompareContext
        ├── services/api.js # single Axios instance + every API call
        ├── App.jsx, main.jsx, index.css
```

---

## Environment variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=SmartCart <your_email@gmail.com>

OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

> Only `VITE_`-prefixed variables are exposed to the browser by Vite. `GEMINI_API_KEY`, `MONGO_URI`, `JWT_SECRET`, and every `SMTP_*` value stay backend-only, always.

Both folders ship a `.env.example` with the same keys and no values; `.env` is git-ignored in both.

---

## Local setup

### 1. MongoDB
Free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), or a local instance. Put the connection string in `MONGO_URI`.

### 2. Gemini API key
[Google AI Studio](https://aistudio.google.com/app/apikey) → Create API key → `GEMINI_API_KEY`. If missing/invalid, AI search degrades to general results and the chatbot returns a specific, classified error — neither crashes.

### 3. SMTP (Gmail is the fastest path)
1. Enable 2-Step Verification on the sending Gmail account.
2. Create an [App Password](https://myaccount.google.com/apppasswords) — copy the 16-character code **with no spaces**.
3. Fill in the `SMTP_*` block above. `SMTP_FROM` and `SMTP_USER` must be the same address the App Password belongs to.

Any standard SMTP provider (Outlook, SendGrid, Mailgun, SES) works identically — just swap `SMTP_HOST`/`SMTP_PORT`.

### 4. Backend
```bash
cd backend
npm install
npm run seed      # inserts curated, real laptop data — safe to re-run, upserts by brand+model
npm run dev        # http://localhost:5000
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 6. Create an admin user
Register and complete the full signup flow, then set that user's `role` to `"admin"` directly in MongoDB to unlock `/admin`.

---

## Testing the key features

**Signup + OTP:** `/register` → enter email → check inbox for a real "Verify your SmartCart account" email → enter the code at `/verify-email` → set name + password at `/complete-profile` → you're logged in. Wrong/expired codes return specific, attempt-counted errors; resend is cooldown-limited.

**AI search:** `/ai-search` → try *"I need a laptop under ₹90,000 with a strong GPU for video editing"* → watch it extract a structured requirement panel, then return real, ranked catalog results with match percentages.

**Chatbot:** click the bottom-right bubble → ask *"Which laptops under ₹90,000 have a dedicated GPU?"* or *"What's the difference between RTX 4050 and RTX 4060?"* → then ask about a laptop that isn't in the catalog — it should say so rather than inventing an answer.

---

## API overview

All responses follow `{ success, message, data }` (or `{ success: false, message }` on error), with real HTTP status codes throughout.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Step 1: email only, sends OTP |
| POST | `/api/auth/verify-otp` | — | Step 2: verifies OTP, returns a short-lived registration token |
| POST | `/api/auth/complete-registration` | registration token | Step 3: sets name/password, creates the account, returns a login JWT |
| POST | `/api/auth/resend-otp` | — | Resends OTP (rate-limited, invalidates the previous code) |
| POST | `/api/auth/login` | — | Logs in a fully-verified, completed account |
| GET | `/api/auth/me` | required | Current user |
| GET | `/api/products` | — | Search/filter/sort/paginate the catalog |
| GET | `/api/products/:id` | — | One product's full details |
| GET | `/api/products/meta/filters` | — | Distinct brands/processors for filter UI |
| POST/PUT/DELETE | `/api/products[/:id]` | admin | Manage products |
| POST | `/api/ai/search` | optional | Natural-language search → ranked, scored products |
| POST | `/api/ai/explain` | — | AI (or rule-based fallback) match explanation |
| POST | `/api/ai/compare` | — | AI comparison of 2–4 real products |
| POST | `/api/chat` | optional | Grounded laptop chatbot |
| GET/POST | `/api/wishlist` | required | View/add wishlist |
| DELETE | `/api/wishlist/:productId` | required | Remove from wishlist |
| GET/POST | `/api/search-history` | required | View/save AI search history |

---

## Deployment

- **Frontend → Vercel** — set `VITE_API_URL` to your deployed backend's `/api` URL.
- **Backend → Render** — set every variable from the `.env` list above (including `CLIENT_URL` pointing at your deployed frontend).
- **Database → MongoDB Atlas** — whitelist Render's IPs (or `0.0.0.0/0` for a portfolio project).

No secrets or environment-specific URLs are hard-coded anywhere in the source.

---

## What this project demonstrates

- Backend-enforced security: email verification, password hashing, and JWT auth that can't be bypassed by trusting the frontend
- Production-pattern AI integration: strict separation of "AI understands intent" vs. "database provides facts," with validated AI output and graceful degradation on failure
- A real, deterministic recommendation algorithm (not just an LLM call) with explainable, adaptive scoring
- Clean REST API design with consistent response shapes and real HTTP status codes
- Honest data practices — sourced, real product data with citations, not synthetic placeholder data presented as real

---

## Future improvements

- Broader catalog beyond laptops (monitors, keyboards) using the same schema pattern
- Multi-turn chat memory (currently single-turn, grounded per message)
- Price-drop alerts, server-side caching of repeated AI extractions
- Automated tests for the recommendation engine and OTP edge cases
