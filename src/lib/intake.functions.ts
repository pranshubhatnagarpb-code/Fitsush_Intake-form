import { createServerFn } from "@tanstack/react-start";
import { submissionSchema, type SubmissionInput } from "@/lib/intake/schema";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { forwardToPms } from "@/server/pms.server";

export type SubmitIntakeResult = {
  submissionId: string;
  pmsStatus: "pending" | "sent" | "failed" | "duplicate_merged";
};

export const submitIntake = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitIntakeResult> => {
    const input: SubmissionInput = data;

    // 1) Insert local audit row (pending)
    const insertRow = {
      branch: input.branch,
      age: input.required.age ?? null,
      dob: input.required.dob ?? null,
      full_name: input.required.fullName,
      city: input.required.city,
      phone: input.branch === "child" ? null : input.contact.phone ?? null,
      email: input.branch === "child" ? null : input.contact.email ?? null,
      guardian_name: input.branch === "child" ? input.guardian.guardianName : null,
      guardian_relationship: input.branch === "child" ? input.guardian.guardianRelationship : null,
      guardian_phone: input.branch === "child" ? input.guardian.guardianPhone : null,
      guardian_email: input.branch === "child" ? input.guardian.guardianEmail ?? null : null,
      payload: input as unknown as Record<string, unknown>,
      pms_status: "pending" as const,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("intake_submissions")
      .insert(insertRow)
      .select("id")
      .single();

    if (insertErr || !inserted) {
      throw new Error(`Failed to save intake: ${insertErr?.message ?? "unknown"}`);
    }

    const submissionId = inserted.id as string;

    // 2) Forward to PMS (best-effort; client always sees success)
    const result = await forwardToPms({ submissionId, input });

    let pmsStatus: SubmitIntakeResult["pmsStatus"];
    const update: Record<string, unknown> = { pms_attempts: 1 };

    if (result.ok) {
      pmsStatus = result.action === "duplicate_merged" ? "duplicate_merged" : "sent";
      update.pms_status = pmsStatus;
      update.pms_lead_id = result.pmsLeadId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } else {
      pmsStatus = "failed";
      update.pms_status = "failed";
      update.pms_error = result.error;
    }

    const { error: updErr } = await supabaseAdmin
      .from("intake_submissions")
      .update(update)
      .eq("id", submissionId);

    if (updErr) {
      // Sync columns failed to update — submission is still saved. Log only.
      // eslint-disable-next-line no-console
      console.error("intake_submissions sync update failed", updErr.message);
    }

    return { submissionId, pmsStatus };
  });

/**
 * Admin retry: re-forwards an existing pending/failed submission to the PMS.
 * Protected by an ADMIN_RETRY_TOKEN secret so PMS or an internal tool can
 * call it safely. NOT exposed to clients.
 */
export const retrySubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const v = input as { id?: string; token?: string };
    if (!v?.id || !v?.token) throw new Error("id and token required");
    return { id: String(v.id), token: String(v.token) };
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_RETRY_TOKEN;
    if (!expected || data.token !== expected) {
      throw new Error("Unauthorized");
    }

    const { data: row, error } = await supabaseAdmin
      .from("intake_submissions")
      .select("id, payload, pms_attempts")
      .eq("id", data.id)
      .single();

    if (error || !row) throw new Error("Submission not found");

    const parsed = submissionSchema.parse(row.payload);
    const result = await forwardToPms({ submissionId: row.id as string, input: parsed });

    const update: Record<string, unknown> = {
      pms_attempts: ((row.pms_attempts as number) ?? 0) + 1,
    };
    if (result.ok) {
      update.pms_status = result.action === "duplicate_merged" ? "duplicate_merged" : "sent";
      update.pms_lead_id = result.pmsLeadId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } else {
      update.pms_status = "failed";
      update.pms_error = result.error;
    }

    await supabaseAdmin.from("intake_submissions").update(update).eq("id", row.id);
    return { ok: result.ok, error: result.ok ? null : result.error };
  });
