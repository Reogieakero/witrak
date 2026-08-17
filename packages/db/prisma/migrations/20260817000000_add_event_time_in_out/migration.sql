-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "hasTimeInOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateGraceMinutes" INTEGER NOT NULL DEFAULT 0;
