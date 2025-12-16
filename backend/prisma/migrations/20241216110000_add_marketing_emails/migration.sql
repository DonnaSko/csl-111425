-- Add marketing emails preference to User
ALTER TABLE "csl"."User" ADD COLUMN "marketingEmails" BOOLEAN NOT NULL DEFAULT false;

