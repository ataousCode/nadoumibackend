export const mockScholarship = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  scholarshipId: "NAD2024S001",
  title: "Full Engineering Scholarship",
  description: "Full tuition for engineering majors",
  status: "published",
  universityId: "550e8400-e29b-41d4-a716-446655440001",
  programCategory: "Bachelor",
  scholarshipCategory: "Full",
  applicationDeadline: "2027-12-31T23:59:59Z",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockExpiredScholarship = {
  ...mockScholarship,
  id: "550e8400-e29b-41d4-a716-446655440005",
  scholarshipId: "NAD2024S002",
  title: "Expired Scholarship",
  applicationDeadline: "2020-01-01T23:59:59Z",
};

export const mockUniversity = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  universityId: "UNI2024001",
  name: "Nadoumi Global University",
  country: "China",
  status: "active",
};
