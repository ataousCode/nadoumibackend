import swaggerJsdoc from "swagger-jsdoc";
import { FRONTEND_URL } from "./constants.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nadoumi API",
      version: "1.0.0",
      description:
        "The official API documentation for the Nadoumi Scholarship Platform.",
      contact: {
        name: "Nadoumi Tech Team",
        url: FRONTEND_URL,
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3001",
        description: process.env.NODE_ENV === "production" ? "Production Server" : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "The requested resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ValidationError: {
          description: "Invalid input data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
                errors: { type: "object" },
              },
            },
          },
        },
        Admin: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            profilePicture: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        University: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            universityId: { type: "string" },
            name: { type: "string" },
            nameInChinese: { type: "string", nullable: true },
            logo: { type: "string", nullable: true },
            bannerImage: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            province: { type: "string", nullable: true },
            type: { type: "string", enum: ["Public", "Private"] },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["active", "inactive", "draft"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Scholarship: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            scholarshipId: { type: "string" },
            title: { type: "string" },
            titleInChinese: { type: "string", nullable: true },
            description: { type: "string" },
            programCategory: {
              type: "string",
              enum: ["Language", "Bachelor", "Master", "PhD"],
            },
            field: { type: "string", nullable: true },
            programName: { type: "string", nullable: true },
            applicationDeadline: { type: "string", format: "date-time" },
            scholarshipCategory: {
              type: "string",
              enum: [
                "Self-funded",
                "Partial",
                "CSC",
                "Province",
                "Universities",
                "HSK",
                "Type A",
                "Type B",
                "Type C",
                "Other",
              ],
            },
            status: {
              type: "string",
              enum: ["draft", "published", "closed", "active", "inactive"],
            },
            universities: { 
              type: "array",
              items: { $ref: "#/components/schemas/University" }
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Student: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            country: { type: "string" },
            passportNumber: { type: "string" },
            phone: { type: "string", nullable: true },
            profilePicture: { type: "string", nullable: true },
            nationality: { type: "string", nullable: true },
            isEmailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Application: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            applicationId: { type: "string" },
            status: {
              type: "string",
              enum: [
                "pending",
                "received",
                "under_review",
                "interview",
                "interview_passed",
                "interview_failed",
                "accepted",
                "rejected",
                "revoked",
                "waitlisted",
              ],
            },
            submittedAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            student: { $ref: "#/components/schemas/Student" },
            scholarship: { $ref: "#/components/schemas/Scholarship" },
            statusHistory: { type: "array", items: { type: "object" } },
            preferences: { type: "object" },
            documents: { type: "object" },
            interviewDetails: { type: "object", nullable: true },
            rejectionDetails: { type: "object", nullable: true },
            admissionDocument: { type: "object", nullable: true },
            jw202Document: { type: "object", nullable: true },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            action: { type: "string" },
            resource: { type: "string" },
            resourceId: { type: "string" },
            adminId: { type: "string" },
            metadata: { type: "object", nullable: true },
            ip: { type: "string", nullable: true },
            userAgent: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./dto/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
