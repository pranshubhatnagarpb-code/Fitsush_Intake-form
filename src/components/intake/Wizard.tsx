import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import mkrLogo from "@/mkr-logo.webp";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import {
  ChipGroup,
  FieldLabel,
  NumberStepper,
  Rating,
  Segmented,
  YesNo,
} from "./primitives";
import {
  initialState,
  buildPayload,
  type WizardState,
  type WizardBranch,
} from "@/lib/intake/wizard-state";
import { submitIntake } from "@/lib/intake.functions";

const COMPLAINTS = [
  "bloating",
  "acidity",
  "fatigue",
  "poor sleep",
  "weight gain",
  "weight loss difficulty",
  "hair fall",
  "skin issues",
  "low immunity",
  "sugar cravings",
  "hormonal issues",
  "joint pain",
  "constipation",
  "headaches",
  "low focus",
  "other",
];

const GOALS: { value: string; label: string }[] = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "energy", label: "More energy" },
  { value: "gut_health", label: "Gut health" },
  { value: "hormonal_balance", label: "Hormonal balance" },
  { value: "sports_performance", label: "Sports performance" },
  { value: "manage_medical_condition", label: "Manage a condition" },
  { value: "general_wellness", label: "General wellness" },
];

const CONDITIONS = [
  "diabetes",
  "BP",
  "thyroid",
  "cholesterol",
  "PCOS/PCOD",
  "IBS",
  "cardiac",
  "kidney",
  "liver",
  "autoimmune",
  "cancer history",
  "surgeries",
  "hospitalizations",
];

type StepDef = {
  id: string;
  title: string;
  subtitle?: string;
  render: () => React.ReactNode;
  validate: () => string | null;
};

function calcAge(dob: string): number | undefined {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 120 ? age : undefined;
}

