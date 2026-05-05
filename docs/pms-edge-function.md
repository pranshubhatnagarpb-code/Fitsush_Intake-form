# PMS Edge Function contract

This intake project POSTs each successful submission to your PMS Supabase
Edge Function. Implement that function on your PMS side to match this contract.

## Request

```
POST {PMS_EDGE_URL}
Authorization: Bearer {PMS_EDGE_KEY}
X-Submission-Id: {uuid}            # idempotency key — same id never creates twice
Content-Type: application/json

{
  "submission_id": "uuid",
  "branch": "female" | "male" | "child",
  "identity": {
    "full_name": "string",
    "dob": "YYYY-MM-DD" | null,
    "age": number | null,
    "city": "string",
    // adult branches:
    "phone": "string" | null,
    "email": "string" | null,
    // child branch only:
    "guardian_name": "string",
    "guardian_relationship": "string",
    "guardian_phone": "string",
    "guardian_email": "string" | null
  },
  "payload": { /* full structured intake — see src/lib/intake/schema.ts */ }
}
```

## Response (200)

```json
{
  "pms_lead_id": "string",
  "action": "created" | "updated" | "duplicate_merged"
}
```

## What the PMS edge function MUST do

1. Validate the `Authorization: Bearer ...` header against `PMS_EDGE_KEY`.
2. Validate payload shape (recommend Zod with the same schema as
   `src/lib/intake/schema.ts`).
3. **Dedupe** by normalized phone and/or email (and guardian_phone for child
   submissions). If a matching lead exists: update it and return
   `action: "updated"` (or `"duplicate_merged"`). Otherwise create a new lead
   and return `action: "created"`.
4. Be idempotent on `X-Submission-Id` — if the same id is forwarded twice
   (retry), return the same `pms_lead_id` without creating a new lead.
5. Return `pms_lead_id` so this project can store it back into
   `intake_submissions.pms_lead_id`.

## Error handling

- Any non-2xx response is treated as `pms_status='failed'` with the response
  body stored in `pms_error`. The submission is still saved locally and can be
  replayed via the admin retry path.

## Stable payload keys

Keys in `payload` are versioned (`payload.version`). Version 1 is documented
in `src/lib/intake/schema.ts`. New fields will be additive; existing keys will
not be renamed without bumping the version.
