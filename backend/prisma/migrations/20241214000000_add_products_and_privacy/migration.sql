-- AlterTable: Add new fields to Todo
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "emailSentDate" TIMESTAMP(3);
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "emailContent" TEXT;
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "followUp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "csl"."Todo" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Todo_type_idx" ON "csl"."Todo"("type");

-- CreateTable: Product
CREATE TABLE IF NOT EXISTS "csl"."Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DealerProduct
CREATE TABLE IF NOT EXISTS "csl"."DealerProduct" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PrivacyPermission
CREATE TABLE IF NOT EXISTS "csl"."PrivacyPermission" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PrivacyPermissionHistory
CREATE TABLE IF NOT EXISTS "csl"."PrivacyPermissionHistory" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "action" TEXT NOT NULL,
    "changedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyPermissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Product_companyId_name_key" ON "csl"."Product"("companyId", "name");
CREATE INDEX IF NOT EXISTS "Product_companyId_idx" ON "csl"."Product"("companyId");
CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "csl"."Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DealerProduct_dealerId_productId_key" ON "csl"."DealerProduct"("dealerId", "productId");
CREATE INDEX IF NOT EXISTS "DealerProduct_dealerId_idx" ON "csl"."DealerProduct"("dealerId");
CREATE INDEX IF NOT EXISTS "DealerProduct_productId_idx" ON "csl"."DealerProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PrivacyPermission_dealerId_permission_key" ON "csl"."PrivacyPermission"("dealerId", "permission");
CREATE INDEX IF NOT EXISTS "PrivacyPermission_dealerId_idx" ON "csl"."PrivacyPermission"("dealerId");
CREATE INDEX IF NOT EXISTS "PrivacyPermission_permission_idx" ON "csl"."PrivacyPermission"("permission");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivacyPermissionHistory_dealerId_idx" ON "csl"."PrivacyPermissionHistory"("dealerId");
CREATE INDEX IF NOT EXISTS "PrivacyPermissionHistory_permission_idx" ON "csl"."PrivacyPermissionHistory"("permission");
CREATE INDEX IF NOT EXISTS "PrivacyPermissionHistory_createdAt_idx" ON "csl"."PrivacyPermissionHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "csl"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "csl"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerProduct" ADD CONSTRAINT "DealerProduct_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."DealerProduct" ADD CONSTRAINT "DealerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "csl"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."PrivacyPermission" ADD CONSTRAINT "PrivacyPermission_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csl"."PrivacyPermissionHistory" ADD CONSTRAINT "PrivacyPermissionHistory_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "csl"."Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;



