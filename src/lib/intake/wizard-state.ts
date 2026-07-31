import type { SubmissionInput } from "@/lib/intake/schema";

export type WizardBranch = "female" | "male" | "child";

export type WizardState = {
  // step 0
  branch?: WizardBranch;
  isChild?: boolean;
  childGender?: "male" | "female";
  // identity / contact
  fullName: string;
  dob?: string;
  age?: number;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  profession?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  childrenCount?: "none" | "1" | "2" | "3+";
  referredBy?: string;
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
  allergies?: string;
  surgicalHistory?: string;
  // oncology / cancer nutrition (any branch)
  hasCancerDiagnosis?: boolean;
  cancerDiagnosis?: string;
  cancerType?: string;
  cancerDiagnosisDate?: string;
  cancerTreatment: string[];
  treatmentStage?: string;
  treatmentSymptoms: string[];
  eatingPatternChanges?: string;
  treatmentFoodPreferences?: string;
  treatmentFoodIntolerances?: string;
  oncologySupplements?: string;
  tubeFeeding?: boolean;
  foodSafetyConcerns: string[];
  // body measurements & vitals
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
  targetWeightKg?: number;
  waistNavelCm?: number;
  waistThinnestCm?: number;
  hipCm?: number;
  neckCm?: number;
  bloodPressure?: string;
  pulseRate?: number;
  heaviestWeightKg?: number;
  lightestWeightKg?: number;
  weight6moAgoKg?: number;
  weight3yrAgoKg?: number;
  // digestion detail
  bowelFrequency?: string;
  stoolConsistency: string[];
  bloatingTiming: string[];
  acidityTriggers: string[];
  digestiveSymptoms: string[];
  acidityRating?: number;
  bloatingRating?: number;
  constipationRating?: number;
  dailyRituals: string[];
  lunchDuration?: "under_10" | "10_20" | "over_20";
  // blood / inflammation
  bloodParameters: string[];
  inflammationConcerns?: boolean;
  // food pattern
  dietType?: "veg" | "non_veg" | "eggetarian" | "vegan" | "jain" | "pescatarian";
  cuisines: string[];
  mealsPerDay?: number;
  eatsOutPerWeek?: number;
  packagedFoodFrequency?: "rarely" | "1-2_wk" | "3-5_wk" | "daily" | "multi_daily";
  sugarDrinks?: boolean;
  energyCarbonatedDrinks?: "never" | "rarely" | "sometimes" | "daily";
  teaCoffeePerDay?: number;
  teaCoffeeFirstCupTime?: string;
  homeCooked?: "yes" | "partially" | "rarely";
  whoCooks?: "self" | "family" | "cook_help" | "mix";
  cookingOil?: string;
  foodLikes?: string;
  foodDislikes?: string;
  cravings?: string;
  eatingSpeed?: "slow" | "moderate" | "fast";
  bingeEating?: "no" | "occasionally" | "frequently";
  dailyMeals: {
    breakfast: { time?: string; description?: string };
    midMorning: { time?: string; description?: string };
    lunch: { time?: string; description?: string };
    evening: { time?: string; description?: string };
    dinner: { time?: string; description?: string };
    postDinner: { time?: string; description?: string };
  };
  // lifestyle depth (adults)
  stress?: number;
  stressSource?: "work" | "family" | "health" | "financial" | "multiple";
  smokingActive?: boolean;
  smokingFreq?: string;
  alcoholActive?: boolean;
  alcoholFreq?: string;
  alcoholDrinksPerSession?: string;
  shiftWork?: boolean;
  travelFrequency?: string;
  sleepTime?: string;
  wakeTime?: string;
  dailySteps?: number;
  exerciseType?: string;
  exerciseDuration?: "none" | "15_30" | "30_45" | "45_60" | "60_plus";
  exerciseFrequency?: "daily" | "4_5_wk" | "2_3_wk" | "rarely";
  wellnessRituals: string[];
  notes?: string;
  // goals & expectations
  pastAttempts?: string;
  pastAttemptsOutcome?: string;
  biggestChallenge?: string;
  programExpectations?: string;
  // female
  periodsStatus?: "regular" | "irregular" | "absent" | "menopausal";
  lastPeriodDate?: string;
  cycleLengthDays?: number;
  flow: string[];
  periodDays?: number;
  pmsSymptoms: string[];
  fertilityTryingDuration?: "under_6mo" | "6_12mo" | "1_2yr" | "2yr_plus";
  fertilityTreatment?: "none" | "iui" | "ivf" | "other";
  fertilityConditions?: string;
  painSeverity?: number;
  periodPainMeds?: boolean;
  endometriosisSurgery?: boolean;
  hormonalActive?: boolean;
  hormonalTypes: string[];
  pregnancyStatus?: "none" | "trying" | "pregnant" | "lactating";
  trimester?: "first" | "second" | "third";
  dueDate?: string;
  prePregnancyWeightKg?: number;
  gestationalDiabetes?: boolean;
  pregnancyInducedHypertension?: boolean;
  highRiskPregnancy?: boolean;
  previousPregnanciesCount?: number;
  prenatalSupplements?: string;
  pregnancySymptoms: string[];
  breastfeedingDifficulties?: string;
  formulaSupplementing?: boolean;
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
  birthWeightKg?: number;
  weightForAgePercentile?: number;
  heightForAgePercentile?: number;
  motherMedicalHistory?: string;
  fatherMedicalHistory?: string;
  breastfed?: boolean;
  breastfeedingDurationMonths?: number;
  formulaFed?: boolean;
  solidsStartAgeMonths?: number;
  feedingDifficulties?: string;
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
  feedingConcerns: string[];
};

