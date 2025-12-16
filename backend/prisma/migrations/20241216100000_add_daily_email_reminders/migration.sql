-- Add daily email reminders preference to User
ALTER TABLE "csl"."User" ADD COLUMN "dailyEmailReminders" BOOLEAN NOT NULL DEFAULT true;

