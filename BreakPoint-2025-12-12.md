# BreakPoint - 2025-12-12

## Overview
- Hardened subscription flow to protect paid users from duplicate checkout.
- Added expiry email notifications with resubscribe link.
- Fixed build by adding nodemailer type definitions.

## Key Changes
- Backend: Block checkout session creation when a subscription is already active or trialing; return remaining days.
- Backend: Send one-time expiry email with a resubscribe link once a subscription lapses; track via `expiryEmailSentAt`.
- Backend: Added `nodemailer` email helper and SMTP config hooks; introduced `@types/nodemailer`.
- Prisma: Added `expiryEmailSentAt` column (migration `20251212000000_add_subscription_expiry_email`).
- Frontend: Subscription page now refreshes status on load, redirects paid users, shows days remaining, and guards subscribe buttons; handles `SUBSCRIPTION_EXISTS` gracefully.

## Required Environment
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL` (for expiry emails and links).

## Deployment Notes
- Run DB migration: `cd backend && npx prisma migrate deploy`.
- Backend build verified locally (`npm run build`).

## Latest Commits
- `473d838` Add nodemailer types to fix build
- `27d9dcf` Notify on subscription expiry with resubscribe link
- `905f17b` Guard paid users from duplicate checkout and show remaining days

## Status
- ✅ Code committed and pushed to `main`
- ✅ Backend build passes locally
- ⏳ Verify production deploy after migration and env config

