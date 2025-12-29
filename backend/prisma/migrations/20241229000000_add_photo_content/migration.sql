-- Add content column to store photo data in database
ALTER TABLE "csl"."Photo" 
ADD COLUMN "content" BYTEA;

-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."Photo" 
ALTER COLUMN "path" DROP NOT NULL;

