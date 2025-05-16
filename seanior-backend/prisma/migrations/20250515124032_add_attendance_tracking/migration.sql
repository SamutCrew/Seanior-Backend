/*
  Warnings:

  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_enrollment_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_requested_by_fkey";

-- DropTable
DROP TABLE "attendance";

-- CreateTable
CREATE TABLE "attendances" (
    "attendance_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "attendance_status" "AttendanceStatus" NOT NULL,
    "reason_for_absence" TEXT,
    "date_attendance" TIMESTAMP(3) NOT NULL,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendances_enrollment_id_session_number_key" ON "attendances"("enrollment_id", "session_number");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
