# Class Booking System

A production-ready backend for a global live-learning platform where teachers create class offerings and parents book them — with full timezone support and concurrent booking protection.

## Tech Stack
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Auth**: JWT (Passport.js)
- **Timezone**: moment-timezone
- **Docs**: Swagger / OpenAPI
- **Container**: Docker + Docker Compose

---

## Quick Start (Docker)

```bash
git clone <your-repo-url>
cd class-booking
docker-compose up --build
```

- App: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

---

## Local Setup

### Prerequisites
- Node.js >= 18
- MySQL 8.0

```bash
npm install
cp .env.example .env        # Fill in your DB credentials
mysql -u root -p -e "CREATE DATABASE class_booking;"
npm run start:dev
```

---

## Environment Variables

| Variable      | Description             | Default         |
|---------------|-------------------------|-----------------|
| DB_HOST       | MySQL host              | localhost       |
| DB_PORT       | MySQL port              | 3306            |
| DB_USERNAME   | MySQL username          | root            |
| DB_PASSWORD   | MySQL password          | (required)      |
| DB_NAME       | Database name           | class_booking   |
| JWT_SECRET    | JWT signing secret      | (required)      |
| PORT          | HTTP port               | 3000            |

---

## API Endpoints

### Auth
| Method | Endpoint        | Description             | Auth    |
|--------|-----------------|-------------------------|---------|
| POST   | /auth/register  | Register teacher/parent | No      |
| POST   | /auth/login     | Login, receive JWT      | No      |

### Courses (Teacher)
| Method | Endpoint        | Description             | Auth    |
|--------|-----------------|-------------------------|---------|
| POST   | /courses        | Create a course         | Teacher |
| GET    | /courses        | List all courses        | Any     |
| GET    | /courses/my     | My courses              | Teacher |

### Offerings
| Method | Endpoint                    | Description                             | Auth    |
|--------|-----------------------------|-----------------------------------------|---------|
| POST   | /offerings                  | Create offering                         | Teacher |
| POST   | /offerings/:id/sessions     | Add session (in teacher's timezone)     | Teacher |
| GET    | /offerings/my?timezone=TZ   | My offerings with sessions              | Teacher |
| GET    | /offerings?timezone=TZ      | All offerings (times in viewer's TZ)    | Any     |
| GET    | /offerings/:id              | Offering detail                         | Any     |

### Bookings (Parent)
| Method | Endpoint                    | Description                             | Auth   |
|--------|-----------------------------|-----------------------------------------|--------|
| POST   | /bookings/:offeringId       | Book an offering (all sessions)         | Parent |
| GET    | /bookings/my?timezone=TZ    | My bookings (times in my timezone)      | Parent |
| DELETE | /bookings/:bookingId        | Cancel a booking                        | Parent |

---

## Database Schema

```
users         — id, name, email, password, role, timezone
courses       — id, title, description, teacherId
offerings     — id, name, courseId, teacherId, teacherTimezone
sessions      — id, offeringId, teacherId, startTime(UTC), endTime(UTC)
bookings      — id, parentId, offeringId, status
              — UNIQUE(parentId, offeringId)
```

See `schema.sql` for the full DDL with indexes.

---

## Timezone Handling

1. Teacher registers with their timezone (e.g. `Asia/Kolkata`)
2. When adding a session, teacher sends local time (e.g. `2025-06-07T18:00:00`)
3. Server converts to UTC using teacher's timezone before storing
4. When a parent fetches offerings, UTC times are converted to the parent's timezone
5. Pass `?timezone=America/New_York` to override on any GET endpoint

**Example flow:**
- Teacher (IST UTC+5:30) creates session at `18:00 IST`
- Stored as `12:30 UTC`
- Parent in New York (EST UTC-5) sees `07:30 EST`

---

## Concurrency Handling

Booking uses **pessimistic write lock** (`SELECT ... FOR UPDATE`) inside a DB transaction:

```
BEGIN TRANSACTION
  SELECT offering FOR UPDATE          ← locks offering row
  CHECK duplicate booking
  CHECK session time conflicts
  INSERT booking
COMMIT
```

The DB-level `UNIQUE(parentId, offeringId)` constraint acts as a second safety net.

This prevents:
- Two parents racing to book the same offering
- One parent sending parallel requests with overlapping sessions

---

## Conflict Detection

Two sessions overlap when:
```
newSession.startTime < existingSession.endTime
AND
newSession.endTime   > existingSession.startTime
```

Checked across all sessions of all confirmed offerings a parent has booked.

---

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── users/          ← Auth, JWT, roles
├── courses/        ← Course CRUD
├── offerings/      ← Offerings + session management + TZ conversion
├── sessions/       ← Session entity
├── bookings/       ← Booking with locking + conflict detection
└── common/
    ├── guards/     ← JwtAuthGuard, RolesGuard
    ├── decorators/ ← @CurrentUser, @Roles
    └── filters/    ← Global exception filter
```

---

## Assumptions

- A parent books the **entire offering**, not individual sessions
- Cancelled bookings free up time slots
- Session times from teacher are in **teacher's profile timezone**
- `synchronize: true` used for dev (use migrations in production)
- No capacity limits per offering

---

## API Documentation

Import `postman_collection.json` into Postman — tokens auto-save from login responses.

Or use Swagger UI at `/api/docs` when the app is running.
