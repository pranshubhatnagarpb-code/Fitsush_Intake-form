import type { SubmissionInput } from "@/lib/intake/schema";

export type WizardBranch = "female" | "male" | "child";

export type WizardState = {
  // step 0
  branch?: WizardBranch;
  isChild?: boolean;
  // identity / contact
  fullName: string;
  dob?: string;
  age?: number;
  city: string;
  phone?: string;
  email?: string;
  // child guardian
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  // consent
  consent: boolean;
  // required
  primaryGoal?: string;
  chiefComplaints: string[];
  weightKg?: number;
  heightCm?: number;
  sleepHours?: number;
  waterIntake?: "<1L" | "1-2L" | "2-3L" | "3L+";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  screenTimeHrs?: number;
  // symptom ratings (required — all 6)
  rSleep?: number;
  rDigestion?: number;
  rEnergy?: number;
  rFatigue?: number;
  rSkin?: number;
  rHair?: number;
  // optional common
  medicalHistory: string[];
  familyHistory: string[];
  medications: { name: string; frequency?: string }[];
  // digestion detail
  bowelFrequency?: string;
  stoolConsistency: string[];
  bloatingTiming: string[];
  acidityTriggers: string[];
  acidityRating?: number;
  bloatingRating?: number;
  // blood / inflammation
  bloodParameters: string[];
  inflammationConcerns?: boolean;
  // food pattern
  dietType?: "veg" | "non_veg" | "eggetarian" | "vegan" | "jain";
  cuisines: string[];
  mealsPerDay?: number;
  eatsOutPerWeek?: number;
  packagedFoodFrequency?: "rarely" | "1-2_wk" | "3-5_wk" | "daily" | "multi_daily";
  sugarDrinks?: boolean;
  teaCoffeePerDay?: number;
  // lifestyle depth (adults)
  stress?: number;
  smokingActive?: boolean;
  smokingFreq?: string;
  alcoholActive?: boolean;
  alcoholFreq?: string;
  shiftWork?: boolean;
  travelFrequency?: string;
  notes?: string;
  // female
  periodsStatus?: "regular" | "irregular" | "absent" | "menopausal";
  cycleLengthDays?: number;
  flow: string[];
  periodDays?: number;
  pmsSymptoms: string[];
  painSeverity?: number;
  periodPainMeds?: boolean;
  endometriosisSurgery?: boolean;
  hormonalActive?: boolean;
  hormonalTypes: string[];
  pregnancyStatus?: "none" | "trying" | "pregnant" | "lactating";
  trimester?: "first" | "second" | "third";
  menopauseReached?: boolean;
  menopauseAgeAt?: number;
  menopauseType?: "natural" | "induced_surgical" | "induced_medical";
  hysterectomy?: boolean;
  // male
  urinarySymptoms: string[];
  libido?: number;
  erectileConcerns?: boolean;
  testosteroneStatus?: "not_tested" | "normal" | "low" | "high" | "unsure";
  trtUse?: boolean;
  steroidStatus?: "never" | "past" | "current";
  prostateConcerns?: boolean;
  // child
  schoolGrade?: string;
  stamina?: number;
  attentionSpan?: number;
  memory?: number;
  focus?: number;
  appetite?: "poor" | "variable" | "good" | "very_good" | "excessive";
  pickyEater?: number;
  sportsPerWeek?: number;
  sportsTiming: string[];
  outdoorSports: string[];
  indoorSports: string[];
  childPackagedFoodFrequency?: "rarely" | "1-2_wk" | "3-5_wk" | "daily" | "multi_daily";
  growthConcerns: string[];
};

export const initialState: WizardState = {
  fullName: "",
  city: "",
  consent: false,
  chiefComplaints: [],
  medicalHistory: [],
  familyHistory: [],
  medications: [],
  stoolConsistency: [],
  bloatingTiming: [],
  acidityTriggers: [],
  bloodParameters: [],
  cuisines: [],
  flow: [],
  pmsSymptoms: [],
  hormonalTypes: [],
  urinarySymptoms: [],
  sportsTiming: [],
  outdoorSports: [],
  indoorSports: [],
  growthConcerns: [],
};

const stripEmpty = <T extends object>(obj: T): T | undefined => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const s = stripEmpty(v as object);
      if (s) out[k] = s;
    } else {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? (out as T) : undefined;
};

