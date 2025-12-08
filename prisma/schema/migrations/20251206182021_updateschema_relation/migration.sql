-- AlterTable
ALTER TABLE "event_participators" ADD COLUMN     "participatorId" TEXT;

-- AddForeignKey
ALTER TABLE "event_participators" ADD CONSTRAINT "event_participators_participatorId_fkey" FOREIGN KEY ("participatorId") REFERENCES "participators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
