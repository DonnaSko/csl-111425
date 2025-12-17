-- CreateTable
CREATE TABLE "csl"."EmailFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailFile_companyId_idx" ON "csl"."EmailFile"("companyId");

-- CreateIndex
CREATE INDEX "EmailFile_createdAt_idx" ON "csl"."EmailFile"("createdAt");

-- AddForeignKey
ALTER TABLE "csl"."EmailFile" ADD CONSTRAINT "EmailFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "csl"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

