-- CreateTable
CREATE TABLE "resource" (
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_url" TEXT NOT NULL,
    "resource_size" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("resource_id")
);

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
