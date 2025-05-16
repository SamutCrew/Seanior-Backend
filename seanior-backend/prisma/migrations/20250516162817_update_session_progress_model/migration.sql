/*
  Warnings:

  - You are about to drop the `session_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "session_progress" DROP CONSTRAINT "session_progress_enrollment_id_fkey";

-- DropTable
DROP TABLE "session_progress";

-- CreateTable
CREATE TABLE "session_progresses" (
    "session_progress_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "topic_covered" TEXT NOT NULL,
    "performance_notes" TEXT NOT NULL,
    "date_session" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_progresses_pkey" PRIMARY KEY ("session_progress_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_progresses_enrollment_id_session_number_key" ON "session_progresses"("enrollment_id", "session_number");

-- AddForeignKey
ALTER TABLE "session_progresses" ADD CONSTRAINT "session_progresses_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
