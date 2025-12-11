/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `event_participators` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "event_participators" ADD COLUMN     "paymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_participators_paymentId_key" ON "event_participators"("paymentId");
