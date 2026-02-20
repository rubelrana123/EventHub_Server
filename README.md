# EventHub Backend API

Backend API for EventHub, built with Express, TypeScript, and Prisma.

## Overview
EventHub Backend provides:
- Authentication and authorization (JWT + role-based access)
- Event management for hosts/admins
- Participator booking and history features
- Admin management endpoints
- Review and rating workflows
- Payment integration (Stripe webhook + payment module)

## Tech Stack
- Node.js + Express 5
- TypeScript
- Prisma ORM
- PostgreSQL (via `DATABASE_URL`)
- JWT authentication
- Stripe
- Cloudinary (media upload)
- Nodemailer (email workflows)

## API Base URL
Default local base URL:
- `http://localhost:5000/api/v1`

Health check:
- `GET /`

## Main Route Modules
Mounted in `src/app/routes/index.ts`:
- `/auth`
- `/user`
- `/admin`
- `/host`
- `/host-application`
- `/participator`
- `/event`

Special route:
- `POST /webhook` (Stripe webhook, mounted outside `/api/v1`)

## Project Structure
```txt
src/
  app/
    modules/
      auth/
      user/
      admin/
      host/
      hostApplication/
      participator/
      event/
      review/
      payment/
    middlewares/
    routes/
  config/
prisma/
```

## Environment Variables
Create `.env` in `EventHub Server/`.

### Core
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/eventhub
```

### JWT / Auth
```env
JWT_SECRET=your_access_token_secret
EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=10
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=strong_password
RESET_PASS_LINK=http://localhost:3000/reset-password
```

### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Email
```env
EMAIL_SENDER_EMAIL=your_email@example.com
EMAIL_SENDER_APP_PASS=your_app_password
```

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Optional SSLCommerz (if enabled)
```env
STORE_ID=...
STORE_PASS=...
SUCCESS_URL=...
CANCEL_URL=...
FAIL_URL=...
SSL_PAYMENT_API=...
SSL_VALIDATIOIN_API=...
```

## Installation and Run
From `EventHub Server/`:

```bash
# install
bun install
# or
npm install

# generate prisma client
bun run db:generate
# or
npm run db:generate

# sync schema (choose one flow)
bun run db:push
# or
npm run db:push

# start dev server
bun run dev
# or
npm run dev
```

API runs on `http://localhost:5000` by default.

## Scripts
- `bun run dev` / `npm run dev`: development server (ts-node-dev)
- `bun run build` / `npm run build`: compile TypeScript to `dist/`
- `bun run start` / `npm run start`: run compiled server
- `bun run db:generate`: generate Prisma client
- `bun run db:migrate`: run Prisma migrate workflow
- `bun run db:push`: push schema to database
- `bun run db:pull`: introspect DB schema
- `bun run db:studio`: open Prisma Studio
- `bun run stripe:webhook`: forward Stripe events locally

## CORS and Frontend Integration
Current CORS origin in `src/app.ts` is configured for:
- `http://localhost:3000`

If frontend URL changes, update CORS origin accordingly.

## Deployment Checklist
- Set all required env vars in hosting platform.
- Run Prisma generate/migration in build or release step.
- Ensure webhook endpoint is publicly reachable for Stripe.
- Set production frontend URL for redirect/payment callbacks.

## Notes
- Keep route naming consistent between frontend and backend (for example, backend uses `/event` as singular route path).
- For stable production behavior, avoid hardcoded localhost URLs in source and rely on env config.
