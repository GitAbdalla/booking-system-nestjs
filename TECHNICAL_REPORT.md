# Technical Report: Class Booking System API

**Developer**: Abdalla Hassan  
**Date**: October 2025  
**Project**: Backend Developer Technical Assessment

---

## 1. Executive Summary

This report documents key technical decisions made while building a credit-based class booking system API. The system provides JWT authentication, role-based access control, and implements complex business rules with transactional integrity.

**Deliverables**: REST API with 20+ endpoints, 12 unit tests, full Swagger documentation, complete in ~8 hours.

---

## 2. Technology Stack & Rationale

### Framework: NestJS + TypeScript
**Why NestJS?** Enterprise-grade architecture with built-in dependency injection, modular structure, and excellent TypeScript support. Provides better code organization and maintainability compared to vanilla Express.js, essential for scalable applications.

### Database: PostgreSQL (Supabase)
**Why PostgreSQL?** ACID compliance is critical for booking systems where credit transactions must be atomic. Relational structure naturally fits User ↔ Booking ↔ Class relationships. PostgreSQL's transaction support prevents race conditions during concurrent bookings.

**Why Supabase?** Managed PostgreSQL with automatic backups, connection pooling, and free tier for development.

### ORM: TypeORM
**Why TypeORM?** Native NestJS integration, decorator-based syntax aligning with framework patterns, and excellent transaction API for multi-step operations. Provides fine-grained control over complex transactions needed for booking logic.

---

## 3. Architecture

**Modular Design**: Four core modules (Auth → Users → Classes → Bookings), each handling one domain with clear separation of concerns.

**Design Patterns**:
- **Repository Pattern**: Database abstraction through TypeORM repositories
- **Dependency Injection**: Constructor-based injection for loose coupling
- **Strategy Pattern**: Passport JWT for flexible authentication
- **Guard Pattern**: JwtAuthGuard and RolesGuard for declarative security
- **DTO Pattern**: Automatic validation with class-validator

---

## 4. Critical Business Logic

### Atomic Booking Transactions
**Challenge**: Prevent race conditions when multiple users book simultaneously.

**Solution**: Database transactions with pessimistic locking (FOR UPDATE). All operations (credit check, capacity check, booking creation, credit deduction, capacity increment) execute atomically - all succeed or all fail.

**Trade-off**: Locking reduces concurrency but ensures data integrity. For booking systems, correctness > performance.

### 2-Hour Cancellation Policy
**Implementation**: Time-based calculation within transaction: `hoursUntilClass = (classStartTime - now) / 3600000`. Refund credits automatically if >2 hours, no refund if <2 hours.

### Overlapping Prevention
**Solution**: SQL time-range query checks for conflicts: `WHERE startTime < newClass.endTime AND endTime > newClass.startTime`. Database-level check is faster and more reliable than application-level iteration.

---

## 5. Security

- **Authentication**: bcrypt password hashing, JWT tokens (24h expiration), stateless sessions
- **Authorization**: Role-based access (Admin/User) enforced via guards
- **Input Validation**: class-validator for DTO validation, TypeORM parameterized queries prevent SQL injection

---

## 6. Testing Strategy

**Focus**: Business logic over infrastructure. 12 unit tests covering authentication (registration, login, errors) and booking rules (credit checks, capacity limits, overlaps, duplicates, cancellation policy).

**Approach**: Mock repositories and query runners to test services in isolation without database dependencies.

---

## 7. Key Challenges & Solutions

**TypeORM Eager Loading + Locks**: `FOR UPDATE` incompatible with `LEFT JOIN` (eager loading). **Solution**: Removed `eager: true` from entity relations, load relations explicitly after transactions.

**Timezone Handling**: Store all timestamps in UTC, let clients handle localization. Server never deals with timezones.

---

## 8. Trade-offs & Production Improvements

### Current Trade-offs
- **Pessimistic Locking**: Data consistency at the cost of lower concurrency
- **TypeORM Synchronize**: Fast development but must use migrations in production
- **No Caching**: Simple architecture but repeated DB queries

## 9. Conclusion

This project demonstrates proficiency in backend architecture, database design, transaction management, security implementation, and testing. The system successfully implements all business requirements (credit validation, capacity management, overlap prevention, cancellation policy) with ACID guarantees.

**Key Strengths**: Modular NestJS structure, atomic transactions preventing data inconsistencies, comprehensive business rule validation, role-based security, and clear API documentation.

The system is production-ready with minor enhancements (migrations, caching, monitoring). Development completed within the one-day timeframe as planned.