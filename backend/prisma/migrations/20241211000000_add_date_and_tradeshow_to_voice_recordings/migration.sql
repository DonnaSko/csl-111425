-- AlterTable
ALTER TABLE "csl"."VoiceRecording" ADD COLUMN "date" TIMESTAMP(3),
ADD COLUMN "tradeshowName" TEXT;

-- CreateIndex
CREATE INDEX "VoiceRecording_date_idx" ON "csl"."VoiceRecording"("date");
