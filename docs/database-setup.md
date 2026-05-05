# Database setup

You connected this intake project to your existing Supabase project
(`zkmfghujpmpggnzfkyvw`). Run the SQL below **once** in that project's
SQL editor (Supabase Dashboard → SQL Editor → New query):

```sql
create extension if not exists "pgcrypto";

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  branch text not null check (branch in ('female','male','child')),
  age integer check (age >= 0 and age <= 120),
  dob date,

  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (char_length(phone) <= 32),
  email text check (char_length(email) <= 254),
  city text check (char_length(city) <= 120),

  guardian_name text check (char_length(guardian_name) <= 120),
  guardian_relationship text check (char_length(guardian_relationship) <= 60),
  guardian_phone text check (char_length(guardian_phone) <= 32),
  guardian_email text check (char_length(guardian_email) <= 254),

  payload jsonb not null default '{}'::jsonb,

  pms_lead_id text,
  pms_status text not null default 'pending'
    check (pms_status in ('pending','sent','failed','duplicate_merged')),
  pms_error text,
  pms_attempts integer not null default 0,
  pms_sent_at timestamptz,

  constraint contact_required check (
    (phone is not null and char_length(phone) > 0)
    or (email is not null and char_length(email) > 0)
    or (guardian_phone is not null and char_length(guardian_phone) > 0)
  )
);

create index if not exists intake_submissions_created_at_idx
  on public.intake_submissions (created_at desc);
create index if not exists intake_submissions_pms_status_idx
  on public.intake_submissions (pms_status);
create index if not exists intake_submissions_phone_idx
  on public.intake_submissions (phone);
create index if not exists intake_submissions_email_idx
  on public.intake_submissions (email);

alter table public.intake_submissions enable row level security;

drop policy if exists "anon insert intake" on public.intake_submissions;
create policy "anon insert intake"
  on public.intake_submissions
  for insert
  to anon, authenticated
  with check (true);
```

## Required secrets (set in this Lovable project)

These are server-only and must NOT have a `VITE_` prefix:

- `SUPABASE_SERVICE_ROLE_KEY` — service role key from the same Supabase project.
  Needed so the server can update `pms_lead_id`, `pms_status`, etc. on the
  submission row after forwarding to the PMS. (Without it, inserts still
  succeed via the anon role but sync columns won't update.)
- `PMS_EDGE_URL` — full URL of your PMS Supabase Edge Function.
- `PMS_EDGE_KEY` — bearer token your edge function will validate.
- `ADMIN_RETRY_TOKEN` — random token to authorize manual retries.
