/**
 * Forwards a validated intake submission to the PMS Supabase Edge Function.
 *
 * Contract (PMS side implements this):
 *   POST {PMS_EDGE_URL}
 *   Headers:
 *     Authorization: Bearer {PMS_EDGE_KEY}
 *     X-Submission-Id: {uuid}                 // idempotency key
 *     Content-Type: application/json
 *   Body: { submission_id, branch, identity, payload }
 *   Response 200: { pms_lead_id: string, action: 'created' | 'updated' }
 *
 * The PMS edge function MUST:
 *   - validate auth token
 *   - dedupe by normalized phone and/or email
 *   - create or update the lead
 *   - return the lead id
 *   - be idempotent on X-Submission-Id
 */
import type { SubmissionInput } from "@/lib/intake/schema";

export type PmsForwardResult =
  | { ok: true; pmsLeadId: string; action: "created" | "updated" | "duplicate_merged" }
  | { ok: false; error: string };

interface ForwardArgs {
  submissionId: string;
  input: SubmissionInput;
}

export async function forwardToPms({ submissionId, input }: ForwardArgs): Promise<PmsForwardResult> {
  const url = process.env.PMS_EDGE_URL;
  const key = process.env.PMS_EDGE_KEY;

  if (!url || !key) {
    return { ok: false, error: "PMS_EDGE_URL or PMS_EDGE_KEY not configured" };
  }

  const identity =
    input.branch === "child"
      ? {
          full_name: input.required.fullName,
          dob: input.required.dob ?? null,
          age: input.required.age ?? null,
          city: input.required.city,
          guardian_name: input.guardian.guardianName,
          guardian_relationship: input.guardian.guardianRelationship,
          guardian_phone: input.guardian.guardianPhone,
          guardian_email: input.guardian.guardianEmail ?? null,
        }
      : {
          full_name: input.required.fullName,
          dob: input.required.dob ?? null,
          age: input.required.age ?? null,
          city: input.required.city,
          phone: input.contact.phone ?? null,
          email: input.contact.email ?? null,
        };

  const body = {
    submission_id: submissionId,
    branch: input.branch,
    identity,
    payload: input,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "X-Submission-Id": submissionId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `PMS ${res.status}: ${text.slice(0, 500)}` };
    }

    let data: { pms_lead_id?: string; action?: string };
    try {
      data = JSON.parse(text) as { pms_lead_id?: string; action?: string };
    } catch {
      return { ok: false, error: `PMS returned non-JSON: ${text.slice(0, 200)}` };
    }

    if (!data.pms_lead_id) {
      return { ok: false, error: "PMS response missing pms_lead_id" };
    }

    const action =
      data.action === "updated" || data.action === "duplicate_merged" ? data.action : "created";

    return { ok: true, pmsLeadId: data.pms_lead_id, action };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `PMS fetch failed: ${msg}` };
  } finally {
    clearTimeout(timeout);
  }
}
