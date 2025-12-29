-- CreateTable
CREATE TABLE IF NOT EXISTS "csl"."BuyingGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BuyingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "csl"."DealerBuyingGroupHistory" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "buyingGroupId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerBuyingGroupHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BuyingGroup_companyId_name_key" ON "csl"."BuyingGroup"("companyId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BuyingGroup_companyId_idx" ON "csl"."BuyingGroup"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BuyingGroup_name_idx" ON "csl"."BuyingGroup"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BuyingGroup_deletedAt_idx" ON "csl"."BuyingGroup"("deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealerBuyingGroupHistory_dealerId_idx" ON "csl"."DealerBuyingGroupHistory"("dealerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealerBuyingGroupHistory_buyingGroupId_idx" ON "csl"."DealerBuyingGroupHistory"("buyingGroupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealerBuyingGroupHistory_endDate_idx" ON "csl"."DealerBuyingGroupHistory"("endDate");

-- AddForeignKey
ALTER TABLE "csl"."BuyingGroup" ADD CONSTRAINT "BuyingGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "csl"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerBuyingGroupHistory" ADD CONSTRAINT "DealerBuyingGroupHistory_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerBuyingGroupHistory" ADD CONSTRAINT "DealerBuyingGroupHistory_buyingGroupId_fkey" FOREIGN KEY ("buyingGroupId") REFERENCES "csl"."BuyingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;










