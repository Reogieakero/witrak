-- AlterTable "FeeProof": add admin-recorded payment details
ALTER TABLE "FeeProof" ADD COLUMN "method" TEXT;
ALTER TABLE "FeeProof" ADD COLUMN "reference" TEXT;
ALTER TABLE "FeeProof" ADD COLUMN "accountName" TEXT;
