-- CreateTable
CREATE TABLE "instructor_request" (
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "profile_image" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "education_record" TEXT NOT NULL,
    "id_card_url" TEXT NOT NULL,
    "contact_channels" JSONB NOT NULL,
    "swimming_instructor_license" TEXT NOT NULL,
    "teaching_history" TEXT,
    "additional_skills" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_request_pkey" PRIMARY KEY ("request_id")
);

-- AddForeignKey
ALTER TABLE "instructor_request" ADD CONSTRAINT "instructor_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