export function buildPayload(s: WizardState): SubmissionInput {
  if (!s.branch) throw new Error("Branch is required");
  if (!s.primaryGoal) throw new Error("Primary goal is required");
  if (!s.waterIntake) throw new Error("Water intake is required");
  if (!s.activityLevel) throw new Error("Activity level is required");

  const required = {
    fullName: s.fullName.trim(),
    dob: s.dob || undefined,
    age: s.age,
    city: s.city.trim(),
    consent: true as const,
    primaryGoal: s.primaryGoal as never,
    chiefComplaints: s.chiefComplaints,
    body: { weightKg: s.weightKg!, heightCm: s.heightCm! },
    lifestyle: {
      sleepHours: s.sleepHours!,
      waterIntake: s.waterIntake,
      activityLevel: s.activityLevel,
    },
    symptoms: {
      sleep: s.rSleep!,
      digestion: s.rDigestion!,
      energy: s.rEnergy!,
      fatigue: s.rFatigue!,
      skin: s.rSkin!,
      hair: s.rHair!,
    },
  };

  const optionalCommon = stripEmpty({
    medicalHistory: s.medicalHistory,
    familyHistory: s.familyHistory,
    medications: s.medications.filter((m) => m.name.trim().length > 0),
    digestion: stripEmpty({
      bowelFrequency: s.bowelFrequency,
      stoolConsistency: s.stoolConsistency,
      bloatingTiming: s.bloatingTiming,
      acidityTriggers: s.acidityTriggers,
      acidityRating: s.acidityRating,
      bloatingRating: s.bloatingRating,
    }),
    foodPattern: stripEmpty({
      dietType: s.dietType,
      cuisines: s.cuisines,
      mealsPerDay: s.mealsPerDay,
      eatsOutPerWeek: s.eatsOutPerWeek,
      packagedFoodFrequency: s.packagedFoodFrequency,
      sugarDrinks: s.sugarDrinks,
      teaCoffeePerDay: s.teaCoffeePerDay,
    }),
    lifestyleDepth: stripEmpty({
      stress: s.stress,
      screenTimeHrs: s.screenTimeHrs,
      smoking:
        s.smokingActive !== undefined
          ? { active: s.smokingActive, frequency: s.smokingFreq }
          : undefined,
      alcohol:
        s.alcoholActive !== undefined
          ? { active: s.alcoholActive, frequency: s.alcoholFreq }
          : undefined,
      shiftWork: s.shiftWork,
      travelFrequency: s.travelFrequency,
    }),
    bloodParameters: s.bloodParameters,
    inflammationConcerns: s.inflammationConcerns,
    notes: s.notes,
  });

  if (s.branch === "child") {
    const childOptional = stripEmpty({
      schoolGrade: s.schoolGrade,
      stamina: s.stamina,
      attentionSpan: s.attentionSpan,
      memory: s.memory,
      focus: s.focus,
      appetite: s.appetite,
      pickyEater: s.pickyEater,
      sportsPerWeek: s.sportsPerWeek,
      sportsTiming: s.sportsTiming,
      outdoorSports: s.outdoorSports,
      indoorSports: s.indoorSports,
      screenTimeHrs: s.screenTimeHrs,
      packagedFoodFrequency: s.childPackagedFoodFrequency,
      growthConcerns: s.growthConcerns,
    });
    const childCommon = optionalCommon
      ? (() => {
          // child branch schema omits lifestyleDepth
          const { lifestyleDepth: _omit, ...rest } = optionalCommon as Record<
            string,
            unknown
          >;
          return Object.keys(rest).length ? rest : undefined;
        })()
      : undefined;
    return {
      version: 1,
      branch: "child",
      guardian: {
        guardianName: (s.guardianName ?? "").trim(),
        guardianRelationship: (s.guardianRelationship ?? "").trim(),
        guardianPhone: (s.guardianPhone ?? "").trim(),
        guardianEmail: s.guardianEmail?.trim() || undefined,
      },
      required,
      optional: childCommon as never,
      child: childOptional as never,
    };
  }

  const contact = {
    phone: s.phone?.trim() || undefined,
    email: s.email?.trim() || undefined,
  };

  if (s.branch === "female") {
    const female = stripEmpty({
      periodsStatus: s.periodsStatus,
      cycleLengthDays: s.cycleLengthDays,
      flow: s.flow,
      periodDays: s.periodDays,
      pmsSymptoms: s.pmsSymptoms,
      painSeverity: s.painSeverity,
      periodPainMeds: s.periodPainMeds,
      endometriosisSurgery: s.endometriosisSurgery,
      hysterectomy: s.hysterectomy,
      hormonalIntervention:
        s.hormonalActive !== undefined
          ? { active: s.hormonalActive, types: s.hormonalTypes }
          : undefined,
      pregnancy: s.pregnancyStatus
        ? { status: s.pregnancyStatus, trimester: s.trimester }
        : undefined,
      menopause:
        s.menopauseReached !== undefined
          ? {
              reached: s.menopauseReached,
              ageAt: s.menopauseAgeAt,
              type: s.menopauseType,
            }
          : undefined,
    });
    return {
      version: 1,
      branch: "female",
      contact,
      required,
      optional: optionalCommon as never,
      female: female as never,
    };
  }

  // male
  const male = stripEmpty({
    urinarySymptoms: s.urinarySymptoms,
    libido: s.libido,
    erectileConcerns: s.erectileConcerns,
    testosteroneStatus: s.testosteroneStatus,
    trtUse: s.trtUse,
    steroidUse: s.steroidStatus ? { status: s.steroidStatus } : undefined,
    prostateConcerns: s.prostateConcerns,
  });
  return {
    version: 1,
    branch: "male",
    contact,
    required,
    optional: optionalCommon as never,
    male: male as never,
  };
}
