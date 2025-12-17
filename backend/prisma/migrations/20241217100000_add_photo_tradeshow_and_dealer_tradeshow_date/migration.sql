-- Add tradeshow fields to Photo table
ALTER TABLE "csl"."Photo" ADD COLUMN "tradeshowName" TEXT;
ALTER TABLE "csl"."Photo" ADD COLUMN "tradeshowId" TEXT;

-- Add association date and notes to DealerTradeShow table
ALTER TABLE "csl"."DealerTradeShow" ADD COLUMN "associationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "csl"."DealerTradeShow" ADD COLUMN "notes" TEXT;

-- Create index for tradeshowId in Photo table
CREATE INDEX "Photo_tradeshowId_idx" ON "csl"."Photo"("tradeshowId");

