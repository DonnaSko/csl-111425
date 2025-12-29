-- Add content column to store audio file data in database
ALTER TABLE "csl"."VoiceRecording" 
ADD COLUMN "content" BYTEA;

-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."VoiceRecording" 
ALTER COLUMN "path" DROP NOT NULL;

