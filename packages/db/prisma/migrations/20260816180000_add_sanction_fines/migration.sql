-- CreateTable
CREATE TABLE "SanctionFine" (
    "id" TEXT NOT NULL,
    "absenceCount" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SanctionFine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SanctionFine_absenceCount_key" ON "SanctionFine"("absenceCount");

-- AlterTable
ALTER TABLE "Sanction" ADD COLUMN "fineId" TEXT;

-- CreateIndex
CREATE INDEX "Sanction_fineId_idx" ON "Sanction"("fineId");

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_fineId_fkey" FOREIGN KEY ("fineId") REFERENCES "SanctionFine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
