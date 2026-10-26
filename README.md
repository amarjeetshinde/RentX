# RentX — Smart Equipment Rental Platform

A modern equipment rental marketplace where students, educational institutions and small businesses can rent cameras, laptops, projectors, electronics kits and sports equipment.

**Tech Stack:** React 19 · Vite 8 · Tailwind CSS v4 · React Router v7 · Supabase · Lucide React

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rentx.git
cd rentx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase (required)

RentX uses Supabase for its database, authentication and file storage.

**Step 1 — Create a Supabase project**

1. Go to [https://supabase.com](https://supabase.com) and sign in (free account is fine).
2. Click **New Project**, give it a name like `rentx`, and wait for it to be ready (~2 minutes).

**Step 2 — Get your API credentials**

1. Inside your Supabase project, go to **Project Settings → API**.
2. You will see two important values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

> ⚠️ **Never use the `service_role` key in frontend code.** It bypasses Row Level Security
> and must only be used in secure server-side environments like Supabase Edge Functions.

**Step 3 — Create your local environment file**

```bash
# Windows PowerShell
Copy-Item .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

Open `.env.local` and fill in your real values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

> `.env.local` is listed in `.gitignore` and will never be committed to Git.
> The `.env.local.example` file (which has no real secrets) is committed as a template.

**Step 4 — Start the development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer, MainLayout
│   └── ui/              # EquipmentCard, CategoryCard, HeroSection, etc.
├── data/
│   └── demoData.js      # Phase 1 demo data (no Supabase, clearly labelled)
├── lib/
│   └── supabaseClient.js  # Single shared Supabase client ← import from here
├── pages/               # HomePage, NotFoundPage, PlaceholderPage
├── hooks/               # Custom React hooks (Phase 3+)
├── utils/               # Shared helper functions (Phase 3+)
├── App.jsx              # React Router setup
├── main.jsx             # React entry point
└── index.css            # Tailwind v4 + design system tokens
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint for code quality checks |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Supabase **anon / public** key — safe for browser |

> All variables that Vite exposes to the browser **must** start with `VITE_`.
> Variables without this prefix remain server-side only.

---

## Using the Supabase Client

Import the single shared client from `src/lib/supabaseClient.js`:

```js
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

// Example: fetch equipment listings
const { data, error } = await supabase
  .from('equipment')
  .select('*')
  .order('created_at', { ascending: false })
```

`isSupabaseConfigured` is a boolean you can use to show a warning banner
in development when credentials haven't been filled in yet.

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | Project setup, Tailwind, routing, homepage UI |
| Phase 2 | ✅ Done | Supabase client integration, env config |
| Phase 3 | 🔜 Next | Authentication (sign up / log in) |
| Phase 4 | 🔜 | Database schema + equipment listings |
| Phase 5 | 🔜 | Booking system |
| Phase 6 | 🔜 | Owner dashboard |
| Phase 7 | 🔜 | Admin dashboard + analytics |

---

## Security Notes

- **Never** paste the Supabase `service_role` key into any frontend file.
- Row Level Security (RLS) policies will be defined in Phase 4 before any real data is stored.
- The anon key is safe for browser use — it only has access to what RLS policies allow.
- All SQL migrations will be reviewed by you before being applied to the database.
