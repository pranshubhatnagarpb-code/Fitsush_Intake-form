import { createFileRoute } from "@tanstack/react-router";
import { IntakeWizard } from "@/components/intake/Wizard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitsush - Client Intake Form" },
      {
        name: "description",
        content: "A private intake form to prepare your personalised nutrition consultation with Fitsush.",
      },
      { property: "og:title", content: "Fitsush - Client Intake Form" },
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
