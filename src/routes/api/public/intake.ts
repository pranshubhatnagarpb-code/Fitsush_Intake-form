/**
 * Public HTTP endpoint mirror of the submitIntake server function.
 *
 * Useful for testing with curl and for non-React callers. Same validation,
 * same PMS forwarding, same audit row.
 */
import { createFileRoute } from "@tanstack/react-router";
import { submissionSchema } from "@/lib/intake/schema";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { forwardToPms } from "@/server/pms.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/intake")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
        }

        const parsed = submissionSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation failed", issues: parsed.error.issues },
            { status: 400, headers: cors },
          );
        }
        const input = parsed.data;

        const insertRow = {
          branch: input.branch,
          age: input.required.age ?? null,
          dob: input.required.dob ?? null,
          full_name: input.required.fullName,
          city: input.required.city,
          phone: input.branch === "child" ? null : input.contact.phone ?? null,
          email: input.branch === "child" ? null : input.contact.email ?? null,
          guardian_name: input.branch === "child" ? input.guardian.guardianName : null,
          guardian_relationship:
            input.branch === "child" ? input.guardian.guardianRelationship : null,
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
          return Response.json(
            { error: `Save failed: ${insertErr?.message ?? "unknown"}` },
            { status: 500, headers: cors },
          );
        }

        const submissionId = inserted.id as string;
        const result = await forwardToPms({ submissionId, input });

        const update: Record<string, unknown> = { pms_attempts: 1 };
        let pmsStatus: "sent" | "failed" | "duplicate_merged";
        if (result.ok) {
          pmsStatus = result.action === "duplicate_merged" ? "duplicate_merged" : "sent";
          update.pms_status = pmsStatus;
          update.pms_lead_id = result.pmsLeadId;
          update.pms_sent_at = new Date().toISOString();
        } else {
          pmsStatus = "failed";
          update.pms_status = "failed";
          update.pms_error = result.error;
        }

        await supabaseAdmin.from("intake_submissions").update(update).eq("id", submissionId);

        return Response.json({ submissionId, pmsStatus }, { status: 200, headers: cors });
      },
    },
  },
});
