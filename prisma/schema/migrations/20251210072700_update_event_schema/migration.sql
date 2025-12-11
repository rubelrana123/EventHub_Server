-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'REGISTRATION_CLOSED', 'LIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "event_participators" ADD COLUMN     "isBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "availableSeats" INTEGER,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING';
