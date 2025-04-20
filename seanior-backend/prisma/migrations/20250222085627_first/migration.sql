-- CreateTable
CREATE TABLE "user" (
    "user_id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "profile_img" TEXT,
    "user_type" TEXT,
    "description" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "swimming_course" (
    "course_id" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "price_min" INTEGER NOT NULL,
    "price_max" INTEGER NOT NULL,
    "pool_type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "course_duration" INTEGER NOT NULL,
    "study_frequency" INTEGER NOT NULL,
    "days_study" INTEGER NOT NULL,
    "number_of_total_sessions" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swimming_course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "request" (
    "request_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "request_price" INTEGER NOT NULL,
    "request_location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "enrollment_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "review" (
    "review_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "attendance_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "attendance_status" TEXT NOT NULL,
    "reason_for_absence" TEXT,
    "date_attendance" TIMESTAMP(3) NOT NULL,
    "requested_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "payment" (
    "payment_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "session_progress" (
    "session_progress_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "topic_covered" TEXT NOT NULL,
    "performance_notes" TEXT NOT NULL,
    "attendance" TEXT NOT NULL,
    "date_session" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_progress_pkey" PRIMARY KEY ("session_progress_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_firebase_uid_key" ON "user"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_request_id_key" ON "enrollment"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_enrollment_id_key" ON "review"("enrollment_id");

-- AddForeignKey
ALTER TABLE "swimming_course" ADD CONSTRAINT "swimming_course_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "swimming_course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_progress" ADD CONSTRAINT "session_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("enrollment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