export const initialState: WizardState = {
  fullName: "",
  city: "",
  consent: false,
  chiefComplaints: [],
  medicalHistory: [],
  familyHistory: [],
  medications: [],
  cancerTreatment: [],
  treatmentSymptoms: [],
  foodSafetyConcerns: [],
  stoolConsistency: [],
  bloatingTiming: [],
  acidityTriggers: [],
  digestiveSymptoms: [],
  dailyRituals: [],
  bloodParameters: [],
  cuisines: [],
  dailyMeals: {
    breakfast: {},
    midMorning: {},
    lunch: {},
    evening: {},
    dinner: {},
    postDinner: {},
  },
  wellnessRituals: [],
  flow: [],
  pmsSymptoms: [],
  pregnancySymptoms: [],
  hormonalTypes: [],
  urinarySymptoms: [],
  sportsTiming: [],
  outdoorSports: [],
  indoorSports: [],
  growthConcerns: [],
  feedingConcerns: [],
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
    address: s.address?.trim() || undefined,
    medicalHistory: s.medicalHistory,
    familyHistory: s.familyHistory,
    medications: s.medications.filter((m) => m.name.trim().length > 0),
    allergies: s.allergies,
    surgicalHistory: s.surgicalHistory,
    oncology: s.hasCancerDiagnosis
      ? stripEmpty({
          diagnosis: s.cancerDiagnosis,
          type: s.cancerType,
          diagnosisDate: s.cancerDiagnosisDate,
          treatment: s.cancerTreatment,
          treatmentStage: s.treatmentStage,
          treatmentSymptoms: s.treatmentSymptoms,
          eatingPatternChanges: s.eatingPatternChanges,
          treatmentFoodPreferences: s.treatmentFoodPreferences,
          treatmentFoodIntolerances: s.treatmentFoodIntolerances,
          supplements: s.oncologySupplements,
          tubeFeeding: s.tubeFeeding,
          foodSafetyConcerns: s.foodSafetyConcerns,
        })
      : undefined,
    bodyMeasurements: stripEmpty({
      bloodGroup: s.bloodGroup,
      targetWeightKg: s.targetWeightKg,
      waistNavelCm: s.waistNavelCm,
      waistThinnestCm: s.waistThinnestCm,
      hipCm: s.hipCm,
      neckCm: s.neckCm,
      bloodPressure: s.bloodPressure,
      pulseRate: s.pulseRate,
      heaviestWeightKg: s.heaviestWeightKg,
      lightestWeightKg: s.lightestWeightKg,
      weight6moAgoKg: s.weight6moAgoKg,
      weight3yrAgoKg: s.weight3yrAgoKg,
    }),
    digestion: stripEmpty({
      bowelFrequency: s.bowelFrequency,
      stoolConsistency: s.stoolConsistency,
      bloatingTiming: s.bloatingTiming,
      acidityTriggers: s.acidityTriggers,
      digestiveSymptoms: s.digestiveSymptoms,
      acidityRating: s.acidityRating,
      bloatingRating: s.bloatingRating,
      constipationRating: s.constipationRating,
      dailyRituals: s.dailyRituals,
      lunchDuration: s.lunchDuration,
    }),
    foodPattern: stripEmpty({
      dietType: s.dietType,
      cuisines: s.cuisines,
      mealsPerDay: s.mealsPerDay,
      eatsOutPerWeek: s.eatsOutPerWeek,
      packagedFoodFrequency: s.packagedFoodFrequency,
      sugarDrinks: s.sugarDrinks,
      energyCarbonatedDrinks: s.energyCarbonatedDrinks,
      teaCoffeePerDay: s.teaCoffeePerDay,
      teaCoffeeFirstCupTime: s.teaCoffeeFirstCupTime,
      homeCooked: s.homeCooked,
      whoCooks: s.whoCooks,
      cookingOil: s.cookingOil,
      foodLikes: s.foodLikes,
      foodDislikes: s.foodDislikes,
      cravings: s.cravings,
      eatingSpeed: s.eatingSpeed,
      bingeEating: s.bingeEating,
      dailyMeals: stripEmpty(s.dailyMeals),
    }),
    lifestyleDepth: stripEmpty({
      stress: s.stress,
      stressSource: s.stressSource,
      screenTimeHrs: s.screenTimeHrs,
      smoking:
        s.smokingActive !== undefined
          ? { active: s.smokingActive, frequency: s.smokingFreq }
          : undefined,
      alcohol:
        s.alcoholActive !== undefined
          ? { active: s.alcoholActive, frequency: s.alcoholFreq, drinksPerSession: s.alcoholDrinksPerSession }
          : undefined,
      shiftWork: s.shiftWork,
      travelFrequency: s.travelFrequency,
      sleepTime: s.sleepTime,
      wakeTime: s.wakeTime,
      dailySteps: s.dailySteps,
      exerciseType: s.exerciseType,
      exerciseDuration: s.exerciseDuration,
      exerciseFrequency: s.exerciseFrequency,
      wellnessRituals: s.wellnessRituals,
    }),
    bloodParameters: s.bloodParameters,
    inflammationConcerns: s.inflammationConcerns,
    goals: stripEmpty({
      pastAttempts: s.pastAttempts,
      pastAttemptsOutcome: s.pastAttemptsOutcome,
      biggestChallenge: s.biggestChallenge,
      programExpectations: s.programExpectations,
    }),
    notes: s.notes,
  });

  if (s.branch === "child") {
    const childOptional = stripEmpty({
      gender: s.childGender,
      birthWeightKg: s.birthWeightKg,
      weightForAgePercentile: s.weightForAgePercentile,
      heightForAgePercentile: s.heightForAgePercentile,
      motherMedicalHistory: s.motherMedicalHistory,
      fatherMedicalHistory: s.fatherMedicalHistory,
      feeding: stripEmpty({
        breastfed: s.breastfed,
        breastfeedingDurationMonths: s.breastfeedingDurationMonths,
        formulaFed: s.formulaFed,
        solidsStartAgeMonths: s.solidsStartAgeMonths,
        feedingDifficulties: s.feedingDifficulties,
      }),
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
      feedingConcerns: s.feedingConcerns,
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
        referredBy: s.referredBy?.trim() || undefined,
      },
      required,
      optional: childCommon as never,
      child: childOptional as never,
    };
  }

  const contact = {
    phone: s.phone?.trim() || undefined,
    email: s.email?.trim() || undefined,
    profession: s.profession?.trim() || undefined,
    maritalStatus: s.maritalStatus,
    childrenCount: s.childrenCount,
    referredBy: s.referredBy?.trim() || undefined,
  };

  if (s.branch === "female") {
    const female = stripEmpty({
      periodsStatus: s.periodsStatus,
      lastPeriodDate: s.lastPeriodDate,
      cycleLengthDays: s.cycleLengthDays,
      flow: s.flow,
      periodDays: s.periodDays,
      pmsSymptoms: s.pmsSymptoms,
      painSeverity: s.painSeverity,
      periodPainMeds: s.periodPainMeds,
      endometriosisSurgery: s.endometriosisSurgery,
      hysterectomy: s.hysterectomy,
      fertility:
        s.pregnancyStatus === "trying"
          ? stripEmpty({
              tryingDuration: s.fertilityTryingDuration,
              treatment: s.fertilityTreatment,
              diagnosedConditions: s.fertilityConditions,
            })
          : undefined,
      hormonalIntervention:
        s.hormonalActive !== undefined
          ? { active: s.hormonalActive, types: s.hormonalTypes }
          : undefined,
      pregnancy: s.pregnancyStatus
        ? stripEmpty({
            status: s.pregnancyStatus,
            trimester: s.trimester,
            dueDate: s.dueDate,
            prePregnancyWeightKg: s.prePregnancyWeightKg,
            gestationalDiabetes: s.gestationalDiabetes,
            pregnancyInducedHypertension: s.pregnancyInducedHypertension,
            highRiskPregnancy: s.highRiskPregnancy,
            previousPregnanciesCount: s.previousPregnanciesCount,
            prenatalSupplements: s.prenatalSupplements,
            symptoms: s.pregnancySymptoms,
          })
        : undefined,
      lactation:
        s.pregnancyStatus === "lactating"
          ? stripEmpty({
              breastfeedingDifficulties: s.breastfeedingDifficulties,
              formulaSupplementing: s.formulaSupplementing,
            })
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
