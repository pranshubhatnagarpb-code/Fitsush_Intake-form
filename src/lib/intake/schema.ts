/**
 * Stable structured payload schema for intake submissions.
 *
 * Keys here are the contract between this intake project and the PMS.
 * Add fields, never rename or remove existing keys without versioning.
 */
import { z } from "zod";

export const PAYLOAD_VERSION = 1 as const;

// ---------- shared primitives ----------
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[+0-9 ()-]+$/u, "Invalid phone");
const emailSchema = z.string().trim().email().max(254);

const ratingSchema = z.number().int().min(1).max(5);

const symptomSnapshot = z.object({
  sleep: ratingSchema,
  digestion: ratingSchema,
  energy: ratingSchema,
  fatigue: ratingSchema,
  skin: ratingSchema,
  hair: ratingSchema,
});

const lifestyleQuick = z.object({
  sleepHours: z.number().min(3).max(14),
  waterIntake: z.enum(["<1L", "1-2L", "2-3L", "3L+"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

const bodySnapshot = z.object({
  weightKg: z.number().min(2).max(400),
  heightCm: z.number().min(40).max(250),
});

// ---------- required core (all branches) ----------
const requiredCore = z.object({
  fullName: z.string().trim().min(1).max(120),
  dob: z.string().date().optional(),
  age: z.number().int().min(0).max(120).optional(),
  city: z.string().trim().min(1).max(120),
  consent: z.literal(true),
  primaryGoal: z.enum([
    "weight_loss",
    "weight_gain",
    "muscle_gain",
    "energy",
    "gut_health",
    "hormonal_balance",
    "sports_performance",
    "manage_medical_condition",
    "general_wellness",
  ]),
  chiefComplaints: z.array(z.string().min(1).max(60)).min(1).max(3),
  body: bodySnapshot,
  lifestyle: lifestyleQuick,
  symptoms: symptomSnapshot,
});

// ---------- optional sections (all branches) ----------
const optionalCommon = z
  .object({
    medicalHistory: z.array(z.string().max(60)).max(30).optional(),
    familyHistory: z.array(z.string().max(60)).max(30).optional(),
    medications: z
      .array(
        z.object({
          name: z.string().max(80),
          frequency: z.string().max(40).optional(),
        }),
      )
      .max(30)
      .optional(),
    digestion: z
      .object({
        bowelFrequency: z.string().max(40).optional(),
        stoolConsistency: z.array(z.string().max(40)).max(10).optional(),
        bloatingTiming: z.array(z.string().max(40)).max(10).optional(),
        acidityTriggers: z.array(z.string().max(40)).max(10).optional(),
        acidityRating: ratingSchema.optional(),
        bloatingRating: ratingSchema.optional(),
      })
      .optional(),
    foodPattern: z
      .object({
        dietType: z.enum(["veg", "non_veg", "eggetarian", "vegan", "jain"]).optional(),
        cuisines: z.array(z.string().max(40)).max(15).optional(),
        mealsPerDay: z.number().int().min(1).max(8).optional(),
        eatsOutPerWeek: z.number().int().min(0).max(21).optional(),
        packagedFoodFrequency: z
          .enum(["rarely", "1-2_wk", "3-5_wk", "daily", "multi_daily"])
          .optional(),
        sugarDrinks: z.boolean().optional(),
        teaCoffeePerDay: z.number().int().min(0).max(20).optional(),
      })
      .optional(),
    lifestyleDepth: z
      .object({
        stress: ratingSchema.optional(),
        screenTimeHrs: z.number().min(0).max(24).optional(),
        smoking: z.object({ active: z.boolean(), frequency: z.string().max(40).optional() }).optional(),
        alcohol: z.object({ active: z.boolean(), frequency: z.string().max(40).optional() }).optional(),
        shiftWork: z.boolean().optional(),
        travelFrequency: z.string().max(40).optional(),
      })
      .optional(),
    bloodParameters: z.array(z.string().max(60)).max(20).optional(),
    inflammationConcerns: z.boolean().optional(),
    notes: z.string().max(240).optional(),
  })
  .partial();

// ---------- sex-specific optional ----------
const femaleOptional = z
  .object({
    periodsStatus: z.enum(["regular", "irregular", "absent", "menopausal"]).optional(),
    cycleLengthDays: z.number().int().min(10).max(90).optional(),
    flow: z.array(z.enum(["light", "moderate", "heavy", "very_heavy", "clots"])).max(5).optional(),
    periodDays: z.number().int().min(1).max(15).optional(),
    pmsSymptoms: z.array(z.string().max(40)).max(15).optional(),
    painSeverity: ratingSchema.optional(),
    hormonalIntervention: z
      .object({
        active: z.boolean(),
        types: z.array(z.enum(["ocp", "hormonal_iud", "hrt", "fertility_meds", "none"])).max(5).optional(),
      })
      .optional(),
    pregnancy: z
      .object({
        status: z.enum(["none", "trying", "pregnant", "lactating"]),
        trimester: z.enum(["first", "second", "third"]).optional(),
      })
      .optional(),
    menopause: z
      .object({
        reached: z.boolean(),
        ageAt: z.number().int().min(20).max(80).optional(),
        type: z.enum(["natural", "induced_surgical", "induced_medical"]).optional(),
      })
      .optional(),
    hysterectomy: z.boolean().optional(),
    periodPainMeds: z.boolean().optional(),
    endometriosisSurgery: z.boolean().optional(),
  })
  .partial();

const maleOptional = z
  .object({
    urinarySymptoms: z
      .array(z.enum(["frequency", "urgency", "hesitancy", "nocturia", "incomplete_emptying", "none"]))
      .max(6)
      .optional(),
    libido: ratingSchema.optional(),
    erectileConcerns: z.boolean().optional(),
    testosteroneStatus: z.enum(["not_tested", "normal", "low", "high", "unsure"]).optional(),
    trtUse: z.boolean().optional(),
    steroidUse: z
      .object({
        status: z.enum(["never", "past", "current"]),
        substances: z.array(z.string().max(40)).max(10).optional(),
      })
      .optional(),
    prostateConcerns: z.boolean().optional(),
  })
  .partial();

const childOptional = z
  .object({
    schoolGrade: z.string().max(20).optional(),
    stamina: ratingSchema.optional(),
    attentionSpan: ratingSchema.optional(),
    focus: ratingSchema.optional(),
    appetite: z.enum(["poor", "variable", "good", "very_good", "excessive"]).optional(),
    pickyEater: ratingSchema.optional(),
    sportsPerWeek: z.number().int().min(0).max(21).optional(),
    sportsTiming: z.array(z.enum(["morning", "afternoon", "evening"])).max(3).optional(),
    outdoorSports: z.array(z.string().max(40)).max(15).optional(),
    indoorSports: z.array(z.string().max(40)).max(15).optional(),
    screenTimeHrs: z.number().min(0).max(24).optional(),
    packagedFoodFrequency: z.enum(["rarely", "1-2_wk", "3-5_wk", "daily", "multi_daily"]).optional(),
    memory: ratingSchema.optional(),
    growthConcerns: z.array(z.string().max(40)).max(10).optional(),
  })
  .partial();

// ---------- branch payloads ----------
const guardianBlock = z.object({
  guardianName: z.string().trim().min(1).max(120),
  guardianRelationship: z.string().min(1).max(60),
  guardianPhone: phoneSchema,
  guardianEmail: emailSchema.optional(),
});

const adultContact = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((v) => Boolean(v.phone || v.email), {
    message: "Provide a phone number or email",
    path: ["phone"],
  });

export const femaleSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("female"),
  contact: adultContact,
  required: requiredCore,
  optional: optionalCommon.optional(),
  female: femaleOptional.optional(),
});

export const maleSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("male"),
  contact: adultContact,
  required: requiredCore,
  optional: optionalCommon.optional(),
  male: maleOptional.optional(),
});

export const childSubmissionSchema = z.object({
  version: z.literal(PAYLOAD_VERSION),
  branch: z.literal("child"),
  guardian: guardianBlock,
  required: requiredCore,
  optional: optionalCommon.omit({ lifestyleDepth: true }).optional(),
  child: childOptional.optional(),
});

export const submissionSchema = z.discriminatedUnion("branch", [
  femaleSubmissionSchema,
  maleSubmissionSchema,
  childSubmissionSchema,
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;
