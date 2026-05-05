# Premium Nutrition Intake Form — Revised Plan

A standalone, public, mobile-first multi-step intake wizard for a nutrition practice. The PMS backend remains the source of truth for leads. This project safely captures intake answers, persists a local audit record, and forwards each submission to your PMS Supabase Edge Function which creates/updates the real lead and returns its id.

## 1. Data, privacy & draft handling

- **No localStorage for sensitive health data.** Health, lifestyle, and clinical answers never touch persistent client-side storage.
- **No sensitive data in URLs.** Submission ids used in the thank-you route are opaque UUIDs only; no health fields are ever passed via query string or hash.
- **Draft behavior**: in-memory React state only by default (refresh = restart). If a session draft is needed, use `sessionStorage` for *non-sensitive* fields (name, email, phone, current step index) only — explicitly never for medical, sexual, menstrual, or symptom data. A future "secure server-side draft" hook is left in the architecture (a `draft_token` row in `intake_submissions` with `status='draft'`) but is **not** enabled in v1.
- All transport over HTTPS; Zod validation on both client and server; strict max-lengths; CSP-friendly markup.

## 2. Data model (this project's Lovable Cloud)

**Single table — `intake_submissions`** (audit + reliability buffer; PMS is source of truth):

- `id` uuid pk, `created_at` timestamptz default now()
- `branch` text — 'female' | 'male' | 'child'
- `age` int, `dob` date null
- Identity: `full_name`, `phone`, `email`, `city`
- Guardian (child only): `guardian_name`, `guardian_relationship`, `guardian_phone`
- `payload` jsonb — full structured intake answers (required + any optional sections completed)
- **PMS sync columns**:
  - `pms_lead_id` text null — id returned by PMS edge function
  - `pms_status` text — 'pending' | 'sent' | 'failed' | 'duplicate_merged'
  - `pms_error` text null
  - `pms_sent_at` timestamptz null
  - `pms_attempts` int default 0
- **RLS**: `INSERT` allowed for anon (the public form); `SELECT/UPDATE/DELETE` denied to anon. Service role used by server functions for updates.
- **No duplicate `leads` mirror table.** Lead creation lives entirely in PMS.

## 3. Submission flow

```
Public intake form
  -> server fn validate (Zod)
  -> INSERT intake_submissions (pms_status='pending')
  -> POST PMS Edge Function (signed)
       PMS validates, dedupes by phone/email, creates or updates lead,
       returns { pms_lead_id, action: 'created'|'updated' }
  -> UPDATE intake_submissions SET pms_lead_id, pms_status='sent'|'duplicate_merged'
  -> respond { submissionId } to client
  -> (PMS call failure) keep pms_status='pending' or 'failed' with error;
     client still sees success; admin retry endpoint available.
```

