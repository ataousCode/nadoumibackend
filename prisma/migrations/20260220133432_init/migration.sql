-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('Public', 'Private');

-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('active', 'inactive', 'draft');

-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('Language', 'Bachelor', 'Master', 'PhD');

-- CreateEnum
CREATE TYPE "ScholarshipCategory" AS ENUM ('Self-funded', 'Partial', 'CSC', 'Province', 'Universities', 'HSK', 'Other');

-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('draft', 'published', 'closed', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'received', 'under_review', 'interview', 'interview_passed', 'interview_failed', 'accepted', 'rejected', 'revoked', 'waitlisted');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Admin',
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameInChinese" TEXT,
    "logo" TEXT,
    "bannerImage" TEXT,
    "city" TEXT,
    "province" TEXT,
    "type" "UniversityType" NOT NULL DEFAULT 'Public',
    "foundedYear" INTEGER,
    "totalStudents" INTEGER,
    "internationalStudents" INTEGER,
    "facultyCount" INTEGER,
    "numberOfPrograms" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "advantages" TEXT[],
    "albums" JSONB,
    "rankings" JSONB,
    "status" "UniversityStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleInChinese" TEXT,
    "universityJson" JSONB,
    "universityId" TEXT,
    "description" TEXT NOT NULL,
    "programCategory" "ProgramCategory" NOT NULL DEFAULT 'Bachelor',
    "field" TEXT,
    "programName" TEXT,
    "degree" TEXT,
    "duration" INTEGER,
    "intake" TEXT,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "scholarshipCategory" "ScholarshipCategory" NOT NULL DEFAULT 'Partial',
    "scholarshipDuration" INTEGER,
    "originalTuitionFee" DOUBLE PRECISION,
    "tuitionFeeAfterScholarship" DOUBLE PRECISION,
    "accommodationFee" JSONB,
    "accommodationFeeAfterScholarship" JSONB,
    "scholarshipPolicy" TEXT,
    "applicantRequirements" JSONB,
    "applicationDocuments" JSONB,
    "additionalDocuments" JSONB,
    "feeStructure" JSONB,
    "specialNotes" TEXT[],
    "requirements" JSONB,
    "benefits" JSONB,
    "startDate" TIMESTAMP(3),
    "availableSlots" INTEGER NOT NULL DEFAULT 1,
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'draft',
    "category" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "phone" TEXT,
    "profilePicture" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationOTP" TEXT,
    "emailVerificationOTPExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "legacy_id" TEXT,
    "applicant" JSONB,
    "fields" JSONB,
    "personalInfo" JSONB,
    "contactInfo" JSONB,
    "familyInfo" JSONB,
    "preferences" JSONB,
    "documents" JSONB,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "statusHistory" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "interviewDetails" JSONB,
    "rejectionDetails" JSONB,
    "acceptedAt" TIMESTAMP(3),
    "admissionDocument" JSONB,
    "jw202Document" JSONB,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "University_universityId_key" ON "University"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_scholarshipId_key" ON "Scholarship"("scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_passportNumber_key" ON "Student"("passportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationId_key" ON "Application"("applicationId");

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
