# MarketMinute

https://marketminute.io/

**Your automated minute view of the markets.**

MarketMinute is a full-stack financial intelligence platform that combines real-time market data, AI-powered insights, and institutional-grade quantitative trading capabilities. Get instant market summaries, track custom watchlists, and leverage machine learning models for trading signals—all in one unified dashboard.

---

## 🆕 Recent Updates

### AI Chat Agent & MCP Tools (v2.3 - Dec 2025)

- **🤖 AI Chat Interface** - Conversational agent for market queries at `/chat`
- **🔧 Model Context Protocol (MCP)** - 20+ tools for AI agent to access MarketMinute data
  - Market: `get_quote_snapshot`, `get_top_movers`, `get_market_summary`
  - User: `get_watchlists`, `get_alerts`, `create_watchlist`, `edit_watchlist`
  - QuantLab: `get_quant_signals`, `get_model_quality`, `get_top_signals`
  - Sentinel: `get_sentinel_report`, `get_insights`
  - News: `get_ticker_news`, `get_ticker_events`, `get_macro_events`
  - Analysis: `get_sentiment`, `get_ticker_alerts`, `get_explanation`
  - Info: `about_marketminute`
- **📊 Model Quality Tiers** - Quality classification for ML models
  - **Best** (🏆) - Excellent Sharpe ratio (>3) and Profit Factor (>2)
  - **Excellent** (✓) - Good metrics, recommended for trading
  - **Good** - Marginal performance
  - **Low Quality** (⚠) - Poor metrics, not recommended
- **⚡ Lambda Agent** - Serverless agent orchestrator with OpenAI GPT-5-mini
- **🔄 Type Coercion** - Automatic argument type conversion for tool calls

### News-Aware Predictions (v2.2 - Dec 2025)

- **📰 Bayesian News Integration** - ML model probabilities adjusted using news sentiment and relevance
- **🎯 Two-Stage Prediction** - Raw model output → News-based Bayesian update → Final signal
- **📊 Dual Scores in UI** - QuantLab shows both raw and news-adjusted Quant Scores
- **🔄 Daily News Processing** - Batch API processes 20 news items per ticker before predictions
- **⚖️ Weighted Categories** - Company (1.0x), Sector (0.7x), Macro (0.4x), Noise (0.1x)
- **🧮 Sequential Bayesian Update** - Multiple news items multiply likelihoods iteratively
- **💾 Database Storage** - NewsItem table stores sentiment, relevance, and category for reuse

### EC2 ML Services (v2.1 - Dec 2025)

- **🤖 Sentiment & Relevance Models** - ML-powered news analysis deployed on EC2
- **⚡ FastAPI Services** - Two microservices running on single t3.medium instance
  - Sentiment service (:8001) - Headlines → sentiment scores (-1 to 1)
  - Relevance service (:8002) - Headlines + ticker → relevance scores (0 to 1) + category
- **🎯 Intelligent News Filtering** - ML models filter and score news for explain API and daily summaries
- **🚀 One-Command Redeployment** - `./services/redeploy_models.sh` for model updates
- **💰 Cost-Effective** - ~$30/month for always-on EC2 vs serverless SageMaker
- **🔄 Model Training Pipeline** - Train locally, deploy to EC2 with Docker

### AWS Serverless Infrastructure (v2.0)

- **☁️ Lambda + SageMaker** - Fully serverless ML inference pipeline for quant predictions
- **⏰ Automated Daily Analysis** - EventBridge cron job (Mon-Fri, 4:05 PM EST)
- **🗄️ Database-Backed Predictions** - Results stored in PostgreSQL for instant page loads
- **🐳 Docker Deployment** - Containerized Lambda and SageMaker models
- **🏗️ Infrastructure as Code** - Terraform for reproducible AWS deployments
- **🔐 Secrets Management** - AWS Secrets Manager integration
- **📊 Manual Trigger** - Admin panel button for testing cron job

### Sentinel AI Agent (v1.0)

- **🧠 Autonomous Market Intelligence** - Multi-stage analysis pipeline with anomaly detection
- **📝 Structured Narratives** - "What This Means" explanations in plain English
- **📊 Historical Tracking** - Database-backed report history with expandable insights
- **🎨 Component Refactoring** - Modular dashboard with reusable cards
- **🔄 Collapsible UI** - Space-efficient panel design on homepage

### Component Library Expansion

- **Molecules**: `VolatilityCard`, `MarketSignalsCard`, `MarketSummaryCard`, `RegimeComponentsCard`
- **Organisms**: `SentinelExplainToday`, `WhatThisMeans`, `ProfessionalInsights`, `LambdaCronRunner`

### Database Schema Updates

- Added `NewsItem` model for storing ML-scored news (sentiment, relevance, category)
- Updated `LivePrediction` with raw and news-adjusted fields for dual scoring
  - Raw fields: `rawSignal`, `rawConfidence`, `rawProbUp`, `rawProbNeutral`, `rawProbDown`
  - News fields: `newsCount` to track Bayesian update influence
- Added `SentinelReport` model with structured narrative storage
- Added `DistribionalForecast` model for probabilistic forecasts (200+ tickers daily)
- JSON fields for flexible data structures (`whatThisMeans`, `context`, `keyDrivers`)
- Indexed anomaly flags and `runId` for efficient querying

### Performance Optimizations (Nov 2025)

- **⚡ Batch API Operations** - FMP Premium batch-quote endpoint for single-call ticker fetching
- **🚀 Redis Batch Operations** - Pipeline writes and mget reads (N calls → 1-2 calls per request)
- **📊 Database Query Optimization** - Fixed N+1 queries in events API (430+ queries → 2 queries)
- **💾 30-Year Historical Data** - Upgraded from 5 years to up to 30 years of training data (~7,560 days)
- **⚡ Smart Summary Polling** - Summary only loads on page load/watchlist change (not every 5s)
- **📰 Tiered News Fetching** - Adaptive news loading: 5 items/symbol for small lists, top movers only for 50+ symbols
- **🔐 AWS Secrets Manager** - Secure FMP API key storage instead of environment variables

---

## 🎯 Overview

MarketMinute consists of three integrated systems:

**Web Application** - Modern Next.js dashboard for market monitoring and AI insights  
**Quant Lab System** - ML-powered engine with movement predictions and forecasts  
**AWS Infrastructure** - Serverless Lambda + SageMaker for automated daily analysis

