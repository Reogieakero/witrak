-- DropIndex
DROP INDEX "PaymentMethod_active_idx";

-- AlterTable
ALTER TABLE "Fee" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
