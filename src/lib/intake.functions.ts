import { createServerFn } from "@tanstack/react-start";
import { submissionSchema, type SubmissionInput } from "@/lib/intake/schema";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SubmitIntakeResult = {
  submissionId: string;
  pmsStatus: "pending" | "sent" | "failed" | "duplicate_merged";
};

// ---------------------------------------------------------------------------
// Creates or updates a client record in the shared PMS database.
// Maps all intake fields to their corresponding clients table columns.
// ---------------------------------------------------------------------------
async function upsertClient(input: SubmissionInput, submissionId: string): Promise<string | null> {
  const isChild = input.branch === "child";
  const phone = isChild
    ? input.guardian.guardianPhone ?? null
    : input.contact.phone ?? null;
  const email = isChild
    ? input.guardian.guardianEmail ?? null
    : input.contact.email ?? null;
  const normalizedPhone = phone?.replace(/\s+/g, "") || null;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  // Dedup: find existing client by phone, then email
  let existingId: string | null = null;
  if (normalizedPhone) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("phone", normalizedPhone)
      .limit(1)
      .maybeSingle();
    if (data) existingId = data.id as string;
  }
  if (!existingId && normalizedEmail) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (data) existingId = data.id as string;
  }

  // Safely access optional section (union type, cast to any)
  const opt = (input as any).optional as Record<string, any> | undefined;

  const payload: Record<string, unknown> = {
    name: input.required.fullName,
    date_of_birth: input.required.dob ?? null,
    age: input.required.age ?? null,
    address: input.required.city ?? null,
    gender: isChild ? null : input.branch,
    weight: input.required.body.weightKg,
    height: input.required.body.heightCm,
    goal: input.required.primaryGoal,
    chief_complaints: input.required.chiefComplaints,
    updated_at: new Date().toISOString(),
  };

  if (normalizedPhone) payload.phone = normalizedPhone;
  if (normalizedEmail) payload.email = normalizedEmail;

  // Optional fields — only set if provided, never overwrite with null
  if (opt?.foodPattern?.dietType) payload.diet_preference = opt.foodPattern.dietType;
  if (Array.isArray(opt?.medicalHistory) && opt.medicalHistory.length > 0) {
    payload.health_conditions = opt.medicalHistory;
  }
  if (Array.isArray(opt?.familyHistory) && opt.familyHistory.length > 0) {
    payload.family_history = opt.familyHistory;
  }

  if (existingId) {
    const { error } = await supabaseAdmin
      .from("clients")
      .update(payload)
      .eq("id", existingId);
    if (error) throw new Error(`Client update failed: ${error.message}`);
    return existingId;
  }

  const { data: created, error } = await supabaseAdmin
    .from("clients")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !created) throw new Error(`Client insert failed: ${error?.message ?? "unknown"}`);
  return created.id as string;
}

// ---------------------------------------------------------------------------
// Main submission server function
// ---------------------------------------------------------------------------
export const submitIntake = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitIntakeResult> => {
    const input: SubmissionInput = data;

    // 1) Insert audit row
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

    // 2) Create / update client profile
    let pmsStatus: SubmitIntakeResult["pmsStatus"];
    const update: Record<string, unknown> = { pms_attempts: 1 };

    try {
      const clientId = await upsertClient(input, submissionId);
      pmsStatus = "sent";
      update.pms_status = "sent";
      update.pms_lead_id = clientId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } catch (e) {
      pmsStatus = "failed";
      update.pms_status = "failed";
      update.pms_error = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.error("Client profile creation failed:", update.pms_error);
    }

    await supabaseAdmin
      .from("intake_submissions")
      .update(update)
      .eq("id", submissionId);

    return { submissionId, pmsStatus };
  });

// ---------------------------------------------------------------------------
// Admin retry
// ---------------------------------------------------------------------------
export const retrySubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const v = input as { id?: string; token?: string };
    if (!v?.id || !v?.token) throw new Error("id and token required");
    return { id: String(v.id), token: String(v.token) };
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_RETRY_TOKEN;
    if (!expected || data.token !== expected) throw new Error("Unauthorized");

    const { data: row, error } = await supabaseAdmin
      .from("intake_submissions")
      .select("id, payload, pms_attempts")
      .eq("id", data.id)
      .single();

    if (error || !row) throw new Error("Submission not found");

    const parsed = submissionSchema.parse(row.payload);
    const update: Record<string, unknown> = {
      pms_attempts: ((row.pms_attempts as number) ?? 0) + 1,
    };

    try {
      const clientId = await upsertClient(parsed, row.id as string);
      update.pms_status = "sent";
      update.pms_lead_id = clientId;
      update.pms_sent_at = new Date().toISOString();
      update.pms_error = null;
    } catch (e) {
      update.pms_status = "failed";
      update.pms_error = e instanceof Error ? e.message : String(e);
    }

    await supabaseAdmin.from("intake_submissions").update(update).eq("id", row.id);
    return { ok: update.pms_status === "sent", error: update.pms_error ?? null };
  });
