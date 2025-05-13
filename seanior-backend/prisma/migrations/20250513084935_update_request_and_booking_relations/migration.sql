/*
  Warnings:

  - The `status` column on the `request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[requestId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED_PENDING_PAYMENT', 'REJECTED_BY_INSTRUCTOR', 'PAID_AND_ENROLLED', 'CANCELLED_BY_STUDENT');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "request" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';

-- CreateIndex
CREATE UNIQUE INDEX "bookings_requestId_key" ON "bookings"("requestId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
