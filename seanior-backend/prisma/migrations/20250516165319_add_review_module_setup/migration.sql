/*
  Warnings:

  - You are about to drop the `review` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "review" DROP CONSTRAINT "review_enrollment_id_fkey";

-- DropTable
DROP TABLE "review";

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_enrollment_id_key" ON "reviews"("enrollment_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE CASCADE ON UPDATE CASCADE;
