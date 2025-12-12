-- Add expiryEmailSentAt to track whether we already notified the user
ALTER TABLE "csl"."Subscription"
ADD COLUMN "expiryEmailSentAt" TIMESTAMP(3);

