import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import {
  Chip,
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
        </div>
      ),
      validate: () =>
        !state.branch
          ? state.isChild
            ? null
            : "Pick who this is for and gender"
          : null,
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
                onChange={(e) => set("dob", e.target.value || undefined)}
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
                onChange={(e) =>
                  set("age", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-12"
              />
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
        </div>
      ),
      validate: () =>
        !state.sleepHours || !state.waterIntake || !state.activityLevel
          ? "Complete all three"
          : null,
    },
    {
      id: "symptoms",
      title: "How are you feeling lately?",
      subtitle: "1 = very poor, 5 = excellent.",
      render: () => (
        <div className="space-y-6">
          {([
            ["rSleep", "Sleep quality"],
            ["rDigestion", "Digestion"],
            ["rEnergy", "Daily energy"],
            ["rFatigue", "Fatigue level"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <FieldLabel required>{label}</FieldLabel>
              <Rating value={state[k] as number | undefined} onChange={(n) => set(k, n)} />
            </div>
          ))}
        </div>
      ),
      validate: () =>
        !state.rSleep || !state.rDigestion || !state.rEnergy || !state.rFatigue
          ? "Rate all four"
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

  const step = steps[stepIdx];
  const total = steps.length;
  const progress = ((stepIdx + 1) / total) * 100;

  const handleNext = async () => {
    const err = step.validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (stepIdx < total - 1) {
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
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Step {stepIdx + 1} of {total} ·{" "}
              {stepIdx === total - 1 ? "Optional" : "Required"}
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" /> Premium intake
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIdx === 0 || submitting}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft /> Back
          </Button>

          {stepIdx === total - 1 ? (
            <div className="flex items-center gap-2">
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

      <Section title="Digestion detail">
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
      </Section>

      <Section title="Food pattern">
        <div>
          <FieldLabel>Diet type</FieldLabel>
          <Segmented
            options={[
              { value: "veg", label: "Veg" },
              { value: "non_veg", label: "Non-veg" },
              { value: "eggetarian", label: "Eggetarian" },
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
            <FieldLabel>Tea / coffee per day</FieldLabel>
            <NumberStepper
              value={state.teaCoffeePerDay}
              onChange={(v) => set("teaCoffeePerDay", v)}
              min={0}
              max={20}
            />
          </div>
        </div>
      </Section>

      {!isChild && (
        <Section title="Lifestyle depth">
          <div>
            <FieldLabel>Stress level (1–5)</FieldLabel>
            <Rating value={state.stress} onChange={(n) => set("stress", n)} />
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
              <Input
                placeholder="How often?"
                value={state.alcoholFreq ?? ""}
                onChange={(e) => set("alcoholFreq", e.target.value)}
                className="mt-3 h-12"
              />
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
        </Section>
      )}

      {state.branch === "female" && <FemaleSection state={state} set={set} />}
      {state.branch === "male" && <MaleSection state={state} set={set} />}
      {state.branch === "child" && <ChildSection state={state} set={set} />}

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
        <div key={i} className="grid grid-cols-12 gap-2">
          <Input
            className="col-span-6 h-11"
            placeholder="Name"
            value={m.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <Input
            className="col-span-5 h-11"
            placeholder="Frequency"
            value={m.frequency ?? ""}
            onChange={(e) => update(i, { frequency: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="col-span-1 rounded-md text-sm text-muted-foreground hover:text-destructive"
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
        <FieldLabel>Pain severity (1–5)</FieldLabel>
        <Rating value={state.painSeverity} onChange={(n) => set("painSeverity", n)} />
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
      <div>
        <FieldLabel>Pregnancy / lactation</FieldLabel>
        <Segmented
          options={[
            { value: "none", label: "None" },
            { value: "trying", label: "Trying" },
            { value: "pregnant", label: "Pregnant" },
            { value: "lactating", label: "Lactating" },
          ]}
          value={state.pregnancyStatus}
          onChange={(v) => set("pregnancyStatus", v)}
        />
        {state.pregnancyStatus === "pregnant" ? (
          <div className="mt-3">
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
      </div>
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
        <FieldLabel>Libido (1–5)</FieldLabel>
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

function ChildSection({ state, set }: { state: WizardState; set: SetFn }) {
  return (
    <Section title="Child-specific">
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
          <FieldLabel>Stamina (1–5)</FieldLabel>
          <Rating value={state.stamina} onChange={(n) => set("stamina", n)} />
        </div>
        <div>
          <FieldLabel>Attention span (1–5)</FieldLabel>
          <Rating value={state.attentionSpan} onChange={(n) => set("attentionSpan", n)} />
        </div>
        <div>
          <FieldLabel>Focus (1–5)</FieldLabel>
          <Rating value={state.focus} onChange={(n) => set("focus", n)} />
        </div>
        <div>
          <FieldLabel>Picky eater (1–5)</FieldLabel>
          <Rating value={state.pickyEater} onChange={(n) => set("pickyEater", n)} />
        </div>
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
            value={state.childScreenTimeHrs}
            onChange={(v) => set("childScreenTimeHrs", v)}
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
