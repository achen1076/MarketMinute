-- CreateTable
CREATE TABLE "user_visit_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,

    CONSTRAINT "user_visit_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_watchlist_summaries" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "avg_change_pct" DOUBLE PRECISION NOT NULL,
    "best_performer" TEXT,
    "best_change_pct" DOUBLE PRECISION,
    "worst_performer" TEXT,
    "worst_change_pct" DOUBLE PRECISION,
    "summary_text" TEXT NOT NULL,
    "full_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_watchlist_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_visit_snapshots_user_id_watchlist_id_idx" ON "user_visit_snapshots"("user_id", "watchlist_id");

-- CreateIndex
CREATE INDEX "daily_watchlist_summaries_watchlist_id_idx" ON "daily_watchlist_summaries"("watchlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_watchlist_summaries_watchlist_id_date_key" ON "daily_watchlist_summaries"("watchlist_id", "date");
