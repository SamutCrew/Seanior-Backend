/*
  Warnings:

  - You are about to drop the column `image` on the `swimming_course` table. All the data in the column will be lost.
  - Changed the type of `schedule` on the `swimming_course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "swimming_course" DROP COLUMN "image",
ADD COLUMN     "course_image" TEXT,
ADD COLUMN     "pool_image" TEXT,
DROP COLUMN "schedule",
ADD COLUMN     "schedule" JSONB NOT NULL,
ALTER COLUMN "study_frequency" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'thb',
    "stripeCheckoutSessionId" TEXT,
    "courseId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripeCheckoutSessionId_key" ON "bookings"("stripeCheckoutSessionId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "swimming_course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
