# Supabase RLS Checklist (Fee Tracker)

Use this checklist to verify policies match current app behavior.

## 1) App operations to support

The app performs these operations for authenticated admin users:

- `students`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `payments`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `fee_settings`: `SELECT`, `INSERT`, `UPDATE` (via upsert)

> Auth model: login-only admin dashboard (no public signup flow in UI).

---

## 2) Confirm RLS is enabled

```sql
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('students', 'payments', 'fee_settings');
```

Expected: `rls_enabled = true` for all three tables.

---

## 3) Inspect current policies

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('students', 'payments', 'fee_settings')
order by tablename, policyname;
```

---

## 4) Recommended policies

## Option A (simple): all authenticated users are admins

Use this if only trusted admin accounts exist in Auth.

```sql
-- students
create policy "students_select_authenticated"
on public.students for select
to authenticated
using (true);

create policy "students_insert_authenticated"
on public.students for insert
to authenticated
with check (true);

create policy "students_update_authenticated"
on public.students for update
to authenticated
using (true)
with check (true);

create policy "students_delete_authenticated"
on public.students for delete
to authenticated
using (true);

-- payments
create policy "payments_select_authenticated"
on public.payments for select
to authenticated
using (true);

create policy "payments_insert_authenticated"
on public.payments for insert
to authenticated
with check (true);

create policy "payments_update_authenticated"
on public.payments for update
to authenticated
using (true)
with check (true);

create policy "payments_delete_authenticated"
on public.payments for delete
to authenticated
using (true);

-- fee_settings
create policy "fee_settings_select_authenticated"
on public.fee_settings for select
to authenticated
using (true);

create policy "fee_settings_insert_authenticated"
on public.fee_settings for insert
to authenticated
with check (true);

create policy "fee_settings_update_authenticated"
on public.fee_settings for update
to authenticated
using (true)
with check (true);
```

## Option B (stricter): only JWT role=admin

Use this if you set `app_metadata.role = 'admin'` in Supabase Auth users.

```sql
-- helper expression:
-- (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- students
create policy "students_select_admin"
on public.students for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "students_insert_admin"
on public.students for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "students_update_admin"
on public.students for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "students_delete_admin"
on public.students for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- payments
create policy "payments_select_admin"
on public.payments for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "payments_insert_admin"
on public.payments for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "payments_update_admin"
on public.payments for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "payments_delete_admin"
on public.payments for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- fee_settings
create policy "fee_settings_select_admin"
on public.fee_settings for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "fee_settings_insert_admin"
on public.fee_settings for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "fee_settings_update_admin"
on public.fee_settings for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

---

## 5) Auth checklist

- Disable public signup in Supabase Auth.
- Create admin users manually.
- If using Option B, set each admin user `app_metadata.role = 'admin'`.

---

## 6) Quick sanity tests

- Login and verify routes: `/`, `/students`, `/payments`, `/pending`, `/analytics`, `/settings`, `/help`
- Student CRUD + import
- Payment CRUD + bulk delete
- Update fee settings and confirm pending dues/amount suggestions reflect updates
- Logout and verify protected routes redirect to `/login`

If any action fails with permission errors, inspect `pg_policies` output first.
