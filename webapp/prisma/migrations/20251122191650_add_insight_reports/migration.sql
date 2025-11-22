-- CreateTable
CREATE TABLE "insight_reports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cards" JSONB NOT NULL,
    "sentinel_report_id" TEXT,
    "user_id" TEXT,

    CONSTRAINT "insight_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_reports_created_at_idx" ON "insight_reports"("created_at");

-- CreateIndex
CREATE INDEX "insight_reports_sentinel_report_id_idx" ON "insight_reports"("sentinel_report_id");
