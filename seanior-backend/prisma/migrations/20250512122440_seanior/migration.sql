/*
  Warnings:

  - You are about to drop the column `course_image` on the `swimming_course` table. All the data in the column will be lost.
  - You are about to drop the column `pool_image` on the `swimming_course` table. All the data in the column will be lost.
  - Changed the type of `study_frequency` on the `swimming_course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "swimming_course" DROP COLUMN "course_image",
DROP COLUMN "pool_image",
ADD COLUMN     "image" TEXT,
DROP COLUMN "study_frequency",
ADD COLUMN     "study_frequency" INTEGER NOT NULL,
ALTER COLUMN "schedule" SET DATA TYPE TEXT;
