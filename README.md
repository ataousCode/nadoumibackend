# 🌍 Nadoumi API Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?logo=railway)](https://railway.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Nadoumi** is a high-performance, secure backend API designed to power the Nadoumi Scholarship Platform. Built with a scalable layered architecture, it handles real-time notifications, complex scholarship management, and secure student applications.

---

## 🚀 Tech Stack

### **Core**
- **Runtime**: [Node.js (v18+)](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/) — Fast, unopinionated, minimalist web framework.
- **Language**: JavaScript (ES Modules).

### **Database & State**
- **ORM**: [Prisma](https://www.prisma.io/) — Type-safe database client.
- **Primary DB**: [PostgreSQL](https://www.postgresql.org/) — Relational database (Hosted on Railway).
- **Caching & Real-time**: [Redis](https://redis.io/) — Used for Socket.io adapter and background queues.

### **Real-time & Background**
- **WebSockets**: [Socket.io](https://socket.io/) — Real-time bidirectional communication.
- **Task Queue**: [BullMQ](https://docs.bullmq.io/) — Robust message queue for background processing.

### **Storage & Media**
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/) — Image hosting and transformations.
- **Processing**: [Sharp](https://sharp.pixelplumbing.com/) — High-performance image processing.

### **Security & Validation**
- **Authentication**: JWT (JSON Web Tokens).
- **Encryption**: Bcryptjs.
- **Security Headers**: Helmet, HPP (HTTP Parameter Pollution).
- **Validation**: Joi & Zod.
- **Rate Limiting**: Express Rate Limit with Redis store.

---

## 🛠️ Architecture

The project follows a clean, **Layered Architecture** to ensure maintainability and testability:

1. **Routes**: Define endpoints and apply middleware.
2. **Controllers**: Handle HTTP-specific logic and response formatting.
3. **Services**: Contain business logic and orchestrate data flow.
4. **Repositories**: Interface directly with Prisma for database operations.
5. **DTOs/Schemas**: Validate incoming request data.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://nadoumi.com

# Database
PROD_DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=no-verify"

# Authentication
JWT_SECRET="your_32_character_secret_here"

# Redis
REDIS_URL="rediss://default:pass@host:port"

# Cloudinary
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

# SMTP (Email)
SMTP_HOST=host
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
EMAIL_FROM="Nadoumi <noreply@nadoumi.com>"
```

---

## 📖 API Documentation

The API includes a fully interactive **Swagger UI**. Once the server is running, you can access the documentation at:

🔗 **[https://nadoumibackend.up.railway.app/api/docs](https://nadoumibackend.up.railway.app/api/docs)**

---

## 🛠️ Getting Started

### **1. Install Dependencies**
```bash
npm install
```

### **2. Database Setup**
```bash
# Generate Prisma Client
npx prisma generate

# Apply Migrations
npx prisma migrate dev
```

### **3. Start Development Server**
```bash
npm run dev
```

### **4. Build for Production**
```bash
npm run build
```

---

## 🧪 Testing

The project uses **Jest** and **Supertest** for comprehensive testing.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📡 Health Check

Monitor the system health (DB & Redis) via:
`GET /api/health`

---

Developed with ❤️ by the **Nadoumi Tech Team**.
