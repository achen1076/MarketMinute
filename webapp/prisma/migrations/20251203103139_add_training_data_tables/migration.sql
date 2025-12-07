-- CreateTable
CREATE TABLE "ticker_news_training" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ticker" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "news_url" TEXT,
    "stock_change_pct" DOUBLE PRECISION NOT NULL,
    "dow_change_pct" DOUBLE PRECISION NOT NULL,
    "sp_change_pct" DOUBLE PRECISION NOT NULL,
    "nasdaq_change_pct" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticker_news_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_news_training" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "headline" TEXT NOT NULL,
    "news_url" TEXT,
    "dow_change_pct" DOUBLE PRECISION NOT NULL,
    "sp_change_pct" DOUBLE PRECISION NOT NULL,
    "nasdaq_change_pct" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_news_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticker_news_training_date_idx" ON "ticker_news_training"("date");

-- CreateIndex
CREATE INDEX "ticker_news_training_ticker_idx" ON "ticker_news_training"("ticker");

-- CreateIndex
CREATE INDEX "ticker_news_training_created_at_idx" ON "ticker_news_training"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticker_news_training_date_ticker_headline_key" ON "ticker_news_training"("date", "ticker", "headline");

-- CreateIndex
CREATE INDEX "general_news_training_date_idx" ON "general_news_training"("date");

-- CreateIndex
CREATE INDEX "general_news_training_created_at_idx" ON "general_news_training"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "general_news_training_date_headline_key" ON "general_news_training"("date", "headline");
