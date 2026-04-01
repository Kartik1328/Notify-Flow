# NotifyFlow — Backend API Engine

A production-grade Node.js backend demonstrating advanced backend concepts:
Rate Limiting, Job Queues, Email Retry, Delayed Scheduling, Audit Logging, and Health Monitoring.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22+ (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 8 |
| Cache / Queue | Redis 7 + BullMQ 5 |
| Auth | JWT + bcryptjs |
| Email | Nodemailer + Mailtrap |
| Validation | Joi |
| Logging | Winston |
| DevOps | Docker + Docker Compose |

---

## Architecture
```
Client Request
     │
     ▼
Rate Limiter (Redis)
     │
     ▼
Auth Middleware (JWT)
     │
     ▼
Route Handler
     │
     ├──► MongoDB (data + audit logs)
     │
     └──► BullMQ Queue (Redis)
               │
               ▼
          Background Worker
               │
               └──► Email (Nodemailer → Mailtrap)
```

---

## Features

### 1. Error Handling
- Custom `AppError` class with `statusCode` and `isOperational` flag
- `asyncWrapper` eliminates try/catch boilerplate in every controller
- Global error middleware normalizes Mongoose, JWT, and validation errors
- Dev mode returns full stack trace; production hides internals

### 2. Redis Rate Limiter
- 100 requests/minute per user (or IP for unauthenticated)
- Uses Redis `INCR` + `PEXPIRE` for atomic counting
- Returns standard `X-RateLimit-Limit/Remaining/Reset` headers
- Returns `429 Too Many Requests` when limit exceeded

### 3. Audit Log System
- Auto-logs every API action to MongoDB via `res.json()` interception
- Captures: user, action, endpoint, status code, response time, IP, user agent
- Sanitizes sensitive fields (password, token) before storing
- Uses `setImmediate` so logging never blocks the response
- Indexed by `userId + createdAt` for fast queries

### 4. Email Retry System
- BullMQ email queue with up to 5 retry attempts
- Exponential backoff: 2s → 4s → 8s → 16s → 32s between retries
- Worker processes 5 concurrent emails
- Failed jobs preserved in Redis for inspection

### 5. Delayed Job Scheduler
- Schedule any job to run at a future timestamp
- BullMQ holds job in `delayed` state until scheduled time fires
- Job persisted in MongoDB with status tracking
- Supports `SEND_REMINDER` and `GENERATE_REPORT` job types
- Jobs can be cancelled before execution

### 6. API Health Monitor
- `/api/v1/health` checks all critical dependencies in real time
- MongoDB ping, Redis ping, BullMQ queue stats, system memory
- Returns `503` if any dependency is unhealthy
- Used by load balancers and uptime monitors

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker + Docker Compose

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/notifyflow-backend.git
cd notifyflow-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your values. For email, sign up at [mailtrap.io](https://mailtrap.io) (free).

### 4. Start Docker services
```bash
docker compose up -d
```
This starts:
- MongoDB on port `27017`
- Redis on port `6380`
- Redis Commander UI on port `8081`

### 5. Start the server
```bash
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT token |

### Jobs
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/jobs` | Schedule a new job | ✅ |
| GET | `/api/v1/jobs` | List your jobs | ✅ |
| DELETE | `/api/v1/jobs/:id` | Cancel a pending job | ✅ |

### Audit
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/audit` | View all audit logs | ✅ |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Full system health check |

---

## Job Types

### SEND_REMINDER
Sends an email at the scheduled time.
```json
{
  "type": "SEND_REMINDER",
  "scheduledAt": "2026-04-02T10:00:00.000Z",
  "payload": {
    "email": "user@example.com",
    "subject": "Your Reminder",
    "message": "Don't forget!"
  }
}
```

### GENERATE_REPORT
Runs a background report generation task.
```json
{
  "type": "GENERATE_REPORT",
  "scheduledAt": "2026-04-02T10:00:00.000Z",
  "payload": {
    "userId": "abc123",
    "reportType": "monthly"
  }
}
```

---

## Project Structure
```
src/
├── config/         # DB, Redis, Mailer, Env validation
├── middlewares/    # Auth, Rate limiter, Error handler, Audit logger, Validate
├── models/         # User, Job, AuditLog (Mongoose schemas)
├── modules/
│   ├── auth/       # Register, Login
│   ├── jobs/       # Schedule, List, Cancel
│   ├── audit/      # Query audit logs
│   └── health/     # Health monitor
├── queues/
│   ├── emailQueue.js
│   ├── jobQueue.js
│   └── workers/    # emailWorker, jobWorker
├── utils/          # AppError, asyncWrapper, logger
├── app.js
└── server.js
```

---

## Key Concepts Demonstrated

- **BullMQ delayed jobs** with exponential backoff retry
- **Redis-based rate limiting** with sliding window
- **MongoDB audit logging** via response interception
- **Graceful shutdown** handling SIGTERM/SIGINT
- **Joi environment validation** — crash fast if config is missing
- **ES Modules** throughout (`import/export`, `"type": "module"`)
- **Express 5** with native async error handling
```

---

## 2. Create `.env.example` — make sure this is clean
```
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/notifyflow

REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=redis123

JWT_SECRET=your_super_secret_key_minimum_16_chars
JWT_EXPIRES_IN=7d

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
EMAIL_FROM=noreply@notifyflow.dev

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
