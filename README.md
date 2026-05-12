# Fee Tracker Dashboard (Next.js 14 + Supabase)

Admin-only fee tracking dashboard for **Class 9** and **Class 10**.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Tailwind CSS + shadcn-style UI primitives
- React Query
- Recharts
- Sonner toast

## Highlights

- Protected admin login (email/password)
- Dashboard with KPI cards, month-over-month trend, charts, and recent payments
- Students module
  - search + class filter
  - sorting + pagination (10 rows/page)
  - add/edit/delete
  - student profile page (`/students/[id]`) with payment history
  - import students from Google Sheet URL or CSV/XLSX with editable preview
- Payments module
  - class/type filters
  - sorting + pagination (10 rows/page)
  - single + bulk delete with confirm dialog
  - responsive card view on mobile
- Pending dues module
  - status + class filters synced to URL
  - quick payment action
- Settings module (`/settings`)
  - configurable yearly fee for Class 9/10
  - half-yearly auto-derived at 50%
- Help module (`/help`) for import/payment/due FAQs
- Dark-only theme, improved mobile navigation, keyboard-friendly dialogs/sheets

## Fee Rules

Fee settings are persisted in `fee_settings` and used for:

- default amount suggestion while recording payment
- pending due calculations

If `fee_settings` rows are missing, app safely falls back to:

- Class 9 yearly: ₹3000
- Class 10 yearly: ₹4000

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.local.example .env.local
```

3. Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Optional: comma-separated host allowlist for sheet URL imports
SHEET_FETCH_ALLOWLIST=docs.google.com
```

4. Create/update Supabase tables and RLS policies (see `docs/SUPABASE_RLS_CHECKLIST.md`).

5. Run app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Reference schema

```sql
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class text check (class in ('9','10')),
  phone text,
  parent_name text,
  enrollment_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  amount numeric(10,2),
  payment_type text check (payment_type in ('yearly','half_yearly')),
  payment_date date,
  period_start date,
  period_end date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists fee_settings (
  class text primary key check (class in ('9','10')),
  yearly_fee numeric(10,2) not null check (yearly_fee > 0),
  updated_at timestamptz default now()
);
```

## Notes

- Signup UI is intentionally not included.
- Create admin users directly from Supabase Auth dashboard.
- Keep `fee_settings` seeded with both classes for predictable behavior.