---

## 🏗️ System Architecture

**System Architecture Diagram:**  
[View System Architecture](https://www.mermaidchart.com/d/b04d8bc2-1ebc-4be4-9af3-4521d3f75e5b)

**Daily Cron Flow:**  
[View Automated Daily Analysis Flow](https://www.mermaidchart.com/d/3fb4ddc5-c176-4488-987a-cbc01cf20c96)

The system uses a serverless architecture with three main components:

1. **Web Application (Next.js + Vercel)** - User-facing dashboard with real-time data
2. **Quant Lambda (AWS)** - Orchestrates daily market data fetch and ML inference
3. **SageMaker Endpoint (AWS)** - Serves ML model predictions on-demand

**Daily Automated Flow:**

- **4:05 PM EST (Mon-Fri)**: EventBridge triggers Lambda function
- **Lambda Step 1**: Calls webapp API to process news for all tickers
  - Fetches latest 20 news items per ticker from FMP
  - Scores each headline with EC2 sentiment & relevance models
  - Stores in NewsItem database table (sentiment, relevance, category)
- **Lambda Step 2**: Fetches 30 years of market data from Financial Modeling Prep API
- **Lambda Step 3**: Calls SageMaker endpoint for raw ML predictions (up/down/neutral probabilities)
- **Lambda Step 4**: Queries NewsItem table and applies Bayesian news update to probabilities
- **Lambda Step 5**: Generates distributional forecasts and final trading signals
- **Lambda Step 6**: Saves results to PostgreSQL database (with both raw and news-adjusted scores)
- **Lambda Step 7**: Triggers Sentinel AI agent for market analysis
- **Webapp**: Displays fresh predictions and insights (instant page loads from DB)

---

## ✨ Key Features

### 📊 Market Intelligence

- **🧠 Sentinel AI Agent** - Autonomous market intelligence system with anomaly detection
  - Multi-stage analysis pipeline (market snapshot → anomaly detection → specialized report)
  - Structured "What This Means" narratives explaining market moves in plain English
  - Volatility regime classification (VIX tracking, realized volatility)
  - Sector rotation detection and analysis
  - Macro event integration and surprise detection
  - Historical report tracking with expandable insights
- **Real-time Market Data** - Live quotes with 30s cache via FMP Premium batch API
- **Redis-Powered Caching** - Shared app-level cache with Upstash Redis for instant updates
- **AI Market Summaries** - Natural language summaries powered by LangChain & OpenAI
- **Smart Alerts** - Automated notifications for price movements, volume spikes, and 52-week highs
- **Events Timeline** - Batch-optimized events API for earnings and macro events
- **Historical Analysis** - "Since Last Visit" snapshots to see what changed

### 📈 Watchlist Management

- **Custom Watchlists** - Create and organize multiple watchlists
- **Drag-and-Drop Reordering** - Intuitive watchlist item management
- **Ticker Search** - Quick symbol lookup with autocomplete
- **Favorites System** - Star important watchlists for quick access
- **Smart Macros** - Define custom alerts (price changes, volume spikes, near highs)

### 🤖 Quantitative Trading (Quant Lab)

- **ML Predictions** - LightGBM/XGBoost/LSTM models for daily trading signals
- **News-Aware Predictions** - Two-stage prediction pipeline:
  1. **Raw ML Model** → Directional probabilities (up/down/neutral)
  2. **Bayesian News Update** → Adjust probabilities using sentiment & relevance
  3. **Final Signal** → BUY/SELL/NEUTRAL based on posterior probabilities
- **Bayesian Inference** - Sequential likelihood multiplication across multiple news items
  - **Sentiment Model** (-1 to +1): Bullish/bearish direction from EC2 ML service
  - **Relevance Model** (0 to 1): How relevant the news is to the ticker
  - **Category Weights**: Company (1.0x), Sector (0.7x), Macro (0.4x), Noise (0.1x)
  - **Likelihood Ratios**: Strong bullish + high relevance → 2x up, 0.5x down
  - **Example**: Prior `{up: 0.52, down: 0.31}` + bearish news → `{up: 0.34, down: 0.51}`
- **Dual Scoring in UI** - QuantLab displays both raw and news-adjusted Quant Scores
- **Distributional Forecasts** - Probabilistic price predictions with confidence intervals
- **Database-Backed Results** - Predictions stored in PostgreSQL for instant page loads
- **Automated Daily Analysis** - AWS Lambda cron job runs at 4:05 PM EST weekdays
- **Backtesting Engine** - Multi-year historical performance validation
- **Paper Trading** - Live simulation with realistic execution costs
- **Interactive Dashboards** - Streamlit-based visualization and monitoring
- **Walk-Forward Validation** - Robust cross-validation strategy

### ☁️ AWS Infrastructure

- **Lambda Orchestrator** - Serverless function coordinates daily analysis workflow
- **SageMaker Endpoint** - Serverless ML inference for real-time predictions
- **EventBridge Scheduler** - Automated cron job (Mon-Fri, 4:05 PM EST)
- **Docker Deployment** - Containerized Lambda and SageMaker models
- **Infrastructure as Code** - Terraform configuration for reproducible deployments
- **Simple API Authentication** - FMP API key for data access (no OAuth required)
- **Database Integration** - Lambda saves results directly to production database

### 💬 AI Chat Agent

- **Conversational Interface** - Natural language queries about markets, watchlists, and signals
- **MCP Tool Integration** - 20+ tools for real-time data access
- **Lambda Orchestrator** - Serverless agent with GPT-5-mini reasoning
- **Context Awareness** - Maintains conversation history for follow-up questions
- **Auto Type Coercion** - Handles OpenAI's string-typed arguments automatically

### 🎨 User Experience

- **Modern UI** - Tailwind CSS with custom animations and responsive design
- **Dark Theme** - Professional dark color scheme optimized for extended viewing
- **Authentication** - Secure OAuth with NextAuth.js (Google)
- **Real-time Updates** - 30-second cache revalidation for live data
- **Admin Tools** - Cache management and system configuration

---

## 🛠️ Technology Stack

### Frontend & Backend

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI, Lucide Icons
- **Authentication:** NextAuth.js 5 (Beta)
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Vercel Postgres)
- **Caching:** Upstash Redis (30s TTL, shared app-level cache)

### AI & ML (Web App)

- **LLM Framework:** LangChain
- **AI Provider:** OpenAI (GPT models)
- **Text-to-Speech:** OpenAI TTS API

### News ML Models (EC2-Hosted)

Custom-trained sentiment and relevance classifiers deployed as FastAPI microservices on AWS EC2 (t3.medium):

**Sentiment Model** (Port 8001)

- **Architecture:** sentence-transformers/all-MiniLM-L6-v2 → logistic regression
- **Output:** Continuous score from -1 (bearish) to +1 (bullish)
- **Training:** Fine-tuned on financial news headlines with manual annotations
- **Endpoint:** `POST /score` with `{"text": "headline"}`
- **Response:** `{"score": 0.73, "category": "bullish"}`

**Relevance Model** (Port 8002)

- **Architecture:** sentence-transformers embeddings → cosine similarity + category classifier
- **Output:** Relevance score 0-1 + category (company/sector/macro/noise)
- **Category Weights:**
  - **Company**: 1.0x (direct mentions, earnings, product launches)
  - **Sector**: 0.7x (industry trends, competitor news)
  - **Macro**: 0.4x (Fed policy, GDP, inflation)
  - **Noise**: 0.1x (unrelated or generic news)
- **Endpoint:** `POST /score` with `{"headline": "text", "ticker": "AAPL"}`
- **Response:** `{"score": 0.85, "category": "company"}`

**Deployment Details:**

- **Hosting:** AWS EC2 t3.medium (Tailscale private network)
- **Framework:** FastAPI with uvicorn
- **Concurrency:** Async processing for batch requests
- **Latency:** ~50-100ms per headline
- **Access:** Private Tailscale IPs (100.x.x.x) - **NOT publicly accessible**

**News Processing Workflow:**

1. **Lambda** → `POST /api/news/process-batch` (220 tickers, today's news)
2. **Webapp** → Fetch FMP news API (`/stable/news/stock`)
3. **Webapp** → Call sentiment service for each headline
4. **Webapp** → Call relevance service for each headline + ticker pair
5. **Webapp** → Store `NewsItem` in database (ticker, headline, sentiment, relevance, category)
6. **Lambda** → `GET /api/news/get?ticker=X&days=2` (retrieve scored news)
7. **Lambda** → Apply `bayesian_update()` to raw ML predictions
8. **Lambda** → Save both raw and news-adjusted predictions to `LivePrediction`

**Example News Scoring:**

```
Headline: "Apple announces record Q4 earnings, stock jumps 5%"
Ticker: AAPL
→ Sentiment: +0.85 (bullish)
→ Relevance: 0.95 (company)
→ Category weight: 1.0x
→ Bayesian impact: Shifts prob_up from 0.52 → 0.67
```

### Quantitative System

- **ML Frameworks:** LightGBM, XGBoost, Scikit-learn
- **Deep Learning:** TensorFlow, PyTorch, Transformers
- **Optimization:** Optuna, Ray[Tune], Hyperopt, CVXPY
- **Data Processing:** Pandas, NumPy, PyArrow
- **Validation:** Great Expectations, Pytest
- **MLOps:** MLflow, Weights & Biases, TensorBoard
- **Visualization:** Streamlit, Plotly
- **Market Data:** Financial Modeling Prep API (REST)

### Infrastructure & Cloud

- **Market Data Provider:** Financial Modeling Prep API (Premium - batch quotes, 30 years historical)
- **Caching Layer:** Upstash Redis (serverless, shared across instances)
- **Web Deployment:** Vercel (Next.js production hosting)
- **ML Infrastructure:**
  - AWS EC2 (t3.medium) - Sentiment & relevance microservices
  - AWS Lambda + SageMaker - Quant predictions (serverless inference)
- **Orchestration:** AWS EventBridge (cron scheduler)
- **Secrets:** AWS Secrets Manager
- **Container Registry:** AWS ECR (Docker images)
- **Infrastructure as Code:** Terraform
- **Version Control:** Git
- **Environment:** Node.js 20+, Python 3.10+

---

## 🎨 Component Architecture

### Design System

- **Atoms** - Badge, Box, Button, Card, Container, Dialog, EmptyState, Label, MiniSparkline, SectionHeader, SignOutButton, Stack, StatusBadge
- **Molecules** - Accordion, AlertCard, EnhancedPredictionCard, ForecastCard, IconLabel, MarketSignalsCard, MarketSummaryCard, NavLink, QuantLabAvailableTickers, QuantLabLimitations, QuantLabMethodology, RegimeComponentsCard, TickerListClient, TickerSearch, TopSignalsView, UserInfo, VolatilityCard
- **Organisms** - AdminSettings, DistributionalForecasts, EmailVerificationBanner, EventsTimeline, InsightCards, MarketForecastsClient, MarketMinuteSummary, MarketTicker, MovementAlertsBar, ProfessionalInsights, QuantLabClient, SentinelExplainToday, SentinelPreferences, SinceLastVisit, WatchlistSelector, WatchlistTimeline, WhatThisMeans, Sidebar

### Key Hooks

- `useScrollAnimation` - Scroll-triggered animations
- `useWindowSize` - Responsive layout management

### Utilities

- `cacheManager` - Server-side caching with revalidation
- `fmpData` - FMP API data fetching
- `marketData` - Market data fetching and transformation
- `eventDetector` - Macro event detection logic

---

## 🧠 Sentinel AI Agent

The Sentinel AI Agent is an autonomous market intelligence system that provides real-time market analysis with human-readable narratives.

### Architecture

**Multi-Stage Pipeline:**

1. **Market Snapshot** - Fetches real-time data from Financial Modeling Prep API
   - Index prices (SPY, QQQ, IWM)
   - Sector performance (11 sectors)
   - Individual stock snapshots
2. **Anomaly Detection** - Rule-based triggers for market events
   - **Index Move** - Significant directional moves (>1% threshold)
   - **Sector Rotation** - Divergence between sectors (>2% spread)
   - **Volatility Spike** - VIX changes >10%
   - **Macro Surprise** - Unexpected economic events
3. **Market Drilldown** - Deep analysis when anomalies detected
   - Leading/lagging sector identification
   - Volatility regime classification
   - Cross-asset correlation analysis
4. **Report Generation** - AI-powered narrative creation
   - Summary and key drivers
   - Structured "What This Means" explanations
   - Macro context integration
   - Professional insights and risk assessment

### What This Means Structure

Generated AI narratives follow a consistent format:

```typescript
{
  whatHappened: string,      // 2-3 sentence plain English summary
  whyItMatters: string,      // Significance explanation
  whatCouldHappenNext: string, // Potential scenarios
  whatToWatch: string[]      // 3-5 specific monitoring points
}
```

**Tone & Style:**

- Conversational, calm, human tone
- No jargon, predictions, or idioms
- Something between Morning Brew + Goldman Sachs notes
- No investment advice

### Storage & History

All Sentinel reports are stored in PostgreSQL with:

- Full market context (JSON)
- Anomaly flags for filtering
- Volatility metrics
- Structured narratives
- Historical tracking with expandable UI

### Dashboard Features

- **Collapsible Panel** - Accessible from homepage
- **One-Click Analysis** - Generate reports on demand
- **Historical Reports** - View past 20 analyses
- **What This Means** - Expandable narratives in history table
- **Link to Full Dashboard** - `/sentinel` page with comprehensive views

---

## 🤖 Model Information

### Machine Learning Models

MarketMinute's Quant Lab employs four specialized models for market prediction:

#### 1. **LightGBM Classifier**

- **Type:** Gradient Boosting Decision Trees
- **Framework:** Microsoft LightGBM
- **Architecture:** Multiclass classifier (3 classes)
- **Tuner:** Optuna hyperparameter optimization (40 trials)
- **Key Features:**
  - Fast training with histogram-based learning
  - Leaf-wise tree growth strategy
  - Built-in categorical feature support
  - GPU acceleration support
- **Tuned Parameters:**
  - Learning rate: 0.01–0.15
  - Num leaves: 16–128
  - Max depth: 3–9
  - Feature/bagging fractions
  - L1/L2 regularization

#### 2. **XGBoost Classifier**

- **Type:** Gradient Boosting Decision Trees
- **Framework:** XGBoost
- **Architecture:** Multiclass classifier (3 classes)
- **Tuner:** Optuna hyperparameter optimization (40 trials)
- **Key Features:**
  - Depth-wise tree growth
  - Advanced regularization techniques
  - Parallel tree construction
  - GPU acceleration support
- **Tuned Parameters:**
  - Learning rate: 0.01–0.15
  - Max depth: 3–7
  - Min child weight: 1.0–10.0
  - Gamma, subsample, colsample
  - Alpha/lambda regularization

#### 3. **LSTM Classifier**

- **Type:** Bidirectional Long Short-Term Memory Neural Network
- **Framework:** PyTorch
- **Architecture:** 2-layer bidirectional LSTM with attention
- **Tuner:** Built-in training with early stopping
- **Key Features:**
  - Bidirectional processing for temporal context
  - Multi-head attention mechanism
  - Batch normalization and dropout
  - Sequence modeling for time series
- **Network Architecture:**
  - Input → Bidirectional LSTM (128 hidden units)
  - Multi-head attention layer
  - Fully connected layers with dropout (0.3)
  - Softmax output (3 classes)

#### 4. **Transformer Classifier**

- **Type:** Transformer Neural Network
- **Framework:** PyTorch
- **Architecture:** 4-layer transformer encoder with positional encoding
- **Tuner:** Built-in training with early stopping
- **Key Features:**
  - Positional encoding for sequence information
  - Self-attention across all time steps
  - Layer normalization
  - Captures long-range dependencies
- **Network Architecture:**
  - Input embedding (d_model=128)
  - Positional encoding
  - 4 transformer encoder layers (8 attention heads)
  - Feed-forward network (512 dimensions)
  - Softmax output (3 classes)

### Labeling Strategy

**Multiclass Triple-Barrier Method:**

- **Classes:**

  - `-1` = Strong Down (sell signal)
  - `0` = Neutral (hold/no trade)
  - `1` = Strong Up (buy signal)

- **Forward-Looking Period:** 5 days (default)

- **Dynamic Volatility Adjustment:**

  - Rolling volatility window: 30 days
  - Neutral threshold: 0.8× rolling volatility
  - Strong threshold: 2.0× rolling volatility
  - Adapts to market conditions automatically

- **Density Control:**

  - Maximum strong-move ratio: 12%
  - Prevents label imbalance
  - Randomly samples strong moves if threshold exceeded

- **Class Balancing:**
  - Hybrid soft oversampling (1.4× multiplier)
  - Proportional class weights
  - Prevents model collapse to majority class

### Optimization Metrics

- **Primary:** Macro-F1 Score (balanced across all classes)
- **Secondary:** Multi-class log loss (for early stopping)
- **Validation:** Walk-forward cross-validation
- **Ensemble:** Weighted averaging by macro-F1 performance

### Model Training Pipeline

1. **Data Preparation:** Feature engineering (50+ indicators)
2. **Labeling:** Dynamic volatility-adjusted labels
3. **Balancing:** Hybrid oversampling + class weights
4. **Hyperparameter Tuning:** Optuna optimization (40 trials)
5. **Training:** Walk-forward cross-validation
6. **Ensemble:** Weighted combination of all models
7. **Validation:** Out-of-sample testing

---

## 📁 Project Structure

```
MarketMinute/
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── deploy.sh                  # Main deployment script
│
├── platform/                  # AI Agent & MCP infrastructure
│   ├── agent/                 # Lambda agent orchestrator
│   │   ├── scripts/
│   │   │   └── build-lambda.sh  # Build and deploy script
│   │   ├── src/
│   │   │   ├── lambda/
│   │   │   │   ├── handler.ts    # Lambda entry point
│   │   │   │   └── orchestrator.ts  # Agentic loop with tool calling
│   │   │   └── tools/
│   │   │       └── registry.ts   # Tool registry for Lambda
│   │   ├── Dockerfile         # Lambda container
│   │   └── package.json
│   │
│   ├── mcp/                   # Model Context Protocol tools
│   │   └── src/
│   │       ├── tools/         # Tool implementations
│   │       │   ├── market/    # get_quote_snapshot, get_top_movers, etc.
│   │       │   ├── user/      # get_watchlists, create_watchlist, etc.
│   │       │   ├── quantlab/  # get_quant_signals, get_model_quality, etc.
│   │       │   ├── sentinel/  # get_sentinel_report, get_insights
│   │       │   ├── news/      # get_ticker_news, get_ticker_events, etc.
│   │       │   ├── analysis/  # get_sentiment, get_explanation, etc.
│   │       │   └── info/      # about_marketminute
│   │       └── ops/           # Shared operations (db, time)
│   │
│   └── shared/                # Shared schemas and types
│       ├── schemas/
│       │   └── tools/         # Zod schemas for all tools
│       └── types/
│
├── services/                  # ML microservices (EC2-hosted)
│   ├── redeploy_models.sh     # Model redeployment script
│   ├── sentiment/             # Sentiment analysis service
│   │   ├── app.py            # FastAPI application
│   │   ├── config.py         # Service configuration
│   │   ├── Dockerfile        # Container definition
│   │   ├── requirements.txt  # Python dependencies
│   │   ├── model/            # Model artifacts
│   │   │   ├── sentiment_classifier.pkl  # Trained model
│   │   │   └── sentiment_classifier.py   # Model class
│   │   ├── training/         # Training scripts
│   │   │   └── train.py     # Model training
│   │   └── data/             # Training data
│   │
│   └── relevance/            # Relevance scoring service
│       ├── app.py            # FastAPI application
│       ├── config.py         # Service configuration
│       ├── Dockerfile        # Container definition
│       ├── requirements.txt  # Python dependencies
│       ├── model/            # Model artifacts
│       │   ├── relevance_classifier.pkl  # Trained model
│       │   └── relevance_scorer.py      # Model class
│       ├── training/         # Training scripts
│       │   └── train.py     # Model training
│       └── data/             # Training data
│
├── webapp/                    # Next.js web application
│   ├── .env                   # Environment variables
│   ├── .gitignore             # Git ignore rules
│   ├── auth.ts                # NextAuth configuration
│   ├── next.config.ts         # Next.js configuration
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── vercel.json            # Vercel deployment config
│   │
│   ├── app/                   # App router pages
│   │   ├── (auth)/           # Authentication pages
│   │   │   ├── login/        # Login page
│   │   │   └── signup/       # Signup page
│   │   ├── about/            # About page
│   │   ├── admin/            # Admin dashboard
│   │   ├── api/              # API routes (58 endpoints)
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── quant/        # Quant data endpoints
│   │   │   ├── sentinel/     # Sentinel agent endpoints
│   │   │   ├── watchlist/    # Watchlist endpoints
│   │   │   └── ...           # Market data, news, etc.
│   │   ├── features/         # Features showcase page
│   │   ├── forecasts/        # ML forecasts page
│   │   ├── history/          # Historical data view
│   │   ├── how-it-works/     # How it works page
│   │   ├── privacy/          # Privacy policy
│   │   ├── quant/            # Quant lab interface
│   │   ├── sentinel/         # Sentinel AI dashboard
│   │   │   ├── page.tsx      # Sentinel dashboard
│   │   │   └── [reportId]/   # Individual report view
│   │   ├── settings/         # User settings
│   │   ├── subscription/     # Subscription management
│   │   ├── support/          # Support pages
│   │   ├── terms/            # Terms of service
│   │   ├── use-cases/        # Use cases page
│   │   ├── watchlist/        # Watchlist management
│   │   │   ├── page.tsx      # Watchlist dashboard
│   │   │   └── [symbol]/     # Individual stock view
│   │   ├── why-marketminute/ # Why MarketMinute page
│   │   ├── DashboardClient.tsx  # Main dashboard client
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   ├── sitemap.ts        # Dynamic sitemap
│   │   └── globals.css       # Global styles
│   │
│   ├── agents/               # AI agent systems
│   │   └── sentinel/         # Sentinel agent implementation
│   │       ├── agent/        # Core agent logic
│   │       │   ├── context.ts    # Context builder
│   │       │   ├── drilldown.ts  # Drilldown causation
│   │       │   ├── loop.ts       # Main execution loop
│   │       │   ├── report.ts     # Report generation
│   │       │   ├── triggers.ts   # Anomaly trigger detection
│   │       │   └── types.ts      # Type definitions
│   │       ├── config/       # Configuration
│   │       │   ├── prompts.ts    # LLM prompts
│   │       │   └── types.ts      # Config types
│   │       ├── llm/          # LLM integration
│   │       │   ├── openai.ts     # OpenAI client
│   │       │   └── prompts/      # Prompt engineering templates
│   │       └── services/     # Market data fetchers
│   │           ├── macro/        # Macro event services
│   │           ├── market/       # Market snapshot (get_market_snapshot.ts)
│   │           ├── notify/       # Notification services
│   │           └── volatility/   # Volatility data services
│   │
│   ├── components/           # React components
│   │   ├── README.md         # Component documentation
│   │   ├── atoms/            # Basic UI components (13)
│   │   │   ├── Badge.tsx
│   │   │   ├── Box.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Container.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── MiniSparkline.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── SignOutButton.tsx
│   │   │   ├── Stack.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── molecules/        # Composite components (17)
│   │   │   ├── Accordion.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── EnhancedPredictionCard.tsx
│   │   │   ├── ForecastCard.tsx
│   │   │   ├── IconLabel.tsx
│   │   │   ├── MarketSignalsCard.tsx
│   │   │   ├── MarketSummaryCard.tsx
│   │   │   ├── NavLink.tsx
│   │   │   ├── QuantLabAvailableTickers.tsx
│   │   │   ├── QuantLabLimitations.tsx
│   │   │   ├── QuantLabMethodology.tsx
│   │   │   ├── RegimeComponentsCard.tsx
│   │   │   ├── TickerListClient.tsx
│   │   │   ├── TickerSearch.tsx
│   │   │   ├── TopSignalsView.tsx
│   │   │   ├── UserInfo.tsx
│   │   │   └── VolatilityCard.tsx
│   │   └── organisms/        # Complex feature components (18)
│   │       ├── AdminSettings.tsx
│   │       ├── DistributionalForecasts.tsx
│   │       ├── EmailVerificationBanner.tsx
│   │       ├── EventsTimeline.tsx
│   │       ├── InsightCards.tsx
│   │       ├── MarketForecastsClient.tsx
│   │       ├── MarketMinuteSummary.tsx
│   │       ├── MarketTicker.tsx
│   │       ├── MovementAlertsBar.tsx
│   │       ├── ProfessionalInsights.tsx
│   │       ├── QuantLabClient.tsx
│   │       ├── SentinelExplainToday.tsx
│   │       ├── SentinelPreferences.tsx
│   │       ├── SinceLastVisit.tsx
│   │       ├── WatchlistSelector.tsx
│   │       ├── WatchlistTimeline.tsx
│   │       ├── WhatThisMeans.tsx
│   │       └── sidebar.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useMarketData.tsx
│   │   └── useWatchlist.tsx
│   │
│   ├── lib/                  # Utilities and helpers
│   │   ├── cacheManager.ts   # Redis caching
│   │   ├── eventDetector.ts  # Market event detection
│   │   ├── eventsDb.ts       # Event database
│   │   ├── explainCache.ts   # Explanation caching
│   │   ├── macroNews.ts      # Macro news fetcher
│   │   ├── marketData.ts     # Market data utils (FMP API)
│   │   ├── news.ts           # News aggregation
│   │   ├── openai.ts         # OpenAI integration
│   │   ├── redis.ts          # Redis caching client
│   │   ├── tickerCache.ts    # Ticker data caching
│   │   ├── smartAlerts.ts    # Alert system
│   │   ├── summary.ts        # Market summaries
│   │   ├── summaryCache.ts   # Summary caching
│   │   ├── tickerMappings.ts # Ticker utilities
│   │   └── utils.ts          # General utilities
│   │
│   ├── prisma/               # Database schema and migrations
│   │   ├── migrations/       # Database migrations
│   │   └── schema.prisma     # Prisma schema
│   │
│   └── public/               # Static assets
│       ├── icons/            # Icon files
│       └── images/           # Image assets
│
├── quant/                     # Quantitative trading system
│   ├── .env                   # Environment variables
│   ├── .gitignore             # Git ignore rules
│   ├── requirements.txt       # Python dependencies
│   ├── setup.py               # Package setup
│   ├── serverless.yml         # Serverless config (legacy)
│   ├── SYSTEM_SPEC.yaml       # System specifications
│   │
│   ├── lambda/               # AWS Lambda orchestrator
│   │   ├── .gitignore        # Lambda ignore rules
│   │   ├── Dockerfile        # Lambda container config
│   │   ├── requirements.txt  # Lambda dependencies
│   │   ├── deploy_lambda.sh  # Deployment script
│   │   ├── lambda_handler.py # Main orchestrator function
│   │   ├── predictions.py    # Prediction generation logic
│   │   ├── forecasting.py    # Distributional forecasts logic
│   │   └── tickers.py        # Ticker list configuration
│   │
│   ├── logs/                 # Log files (generated)
│   │
│   ├── models/               # Saved ML models (generated)
│   │
│   ├── outputs/              # Training outputs
│   │   ├── backtests/        # Backtest results
│   │   ├── predictions/      # Generated predictions
│   │   └── reports/          # Analysis reports
│   │
│   ├── sagemaker/            # SageMaker inference endpoint
│   │   ├── .gitignore        # SageMaker ignore rules
│   │   ├── Dockerfile        # SageMaker container config
│   │   ├── requirements.txt  # SageMaker dependencies
│   │   ├── deploy.py         # Deployment utility
│   │   ├── deploy_sagemaker.sh  # Deployment script
│   │   ├── inference.py      # Inference handler
│   │   ├── serve             # Serve script
│   │   ├── wsgi.py           # WSGI application
│   │   └── models/           # Model artifacts (copied at build)
│   │
│   ├── scripts/              # CLI utilities
│   │   ├── cleanup.py        # Data cleanup
│   │   ├── compare_ensemble_strategies.py
│   │   ├── eval_multiclass_trading.py
│   │   ├── generate_distributional_forecasts.py
│   │   ├── generate_predictions.py
│   │   ├── prep_data.py      # Data preparation (FMP API)
│   │   └── train_model.py    # Model training
│   │
│   └── src/                  # Core library
│       ├── data/             # Data processing
│       │   ├── __init__.py
│       │   ├── fmp_data.py       # FMP API client
│       │   ├── features/     # Feature engineering
│       │   │   ├── __init__.py
│       │   │   ├── FEATURE_DICTIONARY.md
│       │   │   ├── curated_features.py
│       │   │   └── feature_engine.py
│       │   ├── labels/       # Label generation
│       │   │   ├── __init__.py
│       │   │   ├── binary_labeler.py
│       │   │   └── multiclass_labeler.py
│       │   └── preprocessing/  # Data preprocessing
│       │       ├── __init__.py
│       │       └── scaler.py
│       │
│       └── models/           # ML model implementations
│           ├── __init__.py
│           ├── ensemble_classifier.py  # Ensemble model
│           ├── hyperparameter_tuner.py # Optuna tuning
│           ├── xgb_hyperparameter_tuner.py
│           ├── base/         # Base models
│           │   ├── __init__.py
│           │   ├── lgbm_classifier.py  # LightGBM
│           │   └── xgb_classifier.py   # XGBoost
│           └── deep_learning/  # Deep learning models
│               ├── __init__.py
│               ├── lstm_classifier.py      # LSTM
│               └── transformer_classifier.py  # Transformer
│
└── infrastructure/            # Cloud infrastructure
    ├── scripts/              # Management utilities
    │   ├── deploy_ec2_ml_services.sh  # EC2 ML services deployment
    │   ├── deploy_lambda.sh  # Lambda deployment
    │   ├── manage_scheduler.sh  # Cron job management
    │   ├── setup.sh          # Initial setup
    │   ├── teardown.sh       # Infrastructure teardown
    │   └── view_cron_history.sh    # View cron logs
    │
    └── terraform/            # Infrastructure as Code
        ├── main.tf           # Main configuration
        ├── variables.tf      # Variable definitions
        ├── terraform.tfvars  # Variable values
        ├── outputs.tf        # Output definitions
        ├── ecr.tf            # ECR repositories
        ├── iam.tf            # IAM roles and policies
        ├── ec2_ml_services.tf  # EC2 instance for ML services
        ├── iam_ec2_ml.tf     # IAM roles for EC2
        ├── user_data.sh      # EC2 initialization script
        ├── docker-compose.yml  # Docker Compose for ML services
        ├── lambda.tf         # Lambda function config
        ├── sagemaker.tf      # SageMaker endpoint config
        ├── scheduler.tf      # EventBridge cron job
        └── secrets.tf        # Secrets Manager config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL
- Financial Modeling Prep API key (get free at https://financialmodelingprep.com/)

### Web Application Setup

```bash
cd webapp

# Install dependencies
npm install
# Note: postinstall script automatically runs "prisma generate"

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials:
# - DATABASE_URL (PostgreSQL)
# - NEXTAUTH_SECRET
# - OPENAI_API_KEY
# - FMP_API_KEY (Financial Modeling Prep - Premium tier for quotes, news, and events)
# - SENTIMENT_SERVICE_URL (e.g., http://100.31.239.246:8001)
# - RELEVANCE_SERVICE_URL (e.g., http://100.31.239.246:8002)
# - UPSTASH_REDIS_REST_URL (optional - Redis caching)
# - UPSTASH_REDIS_REST_TOKEN (optional - Redis caching)

# Initialize database
npx prisma migrate dev
# Latest migration includes SentinelReport model

# Run development server
npm run dev
# Access the app at http://localhost:3000
# Visit /sentinel for Sentinel AI dashboard
```

Visit `http://localhost:3000`

### Quantitative Lab Setup

```bash
cd quant

# Install dependencies
pip install -r requirements.txt

# Set up environment
pip install -e .

# FMP requires only an API key (no authentication script needed)

# Prepare data
python3 scripts/prep_data.py

# Train initial models
python3 scripts/train_model.py

# Generate Predictions
python3 scripts/generate_predictions.py

# Generate Forecasts
python3 scripts/generate_distributional_forecasts.py
```

### ML Services Setup (EC2)

**Deploy Sentiment & Relevance Models:**

```bash
cd services

# Option 1: Deploy both services
./redeploy_models.sh both

# Option 2: Deploy individual services
./redeploy_models.sh sentiment
./redeploy_models.sh relevance
```

**The script will:**

1. Verify model artifacts exist (`.pkl` files in `model/` directories)
2. Build Docker images with `--no-cache` for AMD64 architecture
3. Push images to AWS ECR
4. Restart services on EC2 via AWS SSM
5. Verify health endpoints

**Test the services:**

```bash
# Sentiment analysis
curl -X POST http://<EC2_IP>:8001/score \
  -H "Content-Type: application/json" \
  -d '{"text": "Stock prices surge on positive earnings"}'

# Relevance scoring
curl -X POST http://<EC2_IP>:8002/score \
  -H "Content-Type: application/json" \
  -d '{"headline": "Apple unveils new iPhone", "ticker": "AAPL"}'
```

**Train new models:**

```bash
# Sentiment
cd services/sentiment/training
python3 train.py

# Relevance
cd services/relevance/training
python3 train.py

# Then redeploy
cd ../../
./redeploy_models.sh both
```

---

### AWS Infrastructure Setup

**Prerequisites:**

- AWS CLI configured with credentials
- Terraform installed
- Docker installed
- AWS account with appropriate permissions

**1. Configure Terraform Variables**

```bash
cd infrastructure/terraform

# Create terraform.tfvars
cat > terraform.tfvars << 'EOF'
project_name = "marketminute"
environment = "dev"
aws_region = "us-east-1"
sagemaker_image_uri = "YOUR_ECR_URI/marketminute-sagemaker:latest"
lambda_image_uri = "YOUR_ECR_URI/marketminute-lambda:latest"
webapp_url = "https://market-minute.vercel.app"
EOF
```

**2. Deploy SageMaker Model**

```bash
cd ../../quant/sagemaker

# Build and push Docker image
./deploy_sagemaker.sh

# Copy the ECR URI and update terraform.tfvars
```

**3. Deploy Lambda Function**

```bash
cd ../lambda

# Build and push Docker image
./deploy_lambda.sh

# Copy the ECR URI and update terraform.tfvars
```

**4. Apply Terraform**

```bash
cd ../../infrastructure/terraform

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Note the Lambda Function URL output
```

**5. Test the Integration**

```bash
# Manual trigger test
cd ../scripts
./manage_scheduler.sh test

# Check logs
./manage_scheduler.sh logs

# Verify EventBridge schedule
./manage_scheduler.sh status
```

**Automated Daily Schedule:**

- **Time**: 4:05 PM EST (21:05 UTC)
- **Days**: Monday - Friday
- **Rule**: `marketminute-dev-daily-analysis`

The Lambda function will:

1. Fetch market data via Financial Modeling Prep API
2. Generate features for 21 tech tickers
3. Call SageMaker endpoint for predictions
4. Generate distributional forecasts
5. Save results to production database
6. Trigger Sentinel agent analysis

---

## 📊 API Endpoints

### ML Services (EC2-hosted)

- `POST :8001/score` - Sentiment analysis
  - Body: `{"text": "string"}`
  - Returns: `{"score": -1.0 to 1.0, "category": "very_negative|negative|neutral|positive|very_positive"}`
- `POST :8002/score` - Relevance scoring
  - Body: `{"headline": "string", "ticker": "string"}`
  - Returns: `{"score": 0.0 to 1.0, "category": "not_relevant|marginally_relevant|somewhat_relevant|highly_relevant"}`
- `GET :8001/health` - Sentiment service health check
- `GET :8002/health` - Relevance service health check

### Market Data

- `GET /api/snapshots` - Real-time stock quotes
- `GET /api/market-ticker` - Streaming market ticker data
- `GET /api/events` - Upcoming earnings and events
- `GET /api/ticker-search` - Symbol search and lookup

### Watchlists

- `GET/POST /api/watchlist` - Manage watchlists
- `POST/DELETE/PATCH /api/watchlist/items` - Manage watchlist items
- `PATCH /api/watchlist/favorite` - Toggle favorite status

### AI & Insights

- `POST /api/summary` - Generate AI market summaries
- `POST /api/explain` - Get detailed explanations for market movements
- `GET /api/smart-alerts` - Fetch triggered smart alerts
- `GET /api/macro-news` - Macro event detection
- `POST /api/sentinel` - Generate Sentinel AI market intelligence report

### Quant Lab

- `GET /api/quant/predictions` - Fetch ML trading predictions (from database)
- `GET /api/quant/forecasts` - Get distributional forecasts (from database)
- `POST /api/quant/save-results` - Save Lambda predictions to database (internal)
- `POST /api/quant/generate` - Trigger new predictions
- `POST /api/quant/run-script` - Execute quant scripts

### Admin & Monitoring

- `POST /api/admin/trigger-cron` - Manually trigger Lambda cron job (testing)

### User & Admin

- `PATCH /api/user/active-watchlist` - Set active watchlist
- `POST /api/visit-snapshot` - Create user visit snapshots
- `GET /api/daily-summary` - Historical daily summaries
- `POST /api/admin/cache` - Cache management
- `GET /api/admin/scripts` - List available scripts

---

## 🔐 Authentication

MarketMinute uses NextAuth.js v5 with OAuth providers:

- **Google OAuth**

Configure providers in `webapp/auth.ts` and set environment variables:

```bash
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

---

## 🗄️ Database Schema

Key models:

- **User** - User accounts with OAuth integration
- **Watchlist** - Custom watchlists with favorites
- **WatchlistItem** - Individual stocks with ordering
- **Session** - Session Auth
- **DailyWatchlistSummary** - Historical performance snapshots
- **NewsItem** - Processed news with ML-based sentiment and relevance scores
- **SentinelReport** - AI-generated market intelligence reports with structured narratives
- **InsightReport** - Historical insight reports
- **LivePrediction** - ML trading signals from Lambda (21 tickers daily)
- **DistribionalForecast** - Probabilistic price forecasts (21 tickers daily)

```
User
 ├── Watchlists (1-to-many)
 │     ├── WatchlistItems (1-to-many)
 │     └── Macros (1-to-many)
 ├── Accounts (OAuth providers)
 ├── Sessions (Auth)
 ├── DailyWatchlistSummaries (through watchlist)
 └── SentinelReports (1-to-many)

NewsItem
 ├── id, ticker, headline
 ├── sentiment (Float) - ML model score (-1.0 to 1.0)
 ├── relevance (Float, nullable) - ML model score (0.0 to 1.0)
 ├── category (String, nullable) - Relevance category
 ├── summary (String, nullable)
 └── createdAt (DateTime)

SentinelReport
 ├── summary (Text)
 ├── keyDrivers (JSON)
 ├── macroContext (Text, nullable)
 ├── whatThisMeans (JSON, nullable) - Structured narrative
 ├── anomaly flags (indexMove, sectorRotation, macroSurprise, volSpike)
 ├── volatility metrics (vix, vixChangePct, realizedVol)
 └── context (JSON) - Full market context for reprocessing

LivePrediction
 ├── ticker, timestamp, currentPrice
 ├── Raw ML Model Outputs (before news):
 │   ├── rawSignal, rawConfidence
 │   └── rawProbUp, rawProbNeutral, rawProbDown
 ├── News-Adjusted Outputs (after Bayesian update):
 │   ├── signal (BUY/SELL/NEUTRAL)
 │   ├── confidence, probUp, probNeutral, probDown
 │   └── newsCount (number of news items that influenced the update)
 ├── shouldTrade, takeProfit, stopLoss, atr
 └── runId (groups predictions from same Lambda run)

NewsItem
 ├── ticker, headline
 ├── sentiment (-1 to +1, from EC2 ML model)
 ├── relevance (0 to 1, from EC2 ML model)
 ├── category (company/sector/macro/noise)
 └── createdAt (for querying recent news)

DistribionalForecast
 ├── ticker, timestamp, currentPrice
 ├── expectedRangePct, upperBound, lowerBound
 ├── directionalBias, conviction, convictionScore
 ├── probability distribution (probLargeUp, probMildUp, probFlat, probMildDown, probLargeDown)
 ├── percentiles (p10, p50, p90)
 └── runId (groups forecasts from same Lambda run)
```

Run migrations:

```bash
npx prisma migrate dev
```

---

## 🔧 Configuration

### Web App

Configure in `webapp/.env.local`:

- Market data refresh interval (default: 30s)
- OpenAI model selection
- Cache TTL settings

### Quant System

Edit `quant/SYSTEM_SPEC.yaml`:

- Tickers to trade
- Feature engineering parameters
- TP/SL multipliers
- Risk management settings
- Walk-forward CV windows

---

## 📝 License

This project is private and proprietary.

---

## 🤝 Contributing

This is a private project. For questions or access, contact the repository owner.

---

## � Deployment

### Vercel (Web Application)

**Important Configuration:**

1. **Root Directory**: Set to `webapp` in Vercel project settings
2. **Environment Variables**: Configure in Vercel Dashboard
   - `DATABASE_URL` - Production PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Authentication secret
   - `NEXTAUTH_URL` - `https://market-minute.vercel.app`
   - `OPENAI_API_KEY` - OpenAI API key
   - `FMP_API_KEY` - Financial Modeling Prep API key
   - `LAMBDA_FUNCTION_URL` - AWS Lambda function URL

**Deploy:**

```bash
cd webapp
vercel deploy --prod
```

**Build Configuration:**

- Build Command: `prisma generate && next build`
- Output Directory: `.next`
- Install Command: `npm install`

### AWS (Infrastructure)

See **AWS Infrastructure Setup** section above for full deployment instructions.

**Quick Deploy:**

```bash
# 1. Deploy models
cd quant/sagemaker && ./deploy_sagemaker.sh
cd ../lambda && ./deploy_lambda.sh

# 2. Apply infrastructure
cd ../../infrastructure/terraform
terraform apply

# 3. Test
cd ../scripts && ./manage_scheduler.sh test
```

---

## 📚 Additional Resources

### Architecture Diagrams

- **System Architecture:** [View on Mermaid Chart](https://www.mermaidchart.com/d/b04d8bc2-1ebc-4be4-9af3-4521d3f75e5b)
- **Daily Cron Flow:** [View on Mermaid Chart](https://www.mermaidchart.com/d/3fb4ddc5-c176-4488-987a-cbc01cf20c96)

### Code & Configuration

- **System Specification:** [quant/SYSTEM_SPEC.yaml](quant/SYSTEM_SPEC.yaml)
- **Prisma Schema:** [webapp/prisma/schema.prisma](webapp/prisma/schema.prisma)
- **Terraform Configuration:** [infrastructure/terraform/](infrastructure/terraform/)
- **Lambda Handler:** [quant/lambda/lambda_handler.py](quant/lambda/lambda_handler.py)

---

## 🐛 Troubleshooting

### Common Issues

**TypeScript errors after schema changes:**

```bash
npx prisma generate
```

**FMP API errors:**

Ensure your `FMP_API_KEY` is valid and has sufficient quota. Free tier includes 250 requests/day.

**Database connection issues:**

```bash
npx prisma migrate reset
npx prisma migrate dev
```

**Missing environment variables:**
Check that all required variables are set in `.env.local` or `.env`

---

**Built with ❤️ for traders and quants**
