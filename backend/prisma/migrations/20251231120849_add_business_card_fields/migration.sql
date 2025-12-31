-- AlterTable
ALTER TABLE "csl"."User" ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "businessDescription" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "callToAction" TEXT;

-- CreateTable
CREATE TABLE "csl"."BusinessCardHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "businessPhone" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "businessDescription" TEXT,
    "tagline" TEXT,
    "callToAction" TEXT,
    "changeReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCardHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessCardHistory_userId_idx" ON "csl"."BusinessCardHistory"("userId");

-- CreateIndex
CREATE INDEX "BusinessCardHistory_changedAt_idx" ON "csl"."BusinessCardHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "csl"."BusinessCardHistory" ADD CONSTRAINT "BusinessCardHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "csl"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

