/*
  Warnings:

  - The `status` column on the `enrollment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `max_sessions_allowed` to the `enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_sessions_to_complete` to the `enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "enrollment" ADD COLUMN     "actual_sessions_attended" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_sessions_allowed" INTEGER NOT NULL,
ADD COLUMN     "target_sessions_to_complete" INTEGER NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "swimming_course" ADD COLUMN     "allowed_absence_buffer" INTEGER DEFAULT 2;
