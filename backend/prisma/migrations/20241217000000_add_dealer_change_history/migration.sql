-- CreateTable
CREATE TABLE "csl"."DealerChangeHistory" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerChangeHistory_dealerId_idx" ON "csl"."DealerChangeHistory"("dealerId");

-- CreateIndex
CREATE INDEX "DealerChangeHistory_fieldName_idx" ON "csl"."DealerChangeHistory"("fieldName");

-- CreateIndex
CREATE INDEX "DealerChangeHistory_createdAt_idx" ON "csl"."DealerChangeHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "csl"."DealerChangeHistory" ADD CONSTRAINT "DealerChangeHistory_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

