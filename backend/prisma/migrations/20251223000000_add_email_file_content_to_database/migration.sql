-- AlterTable: Add content column to store file data in database
-- Make path nullable since we'll use content instead
ALTER TABLE "csl"."EmailFile" 
ADD COLUMN "content" BYTEA;

ALTER TABLE "csl"."EmailFile" 
ALTER COLUMN "path" DROP NOT NULL;

