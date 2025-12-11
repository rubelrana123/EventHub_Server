/*
  Warnings:

  - You are about to drop the column `paymentId` on the `event_participators` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventParticipationId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_participators" DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "eventParticipationId" TEXT,
ADD COLUMN     "transactionId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_eventParticipationId_key" ON "payments"("eventParticipationId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_eventParticipationId_fkey" FOREIGN KEY ("eventParticipationId") REFERENCES "event_participators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
