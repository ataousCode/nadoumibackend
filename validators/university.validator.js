import { z } from "zod";

export const universitySchema = z.object({
  universityId: z
    .string()
    .min(3, "University ID must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameInChinese: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  type: z.enum(["Public", "Private"]).default("Public"),
  foundedYear: z.number().int().optional(),
  totalStudents: z.number().int().optional(),
  internationalStudents: z.number().int().optional(),
  facultyCount: z.number().int().optional(),
  numberOfPrograms: z.number().int().optional(),
  introduction: z.string().optional(),
  description: z.string().optional(),
  history: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  partnershipCountries: z.array(z.string()).optional(),
  searchTags: z.array(z.string()).optional(),
  searchKeywords: z.string().optional(),
  scholarshipAvailability: z
    .enum(["Available", "Limited", "Not Available"])
    .optional(),
  scholarshipNotes: z
    .array(
      z.object({
        name: z.string(),
        notes: z.string(),
      }),
    )
    .optional(),
  advantages: z.array(z.string()).optional(),
  accommodation: z
    .array(
      z.object({
        type: z.string(),
        pricePerYear: z.union([z.number(), z.string()]),
        feeUnit: z.string().optional(),
        facilities: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  campusFacilities: z.array(z.string()).optional(),
  nearbyInfo: z.string().optional(),
  officialWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  admissionsEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  officePhone: z.string().optional(),
  logo: z.string().optional(),
  bannerImage: z.string().optional(),
  qsRank: z.number().int().optional().nullable(),
  albums: z.array(z.string()).optional(),
  rankings: z
    .array(
      z.object({
        rank: z.union([z.number(), z.string()]),
        organization: z.string(),
        year: z.union([z.number(), z.string()]).optional(),
      }),
    )
    .optional(),
  isRecommended: z.boolean().optional(),
  isPartner: z.boolean().optional(),
  isTop: z.boolean().optional(),
  recommendationNotes: z.string().optional(),
  requiredDocuments: z
    .array(
      z.object({
        name: z.string(),
        required: z.boolean().default(true),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  majors: z.any().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
});

export const validateUniversity = (data) => {
  return universitySchema.parse(data);
};

export const validateUniversityUpdate = (data) => {
  return universitySchema.partial().parse(data);
};
