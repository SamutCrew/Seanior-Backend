/*
  Warnings:

  - Made the column `end_date` on table `enrollment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "enrollment" ALTER COLUMN "end_date" SET NOT NULL;
