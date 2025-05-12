/*
  Warnings:

  - You are about to drop the column `coach_id` on the `swimming_course` table. All the data in the column will be lost.
  - You are about to drop the column `price_max` on the `swimming_course` table. All the data in the column will be lost.
  - You are about to drop the column `price_min` on the `swimming_course` table. All the data in the column will be lost.
  - Added the required column `instructor_id` to the `swimming_course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `swimming_course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_students` to the `swimming_course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `swimming_course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule` to the `swimming_course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "swimming_course" DROP CONSTRAINT "swimming_course_coach_id_fkey";

-- AlterTable
ALTER TABLE "swimming_course" DROP COLUMN "coach_id",
DROP COLUMN "price_max",
DROP COLUMN "price_min",
ADD COLUMN     "course_image" TEXT,
ADD COLUMN     "instructor_id" TEXT NOT NULL,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "max_students" INTEGER NOT NULL,
ADD COLUMN     "pool_image" TEXT,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "schedule" JSONB NOT NULL,
ADD COLUMN     "students" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "study_frequency" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "swimming_course" ADD CONSTRAINT "swimming_course_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
