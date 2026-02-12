# Payment Gateway

A backend REST API for managing accounts and processing financial transactions, built with Node.js, Express, TypeScript, and PostgreSQL.

---

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (ESM)
- **Framework**: Express v5
- **Database**: PostgreSQL 15
- **Testing**: Vitest + Supertest
- **Logging**: Custom file-rotation logger

---

## Prerequisites

- Node.js v20+
- PostgreSQL 15

---

## Installation

```bash
git clone <repo-url>
cd payment-gateway
npm install
```

---

## Configuration

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

**.env fields:**

```env
ENV=dev

DB_HOST=localhost
DB_PORT=5433
DB_USER=your_pg_user
DB_PASSWORD=your_pg_password
DB_NAME=payment_gateway

PORT=8080

DB_MAX_CONNECTIONS=25
DB_IDLE_CONNECTIONS=5

LOG_LEVEL=INFO          # DEBUG | INFO | WARN | ERROR
LOG_TO_FILE=true
LOG_DIR=./logs
LOG_FILE_TIME_INTERVAL=H1   # M1 | M10 | H1 | H6 | H12 | D1
```

---

## Database Setup

```bash
# Create DB and run schema
bash database/setup.sh
```

The script will create the database if it doesn't exist and apply the schema automatically.

---

## Running

```bash
# Development (with hot reload)
npm run dev:nodemon

# Development (single run)
npm run dev

# Production
npm run build && npm start
```

Server starts on port `3000` by default.

---

## API Reference

> All endpoints are versioned. Use `/v1/` for synchronous (direct DB) processing, `/v2/` for async queue-based processing.

---

### V1 — Synchronous

#### Create Account

```
POST /v1/account
```

**Body:**
```json
{
  "account_id": "ACC001",
  "initial_balance": 1000.50
}
```

**Response `201`:**
```json
{
  "data": {
    "account_id": "ACC001",
    "balance": "1000.5000000",
    "created_at": "2026-02-12T10:00:00.000Z"
  },
  "message": "Account created successfully"
}
```

---

#### Get Balance

```
GET /v1/account/:account_id
```

**Response `200`:**
```json
{
  "account_id": "ACC001",
  "balance": "1000.5000000",
  "created_at": "2026-02-12T10:00:00.000Z"
}
```

---

#### Process Transaction

```
POST /v1/transactions
```

**Body:**
```json
{
  "source_account_id": "ACC001",
  "destination_account_id": "ACC002",
  "amount": 100.25
}
```

**Response `201`:**
```json
{
  "transaction_id": 1,
  "source_account_id": "ACC001",
  "destination_account_id": "ACC002",
  "amount": "100.2500000",
  "created_at": "2026-02-12T10:00:00.000Z"
}
```

---

### V2 — Async Queue

#### Create Account (same as V1)

```
POST /v2/account
```

#### Get Balance (same as V1)

```
GET /v2/account/:account_id
```

#### Queue a Transaction

```
POST /v2/transactions
```

**Body:** same as V1

**Response `202`:**
```json
{
  "jobId": "TXN-1234567890-abc1234",
  "status": "Processing"
}
```

---

#### Get Transaction Status

```
GET /v2/transactions/status/:jobId
```

**Response `200` (processing):**
```json
{
  "request_id": "req-...",
  "status": "PROCESSING",
  "queue_position": 3
}
```

**Response `200` (success):**
```json
{
  "request_id": "req-...",
  "status": "SUCCESS",
  "transaction_id": 1,
  "source_account_id": "ACC001",
  "destination_account_id": "ACC002",
  "amount": "100.2500000",
  "created_at": "2026-02-12T10:00:00.000Z"
}
```

---

## Testing

```bash
# Setup test database
npm run test:db:setup

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are split into:

- **Unit tests** — controllers and services with mocked dependencies (`tests/unit/`)
- **Integration tests** — full API against a real test DB (`tests/integration/`)

---

## Project Structure

```
src/
├── app.ts                  # Express app (routes, middleware)
├── index.ts                # Entry point (listen)
├── dbConnect.ts            # PostgreSQL connection pool
├── middleware.ts           # Error handler, request logger
├── controllers/
│   ├── account.ts
│   └── transaction.ts
├── services/
│   ├── account.ts
│   └── transaction.ts
├── queue/
│   └── transaction-queue.ts  # Async in-memory transaction queue
└── utils/
    ├── loggers.ts          # File-rotation logger
    └── utils.ts            # Response helper, ID generator
database/
├── schema.sql
├── setup.sh                # Dev DB setup
└── setup-test.sh           # Test DB setup
tests/
├── unit/
│   ├── controllers/
│   └── services/
└── integration/
```

---

## Assumptions

### 0.1.0

- **Amount precision**: Balances and transaction amounts are stored as `NUMERIC(20,7)` supporting up to 7 decimal places, 2 decimal more for more precision.
- **Account IDs**: String-based (`VARCHAR(20)`), provided by the client (not auto-generated).
- **Concurrency**: Transactions use `SELECT ... FOR UPDATE` with first locking source account, check balance then destination account, verify balance do process further and release lock.
- **No authentication**: Endpoints are unauthenticated — auth is out of scope.
- **Amount validation**: Zero and negative amounts are rejected at the controller level.
- **Self-transfer**: Transactions between the same account are rejected.

### 0.2.0

- **Concurrency and less query**: Transactions use `SELECT ... FOR UPDATE` and lock both account with oldest-account-first lock ordering to prevent deadlocks.
- **Log rotation**: Log files rotate based on a configurable time interval (default: 1 hour). On server restart, the latest log file is resumed if still within the rotation window.

### 1.0.0

- **Load Handling using queue**:
  - old approach - earlier transaction processing path
    - client -> controller -> service -> db.
  - new approach
    - client -> controller -> queue -> service -> db.
    - now all transaction are added to in-memory queue and start processing in concurrently (up to DB_MAX_CONNECTIONS parallel worker), when worker completes the next job from queue to fills that slot which prevents db connection pool exhaustion under high load.
    - end point will return job id, which client poll and fetch result after timeinterval.
