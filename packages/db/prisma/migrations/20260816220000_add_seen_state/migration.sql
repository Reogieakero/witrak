-- CreateTable
CREATE TABLE "SeenState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeenState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeenState_userId_section_key" ON "SeenState"("userId", "section");

-- CreateIndex
CREATE INDEX "SeenState_userId_idx" ON "SeenState"("userId");

-- AddForeignKey
ALTER TABLE "SeenState" ADD CONSTRAINT "SeenState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