PMS Edge Function contract (you'll implement on the PMS side):
- Auth: bearer token from `PMS_EDGE_KEY` (sent as `Authorization: Bearer ...`).
- Validates payload shape; **dedupes by normalized phone and/or email**; creates new lead or updates existing; returns `{ pms_lead_id: string, action: 'created'|'updated' }`.
- Idempotency: this app sends a unique `submission_id` header so PMS can be safely retried without double-creating.

## 4. Intake sections (multi-step wizard, one per screen, top progress bar)

### Required-now track (must be completed to submit)

1. **Welcome & branch** — Self / My child → branches into Female / Male / Child (gender chip for Self).
2. **Identity & contact** — full name, DOB (or age), gender confirm, phone, email (at least one of phone/email required, both recommended), city.
3. **Consent** — checkbox: agree to be contacted + privacy summary.
4. **Primary goal** — single-select chips (weight loss, weight gain, muscle gain, energy, gut health, hormonal balance, sports performance, manage medical condition, general wellness).
5. **Chief complaints** — multi-select pills, **pick top 1–3** (bloating, acidity, fatigue, poor sleep, weight gain, weight loss difficulty, hair fall, skin issues, low immunity, sugar cravings, hormonal issues, joint pain, constipation, headaches, low focus, other).
6. **Body snapshot** — current weight (kg, number stepper), height (cm or ft/in toggle).
7. **Lifestyle quick-capture**
   - Sleep hours — slider 3–12
   - Water intake — segmented (<1L / 1–2L / 2–3L / 3L+)
   - Activity level — segmented (sedentary / light / moderate / active / very active)
8. **Symptom snapshot ratings (1–5 dots)** — Sleep quality, Digestion, Daily energy, Fatigue level.

### Optional-later track (skippable, expandable cards after required is complete)

Wording on the gateway screen: **"Complete more details now"** (with Skip & submit option).

- **Detailed medical history** — yes/no toggles + conditional chips: diabetes, BP, thyroid, cholesterol, PCOS/PCOD (F), cardiac, kidney, liver, autoimmune, cancer history, surgeries, hospitalizations.
- **Family history** — multi-select pills for the same conditions.
- **Medications & supplements** — structured rows (name dropdown/freeform, frequency chips). Capped list, no long prose.
- **Digestion detail** — bowel frequency segmented, stool consistency chips, bloating timing chips, acidity triggers pills.
- **Food pattern** — diet type segmented (veg / non-veg / eggetarian / vegan / jain), cuisine pills, meals per day stepper, eats out per week slider, packaged/processed food frequency segmented, sugar drinks toggle, tea/coffee count stepper.
- **Lifestyle depth** — stress 1–5, screen time slider, smoking toggle (+freq), alcohol toggle (+freq), shift work toggle, travel frequency chips.
- **Sex-specific detail** — see below (only the matching branch is shown).
- **Anything else** — single short textarea (optional, max 240 chars).

## 5. Branch-specific logic

### Female (adult)

Required-now is shared. Optional sex-specific section includes:

- Periods status — segmented (regular / irregular / absent / menopausal)
- Cycle length — number stepper (days)
- Flow — chips (light / moderate / heavy / very heavy / clots)
- Number of period days — stepper
- PMS symptoms — multi-select pills (mood swings, cramps, bloating, breast tenderness, headaches, cravings, fatigue)
- Pain severity — 1–5 rating
- Pills / hormonal intervention — toggle + chips (OCPs, hormonal IUD, HRT, fertility meds, none)
- Pregnancy/lactation — segmented (none / trying / pregnant + trimester chips / lactating)
- Menopause — toggle; if yes: age at menopause (number), type segmented (natural / induced — surgical / induced — medical)

### Male (adult)

Optional sex-specific section includes:

- Urinary symptoms — multi-select pills (frequency, urgency, hesitancy, nocturia, incomplete emptying, none)
- Libido / sex drive — 1–5 rating
- Erectile concerns — yes/no toggle (optional)
- Testosterone status — segmented (not tested / normal / low / high / unsure)
- Testosterone replacement therapy — toggle
- Anabolic steroid / performance enhancer use — toggle (current / past / never), with optional chips for substance class
- Prostate concerns — yes/no toggle

All fields optional; clearly labelled as confidential.

### Child (under 18)

Required-now uses a **guardian sub-form** instead of self identity:
- Child name, DOB, gender chip
- Guardian name, guardian relationship dropdown (parent / grandparent / legal guardian / other), guardian phone (required), guardian email
- Consent checkbox (guardian)
- Body snapshot, lifestyle quick-capture, symptom ratings still required.

Child-specific optional section:
- School grade dropdown
- Stamina — 1–5 rating
- Attention span — 1–5 rating
- Focus / concentration — 1–5 rating
- Appetite — segmented (poor / variable / good / very good / excessive)
- Picky eater — 1–5 rating
- Sports per week — stepper (sessions)
- Sports timing — chips (morning / afternoon / evening)
- Outdoor sports — multi-select pills
- Indoor sports / activities — multi-select pills
- Screen time — slider (hrs/day)
- Packaged / processed food frequency — segmented (rarely / 1–2x wk / 3–5x wk / daily / multiple/day)
- Growth concerns — chips (height, weight gain, weight loss, delayed milestones, none)

Adult-only items (alcohol, smoking, pregnancy, sex drive, etc.) are never shown for child branch.

## 6. Required vs optional summary

- **Required (all branches)**: name, DOB/age, gender/branch, phone or email (both encouraged), city, consent, primary goal, 1–3 chief complaints, weight, height, sleep hours, water intake, activity level, four symptom ratings.
- **Required (child only, in addition)**: guardian name, relationship, guardian phone, guardian consent.
- **Everything else is optional** and grouped under "Complete more details now".

Validation: Zod schemas client + server. Phone normalized to E.164-ish, email RFC-ish, max-length caps on every text field, numeric ranges on weight/height/age.

## 7. UX & visual direction

- Placeholder palette: warm sage + cream + charcoal, generous whitespace, rounded-2xl cards, soft shadows, subtle motion on step transitions. Easy to swap for your brand later.
- Mobile-first: full-width cards, 16px base, 48px tap targets, sticky bottom Next/Back bar, top progress strip ("Step 4 of 9 · Required").
- Components used heavily: chips, segmented controls, sliders, 1–5 rating dots, multi-select pills, yes/no toggles, dropdowns, number steppers. Textareas appear only in the optional "Anything else" field.
- Smooth step transitions; respects `prefers-reduced-motion`.
- Accessibility: labelled controls, focus rings, semantic headings, aria-live on progress.

## 8. Thank-you & confirmation

- Animated check, "Thanks {first name} — your intake is with our team."
- Shows opaque submission reference id, expected next step ("We'll reach out on {masked phone} within 24h").
- Soft CTA: "Complete more details now" — re-opens the optional sections via a one-time signed link tied to the submission id (no health data in the URL itself).

## 9. Admin readiness for PMS

- All submissions queryable from PMS by `submission_id` (sent in the edge function call) and by the returned `pms_lead_id` stored back in `intake_submissions`.
- `payload` is structured JSON with stable, documented keys (`/docs/intake-schema.md`) so PMS can render or import directly.
- `pms_status` ∈ {pending, sent, failed, duplicate_merged} for dashboards.
- Admin retry endpoint `/api/admin/retry/$id` (auth-protected) lets PMS replay failed forwards.

## 10. Routes

```
/                       intake wizard (public)
/thank-you/$id          confirmation screen (opaque id only)
/api/public/intake      server fn: validate, persist, forward to PMS
/api/admin/retry/$id    auth-protected retry to PMS
```

## After approval (Build phase) I will

1. Enable Lovable Cloud and create the `intake_submissions` table + RLS.
2. Request your PMS edge function URL and shared key as runtime secrets (`PMS_EDGE_URL`, `PMS_EDGE_KEY`).
3. Implement the wizard, branches, validators, server function, and PMS forwarder.
4. Document the JSON payload schema and PMS edge function contract for your PMS side.
