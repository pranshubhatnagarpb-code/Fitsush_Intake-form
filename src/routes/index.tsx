import { createFileRoute } from "@tanstack/react-router";
import { IntakeWizard } from "@/components/intake/Wizard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MKR Clinic — Nutrition Intake" },
      {
        name: "description",
        content: "A private intake form to prepare your personalised nutrition consultation with Dr. Malika Kabra Rathi.",
      },
      { property: "og:title", content: "MKR Clinic — Nutrition Intake" },
      {
        property: "og:description",
        content: "Start your personalised nutrition plan in a few thoughtful steps.",
      },
    ],
  }),
  component: IntakePage,
});

function IntakePage() {
  return <IntakeWizard />;
}
