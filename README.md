# SalonFlow

SalonFlow is a multi-tenant salon SaaS built on Next.js App Router with Neon PostgreSQL, Drizzle ORM, Auth.js authentication, Razorpay billing, and WhatsApp messaging abstractions.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- Auth.js
- Razorpay
- Recharts

## Run locally

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` into `.env.local` and set:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_TOKEN`

## Auth flow

- Auth.js handles sign in, sign out, and sessions through the credentials provider.
- Registration provisions salon owners directly in Neon and then signs them in through Auth.js.
- Application users live in the `users` table with `role`, `salonId`, and `passwordHash`.
- Tenant resolution happens server-side through `getSessionContext()` and `getCurrentSalonId()`.
- Dashboard routes are protected in `proxy.ts`; public marketing, pricing, login, and registration routes remain open.

## Billing lifecycle

- `trial` for onboarding
- `active` on successful first or recurring payment
- `past_due` when Razorpay renewal fails
- `overdue` after the grace window
- `expired` for long-overdue accounts
- `canceled` or `paused` for manual lifecycle changes

Read-only enforcement is applied through session-aware guards in actions and route handlers.

## Database

- Schema lives in [db/schema.ts](/c:/front-end/Next.js%20projects/Salon/db/schema.ts:1)
- Drizzle config lives in [drizzle.config.ts](/c:/front-end/Next.js%20projects/Salon/drizzle.config.ts:1)
- Migration runner lives in [db/migrate.ts](/c:/front-end/Next.js%20projects/Salon/db/migrate.ts:1)
- Seed script lives in [scripts/seed-demo.mjs](/c:/front-end/Next.js%20projects/Salon/scripts/seed-demo.mjs:1)

## Cron and webhooks

Trigger `POST /api/cron/daily` from Vercel Cron for:

- overdue conversion
- read-only enforcement
- reminder workflows
- daily billing checks

Register the Razorpay webhook URL at `/api/webhooks/razorpay`.

## Deployment

Deploy to Vercel, add the environment variables, provision Neon, run Drizzle migrations, and configure Razorpay + Cron endpoints.
