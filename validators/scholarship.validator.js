import { z } from "zod";

export const scholarshipSchema = z.object({
  scholarshipId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleInChinese: z.string().optional(),
  universities: z.array(z.string().uuid("Invalid University ID")),
  universityJson: z.any().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  programCategories: z.array(z.enum(["Language", "Bachelor", "Master", "PhD"])),
  scholarshipCategory: z.enum([
    "Self_funded",
    "Partial",
    "CSC",
    "Province",
    "Universities",
    "HSK",
    "Type_A",
    "Type_B",
    "Type_C",
    "Other",
  ]),
  field: z.string().optional(),
  programName: z.string().optional(),
  degree: z.string().optional(),
  duration: z.coerce.number().int().nonnegative().optional(),
  scholarshipDuration: z.coerce.number().int().nonnegative().optional(),
  scholarshipDurationText: z.string().optional(),
  intake: z.string().optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  applicationDeadline: z
    .union([z.string(), z.date()])
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),

  // Requirements
  ageMin: z.coerce.number().int().nonnegative().optional(),
  ageMax: z.coerce.number().int().nonnegative().optional(),
  acceptedCountries: z.array(z.string()).optional(),
  chinaVisitPolicy: z.string().optional(),
  acceptMinors: z.coerce.boolean().optional(),
  currentLocationPolicy: z.string().optional(),
  scoreRequirements: z.string().optional(),

  // University Fees
  originalTuitionFee: z.coerce.number().nonnegative().optional(),
  tuitionFeeAfterScholarship: z.coerce.number().nonnegative().optional(),
  accommodationFeeQuad: z.coerce.number().nonnegative().optional(),
  accommodationFeeAfterScholarship: z.coerce.number().nonnegative().optional(),
  registrationFee: z.string().optional(),

  // Nadoumi Agent Fees
  nadoumiApplicationFee: z.coerce.number().nonnegative().optional(),
  nadoumiServiceFee: z.coerce.number().nonnegative().optional(),

  stipend: z.any().optional(),
  accommodationFee: z.any().optional(),
  insurance: z.string().optional(),
  teachingLanguage: z.enum(["English", "Chinese", "Both"]).default("English"),
  isRecommended: z.coerce.boolean().optional(),
  isHot: z.coerce.boolean().optional(),
  isTop: z.coerce.boolean().optional(),
  recommendationNotes: z.string().optional(),
  applicationDocuments: z.array(z.any()).optional(),
  requirements: z.any().optional(),
  benefits: z.any().optional(),
  scholarshipPolicy: z.string().optional(),
  applicantRequirements: z.any().optional(),
  additionalDocuments: z.any().optional(),
  feeStructure: z.any().optional(),
  specialNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  additionalFees: z.any().optional(),
  coverImage: z.string().optional(),
  availableSlots: z.coerce.number().int().nonnegative().default(1),
  status: z
    .enum(["draft", "published", "closed", "active", "inactive", "limited"])
    .default("draft"),
  // Allow internal fields to be passed without error, but they'll be sanitized later
  id: z.any().optional(),
  uuid: z.any().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  deletedAt: z.any().optional(),
  createdBy: z.any().optional(),
  updatedBy: z.any().optional(),
  university: z.any().optional(),
  programs: z.any().optional(),
});

export const validateScholarship = (data) => {
  return scholarshipSchema.parse(data);
};

export const validateScholarshipUpdate = (data) => {
  return scholarshipSchema.partial().parse(data);
};
