# REST API

## Overview

This project is a NestJS-based REST API for managing two resource groups:

- `users`
- `employees`

The application exposes HTTP endpoints under the `/api` prefix and uses Prisma for database access. It also includes request throttling, a custom logger, and a global exception filter.

## What The Project Does

The API currently provides:

- CRUD-style routes for `users`
- CRUD-style routes for `employees`
- request rate limiting with `@nestjs/throttler`
- centralized exception handling
- custom file and console logging

Examples of mapped routes in the current app:

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`

## Technologies Used

- `NestJS`
- `TypeScript`
- `Prisma ORM`
- `PostgreSQL`
- `Neon`
- `@nestjs/throttler`
- `dotenv`
- `Jest`
- `ESLint`
- `Prettier`

## Project Structure

- `src/main.ts`
  bootstraps the Nest application, applies the `/api` prefix, enables CORS, and registers the global exception filter
- `src/app.module.ts`
  wires application modules together
- `src/users/`
  contains the users controller and service
- `src/employees/`
  contains the employees controller and service
- `src/database/`
  contains Prisma database setup
- `src/my-logger/`
  contains the custom logger service
- `prisma/schema.prisma`
  defines the Prisma data model
- `prisma/migrations/`
  contains database migrations

## Setup

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm run start:dev
```

Run tests:

```bash
npm run test
npm run test:e2e
```

## Environment

The app expects a `DATABASE_URL` environment variable in `.env`.

Current database stack in the repo:

- Prisma client
- Neon adapter for PostgreSQL

## Investigation Log: Employee 500 Error

### Symptom

All requests hitting employee endpoints were returning `500 Internal Server Error`.

Confirmed example:

```bash
curl -i http://127.0.0.1:3000/api/employees
```

Observed response:

```json
{
  "statusCode": 500,
  "timeStamp": "...",
  "path": "/api/employees",
  "response": "INTERNAL SERVER ERROR"
}
```

### Initial Cause Found

An earlier schema mismatch existed between Prisma and the database:

- Prisma model `Employee` defined a required `name` field
- the original migration created the `employee` table without a `name` column

That mismatch was a valid failure source and was identified during debugging.

### What Was Checked

- `EmployeesController`
- `EmployeesService`
- `DatabaseService`
- Prisma schema
- Prisma migrations
- live endpoint behavior
- direct Prisma query behavior
- Nest service-level behavior

### Raw Runtime Error Observed

When the exception filter was temporarily instrumented to expose the underlying failure, the employee query path produced a driver-level error from Neon rather than an employee business-logic error.

Observed failure shape:

```text
ErrorEvent { type: 'error', ... }
```

Additional direct adapter tests produced concrete network failures such as:

```text
NeonDbError: Error connecting to database: TypeError: fetch failed
```

and timeout failures such as:

```text
ETIMEDOUT
```

### Fix Attempts Made

The following were tested during the investigation:

1. Verified Prisma migration state with `prisma migrate status`
2. Tested direct Prisma employee queries outside the controller path
3. Switched from `PrismaNeon` to plain `PrismaClient`
4. Added `url = env("DATABASE_URL")` to `schema.prisma`
5. Reverted that change when Prisma 7 rejected schema-level datasource URLs
6. Tested Neon fetch-based query mode with `poolQueryViaFetch`
7. Tested lazy query behavior without eager `$connect()`
8. Tested `PrismaNeonHttp`
9. Tested `@prisma/adapter-pg`
10. Tested alternative connection string variants

### Outcome Of Attempts

None of the tested connection/runtime changes fixed the employee endpoint reliably in this environment.

Per the working rule used during debugging:

- failed code changes were reverted
- original app logic and connection setup were restored after unsuccessful attempts

### Current Conclusion

The remaining employee `500` does not appear to come from controller or service CRUD logic.

The most likely source is database connectivity/runtime behavior between this Nest app and the configured Neon database, specifically in the Prisma adapter/driver path.


