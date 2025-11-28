# MarketMinute

**Your automated minute view of the markets.**

MarketMinute is a full-stack financial intelligence platform that combines real-time market data, AI-powered insights, and institutional-grade quantitative trading capabilities. Get instant market summaries, track custom watchlists, and leverage machine learning models for trading signals—all in one unified dashboard.

---

## 🆕 Recent Updates

### AWS Serverless Infrastructure (v2.0)

- **☁️ Lambda + SageMaker** - Fully serverless ML inference pipeline
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

- Added `SentinelReport` model with structured narrative storage
- Added `LivePrediction` model for ML trading signals (21 tickers daily)
- Added `DistribionalForecast` model for probabilistic forecasts (21 tickers daily)
- JSON fields for flexible data structures (`whatThisMeans`, `context`, `keyDrivers`)
- Indexed anomaly flags and `runId` for efficient querying

### Performance Optimizations (Nov 2025)

- **⚡ Batch API Operations** - FMP Premium batch-quote endpoint for single-call ticker fetching
- **🚀 Redis Caching** - 30-second TTL with Upstash Redis for shared cross-instance cache
- **📊 Database Query Optimization** - Fixed N+1 queries in events API (430+ queries → 2 queries)
- **💾 30-Year Historical Data** - Upgraded from 5 years to up to 30 years of training data (~7,560 days)
- **🔄 Parallel Writes** - Promise.all for concurrent Redis operations
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
- **Lambda**: Fetches 30 years of market data from Financial Modeling Prep API
- **Lambda**: Calls SageMaker endpoint for ML predictions
- **Lambda**: Generates distributional forecasts and trading signals
- **Lambda**: Saves results to PostgreSQL database
- **Lambda**: Triggers Sentinel AI agent for market analysis
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
- **ML Infrastructure:** AWS Lambda + SageMaker (serverless inference)
- **Orchestration:** AWS EventBridge (cron scheduler)
- **Secrets:** AWS Secrets Manager
- **Container Registry:** AWS ECR (Docker images)
- **Infrastructure as Code:** Terraform
- **Version Control:** Git
- **Environment:** Node.js 20+, Python 3.10+

---

## 🎨 Component Architecture

### Design System

- **Atoms** - Button, Card, Dialog, Stack, Box
- **Molecules** - TickerSearch, TickerListClient, VolatilityCard, MarketSignalsCard, MarketSummaryCard, RegimeComponentsCard
- **Organisms** - Sidebar, MarketTicker, MarketMinuteSummary, SmartAlertsBar, EventsTimeline, SentinelExplainToday, WhatThisMeans, ProfessionalInsights

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
   - Summary and key drivers (GPT-4 Turbo)
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
│   │   ├── admin/            # Admin dashboard
│   │   │   └── page.tsx      # Admin interface
│   │   ├── api/              # API routes (30+ endpoints)
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── quant/        # Quant data endpoints
│   │   │   ├── sentinel/     # Sentinel agent endpoints
│   │   │   ├── watchlist/    # Watchlist endpoints
│   │   │   └── ...           # Market data, news, etc.
│   │   ├── forecasts/        # ML forecasts page
│   │   │   └── page.tsx      # Forecasts dashboard
│   │   ├── history/          # Historical data view
│   │   │   └── page.tsx      # History dashboard
│   │   ├── quant/            # Quant lab interface
│   │   │   └── page.tsx      # Quant dashboard
│   │   ├── sentinel/         # Sentinel AI dashboard
│   │   │   ├── page.tsx      # Sentinel dashboard
│   │   │   └── [reportId]/   # Individual report view
│   │   ├── watchlist/        # Watchlist management
│   │   │   ├── page.tsx      # Watchlist dashboard
│   │   │   └── [symbol]/     # Individual stock view
│   │   ├── DashboardClient.tsx  # Main dashboard client
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   └── globals.css       # Global styles
│   │
│   ├── agents/               # AI agent systems
│   │   └── sentinel/         # Sentinel agent implementation
│   │       ├── agent/        # Core agent logic
│   │       │   ├── drilldown.ts  # Drilldown causation
│   │       │   ├── context.ts    # Context builder
│   │       │   ├── loop.ts       # Main execution loop
│   │       │   ├── report.ts     # Report generation
│   │       │   └── types.ts      # Type definitions
│   │       ├── config/       # Configuration
│   │       │   ├── prompts.ts    # LLM prompts
│   │       │   └── types.ts      # Config types
│   │       ├── llm/          # LLM integration
│   │       │   ├── client.ts     # OpenAI client
│   │       │   ├── schemas.ts    # Response schemas
│   │       │   └── ...       # Prompt engineering
│   │       └── services/     # Market data fetchers
│   │           ├── marketData.ts    # Price data
│   │           ├── newsService.ts   # News aggregation
│   │           └── ...       # Sentiment, sector data
│   │
│   ├── components/           # React components
│   │   ├── README.md         # Component documentation
│   │   ├── atoms/            # Basic UI components
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ...           # 12 atomic components
│   │   ├── molecules/        # Composite components
│   │   │   ├── MarketSignalsCard.tsx
│   │   │   ├── MarketSummaryCard.tsx
│   │   │   ├── RegimeComponentsCard.tsx
│   │   │   ├── VolatilityCard.tsx
│   │   │   └── ...           # 11 molecular components
│   │   └── organisms/        # Complex feature components
│   │       ├── LambdaCronRunner.tsx
│   │       ├── ProfessionalInsights.tsx
│   │       ├── SentinelExplainToday.tsx
│   │       ├── WhatThisMeans.tsx
│   │       └── ...           # 20 organism components
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
 ├── signal (BUY/SELL/NEUTRAL)
 ├── confidence, probUp, probNeutral, probDown
 ├── shouldTrade, takeProfit, stopLoss, atr
 └── runId (groups predictions from same Lambda run)

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