export function IntakeWizard() {
  const [state, setState] = React.useState<WizardState>(initialState);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const navigate = useNavigate();
  const submit = useServerFn(submitIntake);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const isChild = state.branch === "child";

  // ------------------- step definitions -------------------
  const steps: StepDef[] = [
    {
      id: "branch",
      title: "Who is this intake for?",
      subtitle: "We tailor questions to the right person.",
      render: () => (
        <div className="space-y-6">
          <Segmented
            options={[
              { value: "self", label: "For myself" },
              { value: "child", label: "For my child" },
            ]}
            value={state.isChild === undefined ? undefined : state.isChild ? "child" : "self"}
            onChange={(v) => {
              const child = v === "child";
              setState((s) => ({
                ...s,
                isChild: child,
                branch: child ? "child" : s.branch === "child" ? undefined : s.branch,
              }));
            }}
          />
          {state.isChild === false && (
            <div>
              <FieldLabel required>Gender</FieldLabel>
              <Segmented<WizardBranch>
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
                value={state.branch === "child" ? undefined : state.branch}
                onChange={(v) => set("branch", v)}
              />
            </div>
          )}
          {state.isChild === true && (
            <div>
              <FieldLabel required>Child's gender</FieldLabel>
              <Segmented
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
                value={state.childGender}
                onChange={(v) => set("childGender", v)}
              />
            </div>
          )}
        </div>
      ),
      validate: () => {
        if (!state.branch) return state.isChild ? null : "Pick who this is for and gender";
        if (state.isChild && !state.childGender) return "Pick the child's gender";
        return null;
      },
    },
    {
      id: "special-situations",
      title: "A few quick screening questions",
      subtitle: "These change what we ask you next.",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>
              {isChild
                ? "Does the child have a current or past cancer diagnosis / treatment?"
                : "Do you have a current or past cancer diagnosis / treatment?"}
            </FieldLabel>
            <YesNo
              value={state.hasCancerDiagnosis}
              onChange={(v) => set("hasCancerDiagnosis", v)}
            />
          </div>
          {state.branch === "female" && (
            <div>
              <FieldLabel required>Pregnancy / breastfeeding status</FieldLabel>
              <Segmented
                options={[
                  { value: "none", label: "None" },
                  { value: "trying", label: "Trying to conceive" },
                  { value: "pregnant", label: "Pregnant" },
                  { value: "lactating", label: "Breastfeeding" },
                ]}
                value={state.pregnancyStatus}
                onChange={(v) => set("pregnancyStatus", v)}
              />
            </div>
          )}
        </div>
      ),
      validate: () => {
        if (state.hasCancerDiagnosis === undefined) return "Please answer the cancer diagnosis question";
        if (state.branch === "female" && !state.pregnancyStatus) return "Please select a pregnancy status";
        return null;
      },
    },
    {
      id: "identity",
      title: isChild ? "Child & guardian details" : "About you",
      subtitle: isChild
        ? "We'll contact the guardian for any follow-up."
        : "Just the basics so we can reach you.",
      render: () => (
        <div className="space-y-5">
          <div>
            <Label htmlFor="fullName">
              {isChild ? "Child's full name" : "Full name"} <span className="text-primary">*</span>
            </Label>
            <Input
              id="fullName"
              value={state.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Anaya Sharma"
              className="h-12"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={state.dob ?? ""}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const dob = e.target.value || undefined;
                  setState((s) => ({
                    ...s,
                    dob,
                    age: dob ? calcAge(dob) : s.age,
                  }));
                }}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={120}
                value={state.age ?? ""}
                readOnly={!!state.dob}
                onChange={(e) =>
                  set("age", e.target.value ? Number(e.target.value) : undefined)
                }
                className={cn("h-12", state.dob && "bg-muted")}
              />
              {state.dob ? (
                <p className="mt-1 text-xs text-muted-foreground">Auto-calculated from DOB</p>
              ) : null}
            </div>
          </div>
          <div>
            <Label htmlFor="city">City <span className="text-primary">*</span></Label>
            <Input
              id="city"
              value={state.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="City you live in"
              className="h-12"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={state.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street address (optional)"
              className="h-12"
            />
          </div>

          {!isChild ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    inputMode="tel"
                    value={state.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={state.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className="h-12"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Phone or email is required — both recommended.
              </p>
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={state.profession ?? ""}
                  onChange={(e) => set("profession", e.target.value)}
                  placeholder="e.g. Teacher, Engineer"
                  className="h-12"
                />
              </div>
              <div>
                <FieldLabel>Marital status</FieldLabel>
                <Segmented
                  options={[
                    { value: "single", label: "Single" },
                    { value: "married", label: "Married" },
                    { value: "divorced", label: "Divorced" },
                    { value: "widowed", label: "Widowed" },
                  ]}
                  value={state.maritalStatus}
                  onChange={(v) => set("maritalStatus", v)}
                />
              </div>
              <div>
                <FieldLabel>Children</FieldLabel>
                <Segmented
                  options={[
                    { value: "none", label: "None" },
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3+", label: "3+" },
                  ]}
                  value={state.childrenCount}
                  onChange={(v) => set("childrenCount", v)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4 rounded-2xl border bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold text-secondary-foreground">Guardian</h3>
              <div>
                <Label htmlFor="gName">Guardian full name <span className="text-primary">*</span></Label>
                <Input
                  id="gName"
                  value={state.guardianName ?? ""}
                  onChange={(e) => set("guardianName", e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <FieldLabel required>Relationship to child</FieldLabel>
                <Segmented
                  options={[
                    { value: "parent", label: "Parent" },
                    { value: "grandparent", label: "Grandparent" },
                    { value: "legal_guardian", label: "Legal guardian" },
                    { value: "other", label: "Other" },
                  ]}
                  value={state.guardianRelationship}
                  onChange={(v) => set("guardianRelationship", v)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gPhone">Guardian phone <span className="text-primary">*</span></Label>
                  <Input
                    id="gPhone"
                    inputMode="tel"
                    value={state.guardianPhone ?? ""}
                    onChange={(e) => set("guardianPhone", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="gEmail">Guardian email</Label>
                  <Input
                    id="gEmail"
                    type="email"
                    value={state.guardianEmail ?? ""}
                    onChange={(e) => set("guardianEmail", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="referredBy">Referred by</Label>
            <Input
              id="referredBy"
              value={state.referredBy ?? ""}
              onChange={(e) => set("referredBy", e.target.value)}
              placeholder="Friend, Instagram, etc."
              className="h-12"
            />
          </div>
        </div>
      ),
      validate: () => {
        if (!state.fullName.trim()) return "Name is required";
        if (!state.city.trim()) return "City is required";
        if (!state.dob && !state.age) return "Provide date of birth or age";
        if (isChild) {
          if (!state.guardianName?.trim()) return "Guardian name is required";
          if (!state.guardianRelationship) return "Guardian relationship is required";
          if (!state.guardianPhone?.trim()) return "Guardian phone is required";
        } else {
          if (!state.phone?.trim() && !state.email?.trim())
            return "Provide phone or email";
        }
        return null;
      },
    },
    {
      id: "consent",
      title: isChild ? "Guardian consent" : "Consent",
      render: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your answers are private and used only by our nutrition team to plan your
            consultation. We never sell data.
          </p>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4">
            <Checkbox
              checked={state.consent}
              onCheckedChange={(c) => set("consent", c === true)}
            />
            <span className="text-sm leading-relaxed">
              {isChild
                ? "As the guardian, I agree to be contacted and to the privacy terms."
                : "I agree to be contacted and to the privacy terms."}
            </span>
          </label>
        </div>
      ),
      validate: () => (state.consent ? null : "Please accept to continue"),
    },
    ...(state.hasCancerDiagnosis
      ? [
          {
            id: "oncology-details",
            title: "Oncology / cancer nutrition",
            subtitle: "Details about the diagnosis and treatment.",
            render: () => <OncologyStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    ...(state.branch === "female" && state.pregnancyStatus === "trying"
      ? [
          {
            id: "fertility-details",
            title: "Fertility details",
            render: () => <FertilityStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    ...(state.branch === "female" && state.pregnancyStatus === "pregnant"
      ? [
          {
            id: "pregnancy-details",
            title: "Pregnancy details",
            render: () => <PregnancyStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    ...(state.branch === "female" && state.pregnancyStatus === "lactating"
      ? [
          {
            id: "lactation-details",
            title: "Lactation details",
            render: () => <LactationStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    ...(isChild && (state.age ?? 99) < 3
      ? [
          {
            id: "infant-feeding",
            title: "Infant feeding history",
            render: () => <InfantFeedingStepContent state={state} set={set} />,
            validate: () => null,
          } satisfies StepDef,
        ]
      : []),
    {
      id: "goal",
      title: "What's the primary goal?",
      render: () => (
        <ChipGroup
          options={GOALS}
          value={state.primaryGoal}
          onChange={(v) => set("primaryGoal", v as string)}
        />
      ),
      validate: () => (state.primaryGoal ? null : "Pick a primary goal"),
    },
    {
      id: "complaints",
      title: "Top concerns right now",
      subtitle: "Pick 1 to 3.",
      render: () => (
        <ChipGroup
          options={COMPLAINTS.map((c) => ({ value: c, label: c }))}
          value={state.chiefComplaints}
          onChange={(v) => set("chiefComplaints", v as string[])}
          multi
          max={3}
        />
      ),
      validate: () =>
        state.chiefComplaints.length === 0
          ? "Pick at least one"
          : state.chiefComplaints.length > 3
            ? "Pick up to 3"
            : null,
    },
    {
      id: "body",
      title: "Body snapshot",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>Current weight</FieldLabel>
            <NumberStepper
              value={state.weightKg}
              onChange={(v) => set("weightKg", v)}
              min={2}
              max={300}
              step={0.5}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel required>Height</FieldLabel>
            <NumberStepper
              value={state.heightCm}
              onChange={(v) => set("heightCm", v)}
              min={40}
              max={230}
              step={1}
              suffix="cm"
            />
          </div>
        </div>
      ),
      validate: () =>
        !state.weightKg || !state.heightCm ? "Enter weight and height" : null,
    },
    {
      id: "lifestyle",
      title: "Daily rhythm",
      render: () => (
        <div className="space-y-6">
          <div>
            <FieldLabel required>Sleep per night</FieldLabel>
            <NumberStepper
              value={state.sleepHours}
              onChange={(v) => set("sleepHours", v)}
              min={3}
              max={14}
              step={0.5}
              suffix="hrs"
            />
          </div>
          <div>
            <FieldLabel required>Water intake</FieldLabel>
            <Segmented
              options={[
                { value: "<1L", label: "<1L" },
                { value: "1-2L", label: "1–2L" },
                { value: "2-3L", label: "2–3L" },
                { value: "3L+", label: "3L+" },
              ]}
              value={state.waterIntake}
              onChange={(v) => set("waterIntake", v)}
            />
          </div>
          <div>
            <FieldLabel required>Activity level</FieldLabel>
            <Segmented
              options={[
                { value: "sedentary", label: "Sedentary" },
                { value: "light", label: "Light" },
                { value: "moderate", label: "Moderate" },
                { value: "active", label: "Active" },
                { value: "very_active", label: "Very active" },
              ]}
              value={state.activityLevel}
              onChange={(v) => set("activityLevel", v)}
            />
          </div>
          <div>
            <FieldLabel>Screen time (hrs/day)</FieldLabel>
            <NumberStepper
              value={state.screenTimeHrs}
              onChange={(v) => set("screenTimeHrs", v)}
              min={0}
              max={24}
              step={0.5}
              suffix="hrs"
            />
          </div>
        </div>
      ),
      validate: () =>
        !state.sleepHours || !state.waterIntake || !state.activityLevel
          ? "Complete sleep, water and activity"
          : null,
    },
    {
      id: "symptoms",
      title: "How are you feeling lately?",
      subtitle: "1 = very poor, 5 = excellent.",
      render: () => (
        <div className="space-y-6">
          {([
            ["rSleep", "Sleep quality", "5 = sleeping very well"],
            ["rDigestion", "Digestion", "5 = excellent digestion"],
            ["rEnergy", "Daily energy", "5 = high energy all day"],
            ["rFatigue", "Fatigue level", "1 = always tired · 5 = rarely tired"],
            ["rSkin", "Skin health", "5 = clear, healthy skin"],
            ["rHair", "Hair health", "5 = strong, healthy hair"],
          ] as const).map(([k, label, hint]) => (
            <div key={k}>
              <FieldLabel required hint={hint}>{label}</FieldLabel>
              <Rating value={state[k] as number | undefined} onChange={(n) => set(k, n)} />
            </div>
          ))}
        </div>
      ),
      validate: () =>
        !state.rSleep || !state.rDigestion || !state.rEnergy || !state.rFatigue || !state.rSkin || !state.rHair
          ? "Rate all six areas"
          : null,
    },
    {
      id: "optional",
      title: "Complete more details now",
      subtitle:
        "Optional — sharing more lets us prepare a deeper plan before your call. You can skip and submit.",
      render: () => <OptionalSections state={state} set={set} />,
      validate: () => null,
    },
  ];

  const safeStepIdx = Math.min(stepIdx, steps.length - 1);
  React.useEffect(() => {
    if (safeStepIdx !== stepIdx) setStepIdx(safeStepIdx);
  }, [safeStepIdx, stepIdx]);
  const step = steps[safeStepIdx];
  const total = steps.length;
  const isLast = safeStepIdx === total - 1;
  const progress = ((safeStepIdx + 1) / total) * 100;

  const handleNext = async () => {
    const err = step.validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (safeStepIdx < total - 1) {
      setStepIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // submit
    await handleSubmit();
  };

  const handleSkipAndSubmit = () => handleSubmit();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload(state);
      const res = await submit({ data: payload });
      navigate({ to: "/thank-you/$id", params: { id: res.submissionId } });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not submit. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top progress strip */}
      <header className="sticky top-0 z-10 border-b bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pt-3 pb-3">
          {/* MKR Clinic branding */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={mkrLogo} alt="MKR Clinic" className="h-8 w-auto object-contain" />
              <div className="leading-none">
                <p className="text-xs font-semibold text-foreground">MKR Clinic</p>
                <p className="text-[10px] text-muted-foreground">Dr. Malika Kabra Rathi</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Step {safeStepIdx + 1} of {total} · {safeStepIdx === total - 1 ? "Optional" : "Required"}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {step.title}
          </h1>
          {step.subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{step.subtitle}</p>
          ) : null}
          <div className="mt-8">{step.render()}</div>
        </div>
      </main>

      {/* Sticky bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {isLast && (
            <button
              type="button"
              onClick={handleSkipAndSubmit}
              disabled={submitting}
              className="mb-2 block w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50 sm:hidden"
            >
              Skip & submit
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={safeStepIdx === 0 || submitting}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft /> Back
            </Button>

            {isLast ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipAndSubmit}
                    disabled={submitting}
                  >
                    Skip & submit
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-full px-6"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        Submit <Check />
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full px-6 sm:hidden"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit <Check />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                disabled={submitting}
                className="rounded-full px-6"
              >
                Continue <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

// ------------------- optional sections -------------------

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold",
          open ? "border-b bg-secondary/50" : "hover:bg-secondary/30",
        )}
      >
        {title}
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="space-y-6 p-5">{children}</div> : null}
    </div>
  );
}

type SetFn = <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;

function OptionalSections({ state, set }: { state: WizardState; set: SetFn }) {
  const isChild = state.branch === "child";
  return (
    <div className="space-y-3">
      <Section title="Medical history" defaultOpen>
        <FieldLabel>Conditions diagnosed</FieldLabel>
        <ChipGroup
          options={CONDITIONS.map((c) => ({ value: c, label: c }))}
          value={state.medicalHistory}
          onChange={(v) => set("medicalHistory", v as string[])}
          multi
        />
        <div>
          <Label htmlFor="allergies">Allergies / intolerances</Label>
          <Input
            id="allergies"
            value={state.allergies ?? ""}
            onChange={(e) => set("allergies", e.target.value)}
            placeholder="e.g. Gluten, Lactose, Nuts"
            className="mt-2 h-12"
          />
        </div>
        <div>
          <Label htmlFor="surgicalHistory">Surgical history</Label>
          <Textarea
            id="surgicalHistory"
            rows={3}
            placeholder="Any surgeries or procedures..."
            value={state.surgicalHistory ?? ""}
            onChange={(e) => set("surgicalHistory", e.target.value)}
            className="mt-2"
          />
        </div>
      </Section>

      <Section title="Family history">
        <FieldLabel>Conditions in close family</FieldLabel>
        <ChipGroup
          options={CONDITIONS.map((c) => ({ value: c, label: c }))}
          value={state.familyHistory}
          onChange={(v) => set("familyHistory", v as string[])}
          multi
        />
      </Section>

      <Section title="Medications & supplements">
        <MedicationsEditor state={state} set={set} />
      </Section>

      <Section title="Body measurements & vitals">
        <div>
          <FieldLabel>Blood group</FieldLabel>
          <Segmented
            options={[
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
              { value: "unknown", label: "Not sure" },
            ]}
            value={state.bloodGroup}
            onChange={(v) => set("bloodGroup", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Target weight</FieldLabel>
            <NumberStepper
              value={state.targetWeightKg}
              onChange={(v) => set("targetWeightKg", v)}
              min={2}
              max={300}
              step={0.5}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel>Waist at navel</FieldLabel>
            <NumberStepper
              value={state.waistNavelCm}
              onChange={(v) => set("waistNavelCm", v)}
              min={20}
              max={200}
              suffix="cm"
            />
          </div>
          <div>
            <FieldLabel>Waist at thinnest</FieldLabel>
            <NumberStepper
              value={state.waistThinnestCm}
              onChange={(v) => set("waistThinnestCm", v)}
              min={20}
              max={200}
              suffix="cm"
            />
          </div>
          <div>
            <FieldLabel>Hip</FieldLabel>
            <NumberStepper
              value={state.hipCm}
              onChange={(v) => set("hipCm", v)}
              min={20}
              max={200}
              suffix="cm"
            />
          </div>
          <div>
            <FieldLabel>Neck</FieldLabel>
            <NumberStepper
              value={state.neckCm}
              onChange={(v) => set("neckCm", v)}
              min={10}
              max={100}
              suffix="cm"
            />
          </div>
          <div>
            <FieldLabel>Pulse rate</FieldLabel>
            <NumberStepper
              value={state.pulseRate}
              onChange={(v) => set("pulseRate", v)}
              min={20}
              max={250}
              suffix="bpm"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bloodPressure">Blood pressure</Label>
          <Input
            id="bloodPressure"
            value={state.bloodPressure ?? ""}
            onChange={(e) => set("bloodPressure", e.target.value)}
            placeholder="120/80"
            className="mt-2 h-12"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Heaviest adult weight</FieldLabel>
            <NumberStepper
              value={state.heaviestWeightKg}
              onChange={(v) => set("heaviestWeightKg", v)}
              min={2}
              max={400}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel>Lightest adult weight</FieldLabel>
            <NumberStepper
              value={state.lightestWeightKg}
              onChange={(v) => set("lightestWeightKg", v)}
              min={2}
              max={400}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel>Weight 6 months ago</FieldLabel>
            <NumberStepper
              value={state.weight6moAgoKg}
              onChange={(v) => set("weight6moAgoKg", v)}
              min={2}
              max={400}
              suffix="kg"
            />
          </div>
          <div>
            <FieldLabel>Weight 3 years ago</FieldLabel>
            <NumberStepper
              value={state.weight3yrAgoKg}
              onChange={(v) => set("weight3yrAgoKg", v)}
              min={2}
              max={400}
              suffix="kg"
            />
          </div>
        </div>
      </Section>

      <Section title="Digestion detail">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel hint="5 = very severe acidity">Acidity severity (1–5)</FieldLabel>
            <Rating value={state.acidityRating} onChange={(n) => set("acidityRating", n)} />
          </div>
          <div>
            <FieldLabel hint="5 = very severe bloating">Bloating severity (1–5)</FieldLabel>
            <Rating value={state.bloatingRating} onChange={(n) => set("bloatingRating", n)} />
          </div>
          <div>
            <FieldLabel hint="5 = very severe constipation">Constipation severity (1–5)</FieldLabel>
            <Rating value={state.constipationRating} onChange={(n) => set("constipationRating", n)} />
          </div>
        </div>
        <div>
          <FieldLabel>Bowel frequency</FieldLabel>
          <Segmented
            options={[
              { value: "<1/day", label: "<1/day" },
              { value: "1/day", label: "1/day" },
              { value: "2-3/day", label: "2–3/day" },
              { value: ">3/day", label: ">3/day" },
            ]}
            value={state.bowelFrequency}
            onChange={(v) => set("bowelFrequency", v)}
          />
        </div>
        <div>
          <FieldLabel>Stool consistency</FieldLabel>
          <ChipGroup
            options={["hard", "normal", "soft", "loose", "mucus"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.stoolConsistency}
            onChange={(v) => set("stoolConsistency", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Bloating timing</FieldLabel>
          <ChipGroup
            options={["morning", "after meals", "evening", "night", "all day"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.bloatingTiming}
            onChange={(v) => set("bloatingTiming", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Acidity triggers</FieldLabel>
          <ChipGroup
            options={["spicy", "fried", "coffee", "tea", "stress", "skipping meals"].map(
              (v) => ({ value: v, label: v }),
            )}
            value={state.acidityTriggers}
            onChange={(v) => set("acidityTriggers", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Other digestive symptoms</FieldLabel>
          <ChipGroup
            options={["nausea", "vomiting", "reflux / heartburn", "none"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={state.digestiveSymptoms}
            onChange={(v) => set("digestiveSymptoms", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Lunch duration</FieldLabel>
          <Segmented
            options={[
              { value: "under_10", label: "Under 10 min" },
              { value: "10_20", label: "10–20 min" },
              { value: "over_20", label: "Over 20 min" },
            ]}
            value={state.lunchDuration}
            onChange={(v) => set("lunchDuration", v)}
          />
        </div>
        <div>
          <FieldLabel>Daily rituals</FieldLabel>
          <ChipGroup
            options={[
              "drink water on empty stomach",
              "sit while drinking water",
              "brush teeth at night",
            ].map((v) => ({ value: v, label: v }))}
            value={state.dailyRituals}
            onChange={(v) => set("dailyRituals", v as string[])}
            multi
          />
        </div>
      </Section>

      <Section title="Food pattern">
        <div>
          <FieldLabel>Diet type</FieldLabel>
          <Segmented
            options={[
              { value: "veg", label: "Veg" },
              { value: "non_veg", label: "Non-veg" },
              { value: "eggetarian", label: "Eggetarian" },
              { value: "pescatarian", label: "Pescatarian" },
              { value: "vegan", label: "Vegan" },
              { value: "jain", label: "Jain" },
            ]}
            value={state.dietType}
            onChange={(v) => set("dietType", v)}
          />
        </div>
        <div>
          <FieldLabel>Cuisines you eat most</FieldLabel>
          <ChipGroup
            options={[
              "north indian",
              "south indian",
              "street food / chaat",
              "continental",
              "chinese",
              "italian",
              "mexican",
              "thai",
              "japanese",
              "middle eastern",
            ].map((v) => ({ value: v, label: v }))}
            value={state.cuisines}
            onChange={(v) => set("cuisines", v as string[])}
            multi
            allowOther
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Meals per day</FieldLabel>
            <NumberStepper
              value={state.mealsPerDay}
              onChange={(v) => set("mealsPerDay", v)}
              min={1}
              max={8}
            />
          </div>
          <div>
            <FieldLabel>Eats out (times/week)</FieldLabel>
            <NumberStepper
              value={state.eatsOutPerWeek}
              onChange={(v) => set("eatsOutPerWeek", v)}
              min={0}
              max={21}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Packaged / processed food</FieldLabel>
          <Segmented
            options={[
              { value: "rarely", label: "Rarely" },
              { value: "1-2_wk", label: "1–2/wk" },
              { value: "3-5_wk", label: "3–5/wk" },
              { value: "daily", label: "Daily" },
              { value: "multi_daily", label: "Multiple/day" },
            ]}
            value={state.packagedFoodFrequency}
            onChange={(v) => set("packagedFoodFrequency", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Sugar drinks?</FieldLabel>
            <YesNo
              value={state.sugarDrinks}
              onChange={(v) => set("sugarDrinks", v)}
            />
          </div>
          <div>
            <FieldLabel>Energy / carbonated drinks</FieldLabel>
            <Segmented
              options={[
                { value: "never", label: "Never" },
                { value: "rarely", label: "Rarely" },
                { value: "sometimes", label: "Sometimes" },
                { value: "daily", label: "Daily" },
              ]}
              value={state.energyCarbonatedDrinks}
              onChange={(v) => set("energyCarbonatedDrinks", v)}
            />
          </div>
          <div>
            <FieldLabel>Tea / coffee per day</FieldLabel>
            <NumberStepper
              value={state.teaCoffeePerDay}
              onChange={(v) => set("teaCoffeePerDay", v)}
              min={0}
              max={20}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="teaCoffeeFirstCupTime">First cup timing</Label>
          <Input
            id="teaCoffeeFirstCupTime"
            type="time"
            value={state.teaCoffeeFirstCupTime ?? ""}
            onChange={(e) => set("teaCoffeeFirstCupTime", e.target.value)}
            className="mt-2 h-12"
          />
        </div>
        <div>
          <FieldLabel>Primarily home cooked?</FieldLabel>
          <Segmented
            options={[
              { value: "yes", label: "Yes" },
              { value: "partially", label: "Partially" },
              { value: "rarely", label: "Rarely" },
            ]}
            value={state.homeCooked}
            onChange={(v) => set("homeCooked", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel>Who cooks?</FieldLabel>
            <Segmented
              options={[
                { value: "self", label: "Self" },
                { value: "family", label: "Family" },
                { value: "cook_help", label: "Cook / help" },
                { value: "mix", label: "Mix" },
              ]}
              value={state.whoCooks}
              onChange={(v) => set("whoCooks", v)}
            />
          </div>
          <div>
            <Label htmlFor="cookingOil">Cooking oil / fat</Label>
            <Input
              id="cookingOil"
              value={state.cookingOil ?? ""}
              onChange={(e) => set("cookingOil", e.target.value)}
              placeholder="Ghee, coconut oil..."
              className="h-12"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="foodLikes">Food likes</Label>
          <Input
            id="foodLikes"
            value={state.foodLikes ?? ""}
            onChange={(e) => set("foodLikes", e.target.value)}
            placeholder="e.g. Dal, paneer, mangoes"
            className="mt-2 h-12"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="foodDislikes">Food dislikes</Label>
            <Input
              id="foodDislikes"
              value={state.foodDislikes ?? ""}
              onChange={(e) => set("foodDislikes", e.target.value)}
              placeholder="e.g. Bitter gourd"
              className="h-12"
            />
          </div>
          <div>
            <Label htmlFor="cravings">Cravings</Label>
            <Input
              id="cravings"
              value={state.cravings ?? ""}
              onChange={(e) => set("cravings", e.target.value)}
              placeholder="e.g. Sweets, salty"
              className="h-12"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Eating speed</FieldLabel>
          <Segmented
            options={[
              { value: "slow", label: "Slow" },
              { value: "moderate", label: "Moderate" },
              { value: "fast", label: "Fast" },
            ]}
            value={state.eatingSpeed}
            onChange={(v) => set("eatingSpeed", v)}
          />
        </div>
        <div>
          <FieldLabel>Binge / emotional eating?</FieldLabel>
          <Segmented
            options={[
              { value: "no", label: "No" },
              { value: "occasionally", label: "Occasionally" },
              { value: "frequently", label: "Frequently" },
            ]}
            value={state.bingeEating}
            onChange={(v) => set("bingeEating", v)}
          />
        </div>
        <div>
          <FieldLabel>Typical daily meals</FieldLabel>
          <DailyMealsEditor state={state} set={set} />
        </div>
      </Section>

      <Section title="Blood parameters & inflammation">
        <div>
          <FieldLabel hint="Select any markers you have been tested for or have concerns about">Blood markers</FieldLabel>
          <ChipGroup
            options={[
              "Haemoglobin",
              "HbA1c",
              "Fasting glucose",
              "Cholesterol",
              "LDL",
              "HDL",
              "Triglycerides",
              "TSH",
              "T3/T4",
              "Vitamin D",
              "Vitamin B12",
              "Iron / Ferritin",
              "Uric acid",
              "CRP",
              "Homocysteine",
              "Insulin",
            ].map((v) => ({ value: v, label: v }))}
            value={state.bloodParameters}
            onChange={(v) => set("bloodParameters", v as string[])}
            multi
          />
        </div>
        <div>
          <FieldLabel>Known inflammation concerns?</FieldLabel>
          <YesNo value={state.inflammationConcerns} onChange={(v) => set("inflammationConcerns", v)} />
        </div>
      </Section>

      {!isChild && (
        <Section title="Lifestyle depth">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="sleepTime">Sleep time</Label>
              <Input
                id="sleepTime"
                type="time"
                value={state.sleepTime ?? ""}
                onChange={(e) => set("sleepTime", e.target.value)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="wakeTime">Wake up time</Label>
              <Input
                id="wakeTime"
                type="time"
                value={state.wakeTime ?? ""}
                onChange={(e) => set("wakeTime", e.target.value)}
                className="mt-2 h-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel>Daily steps</FieldLabel>
              <NumberStepper
                value={state.dailySteps}
                onChange={(v) => set("dailySteps", v)}
                min={0}
                max={50000}
                step={500}
              />
            </div>
            <div>
              <FieldLabel>Exercise duration</FieldLabel>
              <Segmented
                options={[
                  { value: "none", label: "None" },
                  { value: "15_30", label: "15–30 min" },
                  { value: "30_45", label: "30–45 min" },
                  { value: "45_60", label: "45–60 min" },
                  { value: "60_plus", label: "60+ min" },
                ]}
                value={state.exerciseDuration}
                onChange={(v) => set("exerciseDuration", v)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="exerciseType">Exercise type</Label>
            <Input
              id="exerciseType"
              value={state.exerciseType ?? ""}
              onChange={(e) => set("exerciseType", e.target.value)}
              placeholder="Yoga, walking, gym..."
              className="mt-2 h-12"
            />
          </div>
          <div>
            <FieldLabel>Exercise frequency</FieldLabel>
            <Segmented
              options={[
                { value: "daily", label: "Daily" },
                { value: "4_5_wk", label: "4–5x/wk" },
                { value: "2_3_wk", label: "2–3x/wk" },
                { value: "rarely", label: "Rarely" },
              ]}
              value={state.exerciseFrequency}
              onChange={(v) => set("exerciseFrequency", v)}
            />
          </div>
          <div>
            <FieldLabel hint="5 = very high stress">Stress level (1–5)</FieldLabel>
            <Rating value={state.stress} onChange={(n) => set("stress", n)} />
          </div>
          <div>
            <FieldLabel>Primary stress source</FieldLabel>
            <Segmented
              options={[
                { value: "work", label: "Work" },
                { value: "family", label: "Family" },
                { value: "health", label: "Health" },
                { value: "financial", label: "Financial" },
                { value: "multiple", label: "Multiple" },
              ]}
              value={state.stressSource}
              onChange={(v) => set("stressSource", v)}
            />
          </div>
          <div>
            <FieldLabel>Do you smoke?</FieldLabel>
            <YesNo value={state.smokingActive} onChange={(v) => set("smokingActive", v)} />
            {state.smokingActive ? (
              <Input
                placeholder="How often? (e.g. daily, occasionally)"
                value={state.smokingFreq ?? ""}
                onChange={(e) => set("smokingFreq", e.target.value)}
                className="mt-3 h-12"
              />
            ) : null}
          </div>
          <div>
            <FieldLabel>Do you drink alcohol?</FieldLabel>
            <YesNo value={state.alcoholActive} onChange={(v) => set("alcoholActive", v)} />
            {state.alcoholActive ? (
              <div className="mt-4 space-y-4">
                <div>
                  <FieldLabel>How often?</FieldLabel>
                  <Segmented
                    options={[
                      { value: "occasionally", label: "Occasionally" },
                      { value: "1-2x/week", label: "1–2x/week" },
                      { value: "3-5x/week", label: "3–5x/week" },
                      { value: "daily", label: "Daily" },
                    ]}
                    value={state.alcoholFreq as "occasionally" | "1-2x/week" | "3-5x/week" | "daily" | undefined}
                    onChange={(v) => set("alcoholFreq", v)}
                  />
                </div>
                <div>
                  <FieldLabel>How much in one sitting?</FieldLabel>
                  <Segmented
                    options={[
                      { value: "1-2 drinks", label: "1–2 drinks" },
                      { value: "3-4 drinks", label: "3–4 drinks" },
                      { value: "5-6 drinks", label: "5–6 drinks" },
                      { value: "7+ drinks", label: "7+ drinks" },
                    ]}
                    value={state.alcoholDrinksPerSession as "1-2 drinks" | "3-4 drinks" | "5-6 drinks" | "7+ drinks" | undefined}
                    onChange={(v) => set("alcoholDrinksPerSession", v)}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel>Shift work?</FieldLabel>
              <YesNo value={state.shiftWork} onChange={(v) => set("shiftWork", v)} />
            </div>
            <div>
              <FieldLabel>Travel frequency</FieldLabel>
              <Segmented
                options={[
                  { value: "rare", label: "Rare" },
                  { value: "monthly", label: "Monthly" },
                  { value: "weekly", label: "Weekly" },
                ]}
                value={state.travelFrequency}
                onChange={(v) => set("travelFrequency", v)}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Wellness rituals</FieldLabel>
            <ChipGroup
              options={[
                "daily sunlight exposure",
                "cold water shower",
                "soak dals / millets / nuts",
              ].map((v) => ({ value: v, label: v }))}
              value={state.wellnessRituals}
              onChange={(v) => set("wellnessRituals", v as string[])}
              multi
            />
          </div>
        </Section>
      )}

      {state.branch === "female" && <FemaleSection state={state} set={set} />}
      {state.branch === "male" && <MaleSection state={state} set={set} />}
      {state.branch === "child" && <ChildSection state={state} set={set} />}

      <Section title="Goals & expectations">
        <div>
          <Label htmlFor="pastAttempts">What have you tried before?</Label>
          <Textarea
            id="pastAttempts"
            rows={3}
            maxLength={500}
            placeholder="Diets, programs, apps..."
            value={state.pastAttempts ?? ""}
            onChange={(e) => set("pastAttempts", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="pastAttemptsOutcome">What worked / didn't work?</Label>
          <Textarea
            id="pastAttemptsOutcome"
            rows={3}
            maxLength={500}
            placeholder="Share your experience..."
            value={state.pastAttemptsOutcome ?? ""}
            onChange={(e) => set("pastAttemptsOutcome", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="biggestChallenge">Biggest challenge with food or health</Label>
          <Textarea
            id="biggestChallenge"
            rows={3}
            maxLength={500}
            placeholder="Be honest — this helps us help you"
            value={state.biggestChallenge ?? ""}
            onChange={(e) => set("biggestChallenge", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="programExpectations">Expectations from this program</Label>
          <Textarea
            id="programExpectations"
            rows={3}
            maxLength={500}
            placeholder="What does success look like for you?"
            value={state.programExpectations ?? ""}
            onChange={(e) => set("programExpectations", e.target.value)}
            className="mt-2"
          />
        </div>
      </Section>

      <Section title="Anything else">
        <Textarea
          rows={4}
          maxLength={240}
          placeholder="Anything you want our team to know (max 240 characters)."
          value={state.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Section>
    </div>
  );
}

function MedicationsEditor({ state, set }: { state: WizardState; set: SetFn }) {
  const meds = state.medications;
  const update = (i: number, patch: Partial<{ name: string; frequency: string }>) => {
    const next = meds.map((m, idx) => (idx === i ? { ...m, ...patch } : m));
    set("medications", next);
  };
  const add = () => set("medications", [...meds, { name: "" }]);
  const remove = (i: number) => set("medications", meds.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {meds.length === 0 ? (
        <p className="text-sm text-muted-foreground">None added yet.</p>
      ) : null}
      {meds.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="h-11 min-w-0 flex-[3]"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <Input
            className="h-11 min-w-0 flex-[2]"
            placeholder="Freq."
            value={m.frequency ?? ""}
            onChange={(e) => update(i, { frequency: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-1 text-sm text-muted-foreground hover:text-destructive"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add}>
        + Add medication
      </Button>
    </div>
  );
}

const MEAL_SLOTS = [
  ["breakfast", "Breakfast", "What do you usually eat?"],
  ["midMorning", "Mid-Morning", "Snack or fruit?"],
  ["lunch", "Lunch", "What do you usually eat?"],
  ["evening", "Evening", "Evening snack?"],
  ["dinner", "Dinner", "What do you usually eat?"],
  ["postDinner", "Post-Dinner", "Anything after dinner?"],
] as const;

function DailyMealsEditor({ state, set }: { state: WizardState; set: SetFn }) {
  const meals = state.dailyMeals;
  const update = (
    key: (typeof MEAL_SLOTS)[number][0],
    patch: Partial<{ time: string; description: string }>,
  ) => {
    set("dailyMeals", { ...meals, [key]: { ...meals[key], ...patch } });
  };
  return (
    <div className="space-y-4">
      {MEAL_SLOTS.map(([key, label, placeholder]) => (
        <div key={key} className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="flex gap-2">
            <Input
              type="time"
              className="h-11 w-[7.5rem] shrink-0"
              value={meals[key].time ?? ""}
              onChange={(e) => update(key, { time: e.target.value })}
            />
            <Input
              className="h-11 min-w-0 flex-1"
              placeholder={placeholder}
              value={meals[key].description ?? ""}
              onChange={(e) => update(key, { description: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function OncologyStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="cancerDiagnosis">Cancer diagnosis</Label>
          <Input
            id="cancerDiagnosis"
            value={state.cancerDiagnosis ?? ""}
            onChange={(e) => set("cancerDiagnosis", e.target.value)}
            className="mt-2 h-12"
          />
        </div>
        <div>
          <Label htmlFor="cancerType">Type of cancer</Label>
          <Input
            id="cancerType"
            value={state.cancerType ?? ""}
            onChange={(e) => set("cancerType", e.target.value)}
            className="mt-2 h-12"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="cancerDiagnosisDate">Date of diagnosis</Label>
        <Input
          id="cancerDiagnosisDate"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={state.cancerDiagnosisDate ?? ""}
          onChange={(e) => set("cancerDiagnosisDate", e.target.value)}
          className="mt-2 h-12"
        />
      </div>
      <div>
        <FieldLabel>Current treatment</FieldLabel>
        <ChipGroup
          options={[
            { value: "chemotherapy", label: "Chemotherapy" },
            { value: "radiation", label: "Radiation" },
            { value: "immunotherapy", label: "Immunotherapy" },
            { value: "surgery", label: "Surgery" },
            { value: "bone_marrow_transplant", label: "Bone marrow transplant" },
            { value: "other", label: "Other" },
          ]}
          value={state.cancerTreatment}
          onChange={(v) => set("cancerTreatment", v as string[])}
          multi
        />
      </div>
      <div>
        <Label htmlFor="treatmentStage">Treatment cycle / stage</Label>
        <Input
          id="treatmentStage"
          value={state.treatmentStage ?? ""}
          onChange={(e) => set("treatmentStage", e.target.value)}
          className="mt-2 h-12"
        />
      </div>
      <div>
        <FieldLabel>Treatment-related symptoms</FieldLabel>
        <ChipGroup
          options={[
            { value: "loss_of_appetite", label: "Loss of appetite" },
            { value: "nausea", label: "Nausea" },
            { value: "vomiting", label: "Vomiting" },
            { value: "taste_changes", label: "Taste changes" },
            { value: "mouth_sores", label: "Mouth sores" },
            { value: "dry_mouth", label: "Dry mouth" },
            { value: "difficulty_swallowing", label: "Difficulty swallowing" },
            { value: "early_satiety", label: "Early satiety" },
            { value: "food_aversion", label: "Food aversion" },
            { value: "diarrhea", label: "Diarrhea" },
            { value: "constipation", label: "Constipation" },
            { value: "fatigue", label: "Fatigue" },
            { value: "weight_loss", label: "Weight loss" },
            { value: "weight_gain", label: "Weight gain" },
          ]}
          value={state.treatmentSymptoms}
          onChange={(v) => set("treatmentSymptoms", v as string[])}
          multi
        />
      </div>
      <div>
        <Label htmlFor="eatingPatternChanges">Eating pattern changes after treatment</Label>
        <Textarea
          id="eatingPatternChanges"
          rows={3}
          value={state.eatingPatternChanges ?? ""}
          onChange={(e) => set("eatingPatternChanges", e.target.value)}
          className="mt-2"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="treatmentFoodPreferences">Food preferences during treatment</Label>
          <Textarea
            id="treatmentFoodPreferences"
            rows={3}
            value={state.treatmentFoodPreferences ?? ""}
            onChange={(e) => set("treatmentFoodPreferences", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="treatmentFoodIntolerances">Food intolerances during treatment</Label>
          <Textarea
            id="treatmentFoodIntolerances"
            rows={3}
            value={state.treatmentFoodIntolerances ?? ""}
            onChange={(e) => set("treatmentFoodIntolerances", e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="oncologySupplements">Nutritional supplements</Label>
        <Textarea
          id="oncologySupplements"
          rows={2}
          value={state.oncologySupplements ?? ""}
          onChange={(e) => set("oncologySupplements", e.target.value)}
          className="mt-2"
        />
      </div>
      <div>
        <FieldLabel>Tube feeding?</FieldLabel>
        <YesNo value={state.tubeFeeding} onChange={(v) => set("tubeFeeding", v)} />
      </div>
      <div>
        <FieldLabel>Food safety concerns</FieldLabel>
        <ChipGroup
          options={[
            { value: "raw_sprouts", label: "Raw sprouts" },
            { value: "street_food", label: "Street food" },
            { value: "raw_eggs", label: "Raw eggs" },
            { value: "unpasteurized_dairy", label: "Unpasteurized dairy" },
            { value: "none", label: "None" },
          ]}
          value={state.foodSafetyConcerns}
          onChange={(v) => set("foodSafetyConcerns", v as string[])}
          multi
        />
      </div>
    </div>
  );
}

function FertilityStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>How long trying to conceive?</FieldLabel>
        <Segmented
          options={[
            { value: "under_6mo", label: "< 6 months" },
            { value: "6_12mo", label: "6–12 months" },
            { value: "1_2yr", label: "1–2 years" },
            { value: "2yr_plus", label: "2+ years" },
          ]}
          value={state.fertilityTryingDuration}
          onChange={(v) => set("fertilityTryingDuration", v)}
        />
      </div>
      <div>
        <FieldLabel>Fertility treatments</FieldLabel>
        <Segmented
          options={[
            { value: "none", label: "None" },
            { value: "iui", label: "IUI" },
            { value: "ivf", label: "IVF" },
            { value: "other", label: "Other" },
          ]}
          value={state.fertilityTreatment}
          onChange={(v) => set("fertilityTreatment", v)}
        />
      </div>
      <div>
        <Label htmlFor="fertilityConditions">Diagnosed fertility conditions</Label>
        <Textarea
          id="fertilityConditions"
          rows={3}
          maxLength={300}
          placeholder="e.g. Low AMH, endometriosis..."
          value={state.fertilityConditions ?? ""}
          onChange={(e) => set("fertilityConditions", e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}

function PregnancyStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">Expected due date</Label>
          <Input
            id="dueDate"
            type="date"
            value={state.dueDate ?? ""}
            onChange={(e) => set("dueDate", e.target.value)}
            className="mt-2 h-12"
          />
        </div>
        <div>
          <FieldLabel>Pre-pregnancy weight</FieldLabel>
          <NumberStepper
            value={state.prePregnancyWeightKg}
            onChange={(v) => set("prePregnancyWeightKg", v)}
            min={2}
            max={300}
            step={0.5}
            suffix="kg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Gestational diabetes?</FieldLabel>
          <YesNo value={state.gestationalDiabetes} onChange={(v) => set("gestationalDiabetes", v)} />
        </div>
        <div>
          <FieldLabel>Pregnancy-induced hypertension?</FieldLabel>
          <YesNo
            value={state.pregnancyInducedHypertension}
            onChange={(v) => set("pregnancyInducedHypertension", v)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>High-risk pregnancy?</FieldLabel>
          <YesNo value={state.highRiskPregnancy} onChange={(v) => set("highRiskPregnancy", v)} />
        </div>
        <div>
          <FieldLabel>Previous pregnancies</FieldLabel>
          <NumberStepper
            value={state.previousPregnanciesCount}
            onChange={(v) => set("previousPregnanciesCount", v)}
            min={0}
            max={20}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="prenatalSupplements">Prenatal vitamins / supplements</Label>
        <Input
          id="prenatalSupplements"
          value={state.prenatalSupplements ?? ""}
          onChange={(e) => set("prenatalSupplements", e.target.value)}
          placeholder="e.g. Folic acid, iron, calcium"
          className="mt-2 h-12"
        />
      </div>
      <div>
        <FieldLabel>Pregnancy symptoms</FieldLabel>
        <ChipGroup
          options={[
            "nausea / vomiting",
            "heartburn",
            "constipation",
            "swelling",
            "food cravings",
            "food aversions",
          ].map((v) => ({ value: v, label: v }))}
          value={state.pregnancySymptoms}
          onChange={(v) => set("pregnancySymptoms", v as string[])}
          multi
        />
      </div>
    </div>
  );
}

function LactationStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="breastfeedingDifficulties">Breastfeeding difficulties</Label>
        <Textarea
          id="breastfeedingDifficulties"
          rows={3}
          value={state.breastfeedingDifficulties ?? ""}
          onChange={(e) => set("breastfeedingDifficulties", e.target.value)}
          className="mt-2"
        />
      </div>
      <div>
        <FieldLabel>Supplementing with formula?</FieldLabel>
        <YesNo
          value={state.formulaSupplementing}
          onChange={(v) => set("formulaSupplementing", v)}
        />
      </div>
    </div>
  );
}

function FemaleSection({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <Section title="Women's health (confidential)">
      <div>
        <FieldLabel>Periods status</FieldLabel>
        <Segmented
          options={[
            { value: "regular", label: "Regular" },
            { value: "irregular", label: "Irregular" },
            { value: "absent", label: "Absent" },
            { value: "menopausal", label: "Menopausal" },
          ]}
          value={state.periodsStatus}
          onChange={(v) => set("periodsStatus", v)}
        />
      </div>
      <div>
        <Label htmlFor="lastPeriodDate">Last period date</Label>
        <Input
          id="lastPeriodDate"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={state.lastPeriodDate ?? ""}
          onChange={(e) => set("lastPeriodDate", e.target.value)}
          className="mt-2 h-12"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Cycle length</FieldLabel>
          <NumberStepper
            value={state.cycleLengthDays}
            onChange={(v) => set("cycleLengthDays", v)}
            min={10}
            max={90}
            suffix="days"
          />
        </div>
        <div>
          <FieldLabel>Period days</FieldLabel>
          <NumberStepper
            value={state.periodDays}
            onChange={(v) => set("periodDays", v)}
            min={1}
            max={15}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Flow</FieldLabel>
        <ChipGroup
          options={["light", "moderate", "heavy", "very_heavy", "clots"].map((v) => ({
            value: v,
            label: v.replace("_", " "),
          }))}
          value={state.flow}
          onChange={(v) => set("flow", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel>PMS symptoms</FieldLabel>
        <ChipGroup
          options={[
            "mood swings",
            "cramps",
            "bloating",
            "breast tenderness",
            "headaches",
            "cravings",
            "fatigue",
          ].map((v) => ({ value: v, label: v }))}
          value={state.pmsSymptoms}
          onChange={(v) => set("pmsSymptoms", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel hint="5 = very severe pain">Pain severity (1–5)</FieldLabel>
        <Rating value={state.painSeverity} onChange={(n) => set("painSeverity", n)} />
      </div>
      <div>
        <FieldLabel>Pain medication for periods?</FieldLabel>
        <YesNo value={state.periodPainMeds} onChange={(v) => set("periodPainMeds", v)} />
      </div>
      <div>
        <FieldLabel>Keyhole surgery / laparoscopy for endometriosis?</FieldLabel>
        <YesNo value={state.endometriosisSurgery} onChange={(v) => set("endometriosisSurgery", v)} />
      </div>
      <div>
        <FieldLabel>Hysterectomy?</FieldLabel>
        <YesNo value={state.hysterectomy} onChange={(v) => set("hysterectomy", v)} />
      </div>
      <div>
        <FieldLabel>On hormonal intervention?</FieldLabel>
        <YesNo value={state.hormonalActive} onChange={(v) => set("hormonalActive", v)} />
        {state.hormonalActive ? (
          <div className="mt-3">
            <ChipGroup
              options={[
                { value: "ocp", label: "OCPs" },
                { value: "hormonal_iud", label: "Hormonal IUD" },
                { value: "hrt", label: "HRT" },
                { value: "fertility_meds", label: "Fertility meds" },
                { value: "none", label: "None" },
              ]}
              value={state.hormonalTypes}
              onChange={(v) => set("hormonalTypes", v as string[])}
              multi
            />
          </div>
        ) : null}
      </div>
      {state.pregnancyStatus === "pregnant" ? (
        <div>
          <FieldLabel>Trimester</FieldLabel>
          <Segmented
            options={[
              { value: "first", label: "1st trimester" },
              { value: "second", label: "2nd trimester" },
              { value: "third", label: "3rd trimester" },
            ]}
            value={state.trimester}
            onChange={(v) => set("trimester", v)}
          />
        </div>
      ) : null}
      <div>
        <FieldLabel>Menopause reached?</FieldLabel>
        <YesNo
          value={state.menopauseReached}
          onChange={(v) => set("menopauseReached", v)}
        />
        {state.menopauseReached ? (
          <div className="mt-3 space-y-4">
            <div>
              <FieldLabel>Age at menopause</FieldLabel>
              <NumberStepper
                value={state.menopauseAgeAt}
                onChange={(v) => set("menopauseAgeAt", v)}
                min={20}
                max={80}
              />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <Segmented
                options={[
                  { value: "natural", label: "Natural" },
                  { value: "induced_surgical", label: "Induced — surgical" },
                  { value: "induced_medical", label: "Induced — medical" },
                ]}
                value={state.menopauseType}
                onChange={(v) => set("menopauseType", v)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function MaleSection({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <Section title="Men's health (confidential)">
      <div>
        <FieldLabel>Urinary symptoms</FieldLabel>
        <ChipGroup
          options={[
            "frequency",
            "urgency",
            "hesitancy",
            "nocturia",
            "incomplete_emptying",
            "none",
          ].map((v) => ({ value: v, label: v.replace("_", " ") }))}
          value={state.urinarySymptoms}
          onChange={(v) => set("urinarySymptoms", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel hint="5 = very high libido">Libido (1–5)</FieldLabel>
        <Rating value={state.libido} onChange={(n) => set("libido", n)} />
      </div>
      <div>
        <FieldLabel>Erectile concerns?</FieldLabel>
        <YesNo
          value={state.erectileConcerns}
          onChange={(v) => set("erectileConcerns", v)}
        />
      </div>
      <div>
        <FieldLabel>Testosterone status</FieldLabel>
        <Segmented
          options={[
            { value: "not_tested", label: "Not tested" },
            { value: "normal", label: "Normal" },
            { value: "low", label: "Low" },
            { value: "high", label: "High" },
            { value: "unsure", label: "Unsure" },
          ]}
          value={state.testosteroneStatus}
          onChange={(v) => set("testosteroneStatus", v)}
        />
      </div>
      <div>
        <FieldLabel>Testosterone replacement?</FieldLabel>
        <YesNo value={state.trtUse} onChange={(v) => set("trtUse", v)} />
      </div>
      <div>
        <FieldLabel>Anabolic / performance enhancers</FieldLabel>
        <Segmented
          options={[
            { value: "never", label: "Never" },
            { value: "past", label: "Past" },
            { value: "current", label: "Current" },
          ]}
          value={state.steroidStatus}
          onChange={(v) => set("steroidStatus", v)}
        />
      </div>
      <div>
        <FieldLabel>Prostate concerns?</FieldLabel>
        <YesNo
          value={state.prostateConcerns}
          onChange={(v) => set("prostateConcerns", v)}
        />
      </div>
    </Section>
  );
}

function InfantFeedingStepContent({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Breastfed?</FieldLabel>
          <YesNo value={state.breastfed} onChange={(v) => set("breastfed", v)} />
          {state.breastfed ? (
            <NumberStepper
              value={state.breastfeedingDurationMonths}
              onChange={(v) => set("breastfeedingDurationMonths", v)}
              min={0}
              max={60}
              suffix="months"
            />
          ) : null}
        </div>
        <div>
          <FieldLabel>Formula fed?</FieldLabel>
          <YesNo value={state.formulaFed} onChange={(v) => set("formulaFed", v)} />
        </div>
      </div>
      <div>
        <FieldLabel>Age of starting solids</FieldLabel>
        <NumberStepper
          value={state.solidsStartAgeMonths}
          onChange={(v) => set("solidsStartAgeMonths", v)}
          min={0}
          max={24}
          suffix="months"
        />
      </div>
      <div>
        <Label htmlFor="feedingDifficulties">Feeding difficulties</Label>
        <Textarea
          id="feedingDifficulties"
          rows={3}
          placeholder="Any difficulties with breast/bottle/solid feeding..."
          value={state.feedingDifficulties ?? ""}
          onChange={(e) => set("feedingDifficulties", e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}

function ChildSection({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <Section title="Child-specific">
      <div>
        <FieldLabel>Birth weight</FieldLabel>
        <NumberStepper
          value={state.birthWeightKg}
          onChange={(v) => set("birthWeightKg", v)}
          min={0.3}
          max={10}
          step={0.1}
          suffix="kg"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Weight-for-age percentile</FieldLabel>
          <NumberStepper
            value={state.weightForAgePercentile}
            onChange={(v) => set("weightForAgePercentile", v)}
            min={0}
            max={100}
            suffix="%ile"
          />
        </div>
        <div>
          <FieldLabel>Height-for-age percentile</FieldLabel>
          <NumberStepper
            value={state.heightForAgePercentile}
            onChange={(v) => set("heightForAgePercentile", v)}
            min={0}
            max={100}
            suffix="%ile"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="motherMedicalHistory">Mother's medical history</Label>
          <Textarea
            id="motherMedicalHistory"
            rows={3}
            value={state.motherMedicalHistory ?? ""}
            onChange={(e) => set("motherMedicalHistory", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="fatherMedicalHistory">Father's medical history</Label>
          <Textarea
            id="fatherMedicalHistory"
            rows={3}
            value={state.fatherMedicalHistory ?? ""}
            onChange={(e) => set("fatherMedicalHistory", e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
      <div>
        <Label>School grade</Label>
        <Input
          value={state.schoolGrade ?? ""}
          onChange={(e) => set("schoolGrade", e.target.value)}
          className="mt-2 h-11"
          placeholder="e.g. Grade 5"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel hint="5 = excellent stamina">Stamina (1–5)</FieldLabel>
          <Rating value={state.stamina} onChange={(n) => set("stamina", n)} />
        </div>
        <div>
          <FieldLabel hint="5 = excellent attention span">Attention span (1–5)</FieldLabel>
          <Rating value={state.attentionSpan} onChange={(n) => set("attentionSpan", n)} />
        </div>
        <div>
          <FieldLabel hint="5 = excellent memory">Memory (1–5)</FieldLabel>
          <Rating value={state.memory} onChange={(n) => set("memory", n)} />
        </div>
        <div>
          <FieldLabel hint="5 = excellent focus">Focus (1–5)</FieldLabel>
          <Rating value={state.focus} onChange={(n) => set("focus", n)} />
        </div>
        <div>
          <FieldLabel hint="5 = extremely picky">Picky eater (1–5)</FieldLabel>
          <Rating value={state.pickyEater} onChange={(n) => set("pickyEater", n)} />
        </div>
      </div>
      <div>
        <FieldLabel>Feeding concerns</FieldLabel>
        <ChipGroup
          options={[
            { value: "poor_appetite", label: "Poor appetite" },
            { value: "food_allergies", label: "Food allergies" },
            { value: "underweight", label: "Underweight" },
            { value: "developmental_concerns_asd", label: "Developmental concerns (ASD)" },
          ]}
          value={state.feedingConcerns}
          onChange={(v) => set("feedingConcerns", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel>Appetite</FieldLabel>
        <Segmented
          options={[
            { value: "poor", label: "Poor" },
            { value: "variable", label: "Variable" },
            { value: "good", label: "Good" },
            { value: "very_good", label: "Very good" },
            { value: "excessive", label: "Excessive" },
          ]}
          value={state.appetite}
          onChange={(v) => set("appetite", v)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Sports per week</FieldLabel>
          <NumberStepper
            value={state.sportsPerWeek}
            onChange={(v) => set("sportsPerWeek", v)}
            min={0}
            max={21}
          />
        </div>
        <div>
          <FieldLabel>Screen time (hrs/day)</FieldLabel>
          <NumberStepper
            value={state.screenTimeHrs}
            onChange={(v) => set("screenTimeHrs", v)}
            min={0}
            max={24}
            step={0.5}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Sports timing</FieldLabel>
        <ChipGroup
          options={[
            { value: "morning", label: "Morning" },
            { value: "afternoon", label: "Afternoon" },
            { value: "evening", label: "Evening" },
          ]}
          value={state.sportsTiming}
          onChange={(v) => set("sportsTiming", v as string[])}
          multi
        />
      </div>
      <div>
        <FieldLabel>Outdoor sports</FieldLabel>
        <ChipGroup
          options={[
            "football",
            "cricket",
            "tennis",
            "swimming",
            "cycling",
            "running",
            "basketball",
          ].map((v) => ({ value: v, label: v }))}
          value={state.outdoorSports}
          onChange={(v) => set("outdoorSports", v as string[])}
          multi
          allowOther
        />
      </div>
      <div>
        <FieldLabel>Indoor activities</FieldLabel>
        <ChipGroup
          options={["yoga", "dance", "martial arts", "table tennis", "chess"].map((v) => ({
            value: v,
            label: v,
          }))}
          value={state.indoorSports}
          onChange={(v) => set("indoorSports", v as string[])}
          multi
          allowOther
        />
      </div>
      <div>
        <FieldLabel>Packaged / processed food</FieldLabel>
        <Segmented
          options={[
            { value: "rarely", label: "Rarely" },
            { value: "1-2_wk", label: "1–2/wk" },
            { value: "3-5_wk", label: "3–5/wk" },
            { value: "daily", label: "Daily" },
            { value: "multi_daily", label: "Multiple/day" },
          ]}
          value={state.childPackagedFoodFrequency}
          onChange={(v) => set("childPackagedFoodFrequency", v)}
        />
      </div>
      <div>
        <FieldLabel>Growth concerns</FieldLabel>
        <ChipGroup
          options={[
            "height",
            "weight gain",
            "weight loss",
            "delayed milestones",
            "poor weight gain",
            "underweight",
            "overweight",
            "obesity",
            "poor appetite",
            "picky eating",
            "digestive issues",
            "none",
          ].map((v) => ({ value: v, label: v }))}
          value={state.growthConcerns}
          onChange={(v) => set("growthConcerns", v as string[])}
          multi
        />
      </div>
    </Section>
  );
}
