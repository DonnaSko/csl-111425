-- CreateTable
CREATE TABLE IF NOT EXISTS "csl"."Group" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "csl"."DealerGroup" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Group_companyId_name_key" ON "csl"."Group"("companyId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Group_companyId_idx" ON "csl"."Group"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Group_name_idx" ON "csl"."Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DealerGroup_dealerId_groupId_key" ON "csl"."DealerGroup"("dealerId", "groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealerGroup_dealerId_idx" ON "csl"."DealerGroup"("dealerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealerGroup_groupId_idx" ON "csl"."DealerGroup"("groupId");

-- AddForeignKey
ALTER TABLE "csl"."Group" ADD CONSTRAINT "Group_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "csl"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerGroup" ADD CONSTRAINT "DealerGroup_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerGroup" ADD CONSTRAINT "DealerGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "csl"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

