/*
  Warnings:

  - You are about to drop the column `selected_day_of_week` on the `request` table. All the data in the column will be lost.
  - You are about to drop the column `selected_time` on the `request` table. All the data in the column will be lost.
  - Added the required column `requestDayOfWeek` to the `request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestTimeSlot` to the `request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "request" DROP COLUMN "selected_day_of_week",
DROP COLUMN "selected_time",
ADD COLUMN     "requestDayOfWeek" TEXT NOT NULL,
ADD COLUMN     "requestTimeSlot" TEXT NOT NULL;
