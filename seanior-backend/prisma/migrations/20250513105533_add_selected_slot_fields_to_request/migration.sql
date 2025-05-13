/*
  Warnings:

  - Added the required column `selected_day_of_week` to the `request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selected_time` to the `request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "request" ADD COLUMN     "selected_day_of_week" TEXT NOT NULL,
ADD COLUMN     "selected_time" TEXT NOT NULL;
