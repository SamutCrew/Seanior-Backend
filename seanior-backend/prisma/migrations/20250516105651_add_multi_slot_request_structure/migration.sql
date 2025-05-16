/*
  Warnings:

  - You are about to drop the `request` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_requestId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_request_id_fkey";

-- DropForeignKey
ALTER TABLE "request" DROP CONSTRAINT "request_course_id_fkey";

-- DropForeignKey
ALTER TABLE "request" DROP CONSTRAINT "request_student_id_fkey";

-- DropTable
DROP TABLE "request";

-- CreateTable
CREATE TABLE "requests" (
    "request_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "request_price" INTEGER NOT NULL,
    "request_location" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date_for_first_week" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "requested_slots" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "requested_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requested_slots_requestId_dayOfWeek_startTime_endTime_key" ON "requested_slots"("requestId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "swimming_course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_slots" ADD CONSTRAINT "requested_slots_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
