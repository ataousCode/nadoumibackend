export const mockApplication = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  applicationId: "APP20240001",
  studentId: "st_123",
  scholarshipId: "550e8400-e29b-41d4-a716-446655440000",
  status: "pending",
  submittedAt: new Date(),
  updatedAt: new Date(),
  statusHistory: [
    { status: "pending", timestamp: new Date(), note: "Application submitted" },
  ],
  student: {
    id: "st_123",
    email: "test@nadoumi.com",
    firstName: "John",
    lastName: "Doe",
  },
  scholarship: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Full Engineering Scholarship",
  },
};

export const mockInterviewApplication = {
  ...mockApplication,
  id: "550e8400-e29b-41d4-a716-446655440003",
  applicationId: "APP20240002",
  status: "interview",
  interviewDetails: {
    date: "2024-10-10",
    time: "10:00",
    videoCallPlatform: "Google Meet",
    videoCallLink: "https://meet.google.com/abc-defg-hij",
    scheduledAt: new Date(),
  },
  statusHistory: [
    { status: "pending", timestamp: new Date(), note: "Application submitted" },
    { status: "interview", timestamp: new Date(), note: "Interview scheduled" },
  ],
};

export const mockAcceptedApplication = {
  ...mockApplication,
  id: "550e8400-e29b-41d4-a716-446655440004",
  applicationId: "APP20240003",
  status: "accepted",
  acceptedAt: new Date(),
  statusHistory: [
    { status: "pending", timestamp: new Date(), note: "Application submitted" },
    { status: "interview", timestamp: new Date(), note: "Interview scheduled" },
    { status: "accepted", timestamp: new Date(), note: "Application accepted" },
  ],
};
