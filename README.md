# 🎯 Class Booking System API

A robust backend API built with NestJS for managing class bookings with credit-based payments, role-based access control, and comprehensive business logic.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Business Rules](#business-rules)
- [API Endpoints](#api-endpoints)

---

## ✨ Features

### Core Functionality
- **User Authentication** - JWT-based registration and login
- **Role-Based Access Control** - Admin and User roles with different permissions
- **Credit Management** - Users receive credits and spend them on bookings
- **Class Management** - Create and list classes with capacity tracking
- **Smart Booking System** - Book classes with comprehensive validation
- **Intelligent Cancellation** - Cancel bookings with automatic refund logic

### Business Logic
- ✅ Credit validation before booking
- ✅ Class capacity management (prevent overbooking)
- ✅ Overlapping booking prevention
- ✅ Duplicate booking prevention
- ✅ 2-hour cancellation policy with automatic refunds
- ✅ Atomic transactions for data consistency

---

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: TypeORM
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

---

## 📦 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18.x or v20.x) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL Database** - Supabase account or local PostgreSQL

---

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd booking-system-nestjs
```

2. **Install dependencies**
```bash
npm install
```

---

## ⚙️ Environment Setup

1. **Create `.env` file** in the root directory:

```env
# Database Configuration (Supabase)
DATABASE_URL = postgresql://postgres.icjecqisuibdbithnpun:[your_password]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=24h

# Admin Configuration
ADMIN_EMAIL=admin@example.com

# Application
PORT=3000
NODE_ENV=development
```

2. **Update database credentials** with your Supabase details:
   - Get your connection details from Supabase Dashboard → Settings → Database

---

## 🏃 Running the Application

### Development Mode
```bash
npm run start:dev
```

The application will start on `http://localhost:3000`

### Production Mode
```bash
npm run build
npm run start:prod
```

### Verify Installation
Once running, visit:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

You should see 'Hello from Booking-System Task for Mantaray Digital Solution ' at the root and a full API documentation interface at `/api/docs`.

---

## 📚 API Documentation

**Interactive Swagger UI**: http://localhost:3000/api/docs

The Swagger interface provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing (try endpoints directly)
- Authentication support (JWT bearer tokens)

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```


**Test Suite Includes**:
- Authentication service tests (registration, login, validation)
- Booking service tests (all business rules)
- 12 total tests covering critical functionality

---

## 📁 Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── dto/               # Data Transfer Objects
│   ├── strategies/        # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                 # User management module
│   ├── dto/
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── classes/               # Class management module
│   ├── dto/
│   ├── class.entity.ts
│   ├── classes.controller.ts
│   ├── classes.service.ts
│   └── classes.module.ts
├── bookings/              # Booking management module
│   ├── dto/
│   ├── booking.entity.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
├── common/                # Shared resources
│   ├── guards/           # Auth guards, role guards
│   └── decorators/       # Custom decorators
├── app.module.ts         # Root module
└── main.ts               # Application entry point
```

---

## 🎯 Business Rules

### Booking Rules
1. **Credit Check**: User must have sufficient credits (class cost)
2. **Capacity Check**: Class must have available slots
3. **No Overlapping**: User cannot book classes with overlapping times
4. **No Duplicates**: User cannot book the same class twice
5. **Atomic Operations**: All booking operations use database transactions

### Cancellation Rules
1. **Ownership**: Users can only cancel their own bookings
2. **Time-Based Refund**:
   - Cancel >2 hours before class → Full credit refund
   - Cancel <2 hours before class → No refund
3. **Status Check**: Cannot cancel already cancelled/completed bookings

### Role-Based Access
- **Admin**: Can create classes, manage user credits, view all bookings
- **User**: Can view classes, book classes, view own bookings, cancel own bookings

---

## 🔗 API Endpoints

### Authentication (Public)
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
GET    /auth/me                - Get current user profile (Protected)
```

### Users (Protected)
```
GET    /users                  - Get all users (Admin only)
GET    /users/me               - Get current user with bookings
GET    /users/:id              - Get user by ID
PATCH  /users/:id/credits      - Update user credits (Admin only)
```

### Classes
```
POST   /classes                - Create class (Admin only)
GET    /classes                - Get all classes (Public, with filters)
GET    /classes/upcoming       - Get upcoming classes (Public)
GET    /classes/:id            - Get class details (Public)
GET    /classes/:id/availability - Check class availability (Public)
```

### Bookings (Protected)
```
POST   /bookings               - Book a class
GET    /bookings               - Get all bookings (Admin only)
GET    /bookings/my-bookings   - Get current user bookings
GET    /bookings/:id           - Get booking by ID
PATCH  /bookings/:id/cancel    - Cancel booking
```

---

## 🎬 Quick Start Guide

### 1. Create Admin User
```bash
# Register with admin email (configured in .env)
POST /auth/register
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 2. Login and Get Token
```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
# Copy the accessToken from response
```

### 3. Authorize in Swagger
- Click "Authorize" button in Swagger UI
- Enter: `Bearer YOUR_ACCESS_TOKEN`
- Click "Authorize"

### 4. Create a Class (Admin)
```bash
POST /classes
{
  "name": "Morning Yoga",
  "description": "Energizing morning session",
  "startTime": "2025-10-28T08:00:00Z",
  "endTime": "2025-10-28T09:00:00Z",
  "capacity": 20,
  "creditsRequired": 1
}
```

### 5. Register a Regular User
```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "user123"
}
# New users automatically get 10 credits
```

### 6. Book a Class
```bash
POST /bookings
{
  "classId": "class-id-from-step-4"
}
```

### 7. View Your Bookings
```bash
GET /bookings/my-bookings
```

---

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Stateless token-based auth
- **Input Validation**: Automatic DTO validation
- **SQL Injection Protection**: TypeORM parameterized queries
- **Role-Based Authorization**: Guard-protected routes
- **Transaction Safety**: ACID-compliant operations

---

## 📝 Notes

- **Default Credits**: New users receive 10 credits on registration
- **Admin Creation**: First user with ADMIN_EMAIL becomes admin
- **Database Schema**: Auto-created via TypeORM synchronization
- **Time Zones**: All times stored in UTC

---

##  Acknowledgments

Built with NestJS, TypeORM, and PostgreSQL 