-- CreateTable
CREATE TABLE "macro_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "macro_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticker_events" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticker_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentinel_reports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "key_drivers" JSONB NOT NULL,
    "macro_context" TEXT,
    "scenario_questions" JSONB NOT NULL,
    "index_move" BOOLEAN NOT NULL,
    "sector_rotation" BOOLEAN NOT NULL,
    "macro_surprise" BOOLEAN NOT NULL,
    "vol_spike" BOOLEAN NOT NULL,
    "vix" DOUBLE PRECISION,
    "vix_change_pct" DOUBLE PRECISION,
    "realized_vol" DOUBLE PRECISION,
    "context" JSONB NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "sentinel_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "macro_events_date_idx" ON "macro_events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "macro_events_type_date_key" ON "macro_events"("type", "date");

-- CreateIndex
CREATE INDEX "ticker_events_symbol_idx" ON "ticker_events"("symbol");

-- CreateIndex
CREATE INDEX "ticker_events_date_idx" ON "ticker_events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ticker_events_symbol_type_date_key" ON "ticker_events"("symbol", "type", "date");

-- CreateIndex
CREATE INDEX "sentinel_reports_created_at_idx" ON "sentinel_reports"("created_at");

-- CreateIndex
CREATE INDEX "sentinel_reports_index_move_idx" ON "sentinel_reports"("index_move");

-- CreateIndex
CREATE INDEX "sentinel_reports_sector_rotation_idx" ON "sentinel_reports"("sector_rotation");

-- CreateIndex
CREATE INDEX "sentinel_reports_macro_surprise_idx" ON "sentinel_reports"("macro_surprise");

-- CreateIndex
CREATE INDEX "sentinel_reports_vol_spike_idx" ON "sentinel_reports"("vol_spike");
