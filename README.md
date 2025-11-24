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

---

## 🎯 Overview

MarketMinute consists of three integrated systems:

**Web Application** - Modern Next.js dashboard for market monitoring and AI insights  
**Quant Lab System** - ML-powered engine with movement predictions and forecasts  
**AWS Infrastructure** - Serverless Lambda + SageMaker for automated daily analysis

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
- **Real-time Market Data** - Live quotes and price updates via Schwab API
- **AI Market Summaries** - Natural language summaries powered by LangChain & OpenAI
- **Smart Alerts** - Automated notifications for price movements, volume spikes, and 52-week highs
- **Events Timeline** - Track upcoming earnings dates and key market events
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
- **Secrets Management** - AWS Secrets Manager for Schwab OAuth tokens
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
- **Database:** PostgreSQL

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
- **Market Data:** Schwab API (schwab-py)

### Infrastructure & Cloud

- **Market Data Provider:** Schwab API
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
- `schwabAuth` - Schwab API OAuth flow
- `marketData` - Market data fetching and transformation
- `eventDetector` - Macro event detection logic

---

## 🧠 Sentinel AI Agent

The Sentinel AI Agent is an autonomous market intelligence system that provides real-time market analysis with human-readable narratives.

### Architecture

**Multi-Stage Pipeline:**

1. **Market Snapshot** - Fetches real-time data from Schwab API
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
├── webapp/                    # Next.js web application
│   ├── app/                   # App router pages
│   │   ├── api/              # API routes (30+ endpoints)
│   │   ├── (auth)/           # Authentication pages
│   │   ├── admin/            # Admin dashboard
│   │   ├── forecasts/        # ML forecasts page
│   │   ├── history/          # Historical data view
│   │   ├── quant/            # Quant lab interface
│   │   ├── sentinel/         # Sentinel AI dashboard
│   │   └── watchlist/        # Watchlist management
│   ├── agents/               # AI agent systems
│   │   └── sentinel/         # Sentinel agent implementation
│   │       ├── agent/        # Core agent logic
│   │       │   ├── anomaly.ts    # Anomaly detection
│   │       │   ├── context.ts    # Context builder
│   │       │   ├── loop.ts       # Main execution loop
│   │       │   ├── report.ts     # Report generation
│   │       │   └── types.ts      # Type definitions
│   │       ├── config/       # Configuration
│   │       ├── llm/          # LLM integration
│   │       └── market/       # Market data fetchers
│   ├── components/
│   │   ├── atoms/            # Basic UI components
│   │   ├── molecules/        # Composite components
│   │   └── organisms/        # Complex feature components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and helpers
│   ├── prisma/               # Database schema and migrations
│   └── public/               # Static assets
│
├── quant/                     # Quantitative trading system
│   ├── backtest/             # Backtesting engines
│   ├── paper_trading/        # Live paper trading
│   ├── dashboards/           # Streamlit dashboards
│   ├── scripts/              # CLI utilities
│   ├── lambda/               # AWS Lambda function
│   │   ├── lambda_handler.py # Orchestrator function
│   │   ├── predictions.py    # Prediction generation
│   │   ├── forecasting.py    # Distributional forecasts
│   │   ├── Dockerfile        # Lambda container config
│   │   └── deploy_lambda.sh  # Deployment script
│   ├── src/                  # Core library
│   │   ├── data/            # Data loading & processing
│   │   └── models/          # ML model implementations
│   ├── data/                 # Data storage
│   └── outputs/              # Models & results
│
└── infrastructure/            # Cloud infrastructure
    ├── terraform/            # Infrastructure as Code
    │   ├── lambda.tf        # Lambda function config
    │   ├── sagemaker.tf     # SageMaker endpoint config
    │   ├── scheduler.tf     # EventBridge cron job
    │   ├── secrets.tf       # Secrets Manager config
    │   ├── variables.tf     # Terraform variables
    │   └── terraform.tfvars # Configuration values
    └── scripts/             # Management utilities
        └── manage_scheduler.sh  # Cron job management
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL
- Schwab API credentials

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
# - SCHWAB_APP_KEY
# - SCHWAB_APP_SECRET

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

# Setup Schwab authentication
python3 scripts/setup_schwab_auth.py

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

1. Fetch market data via Schwab API
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

## 📈 Quant System Performance

**2024 YTD Backtest Results:**

- Directional accuracy: 54–59% depending on symbol
- Model stability (Sharpe-like metric): 3.40
- Largest downward deviation: -17.9% equivalent simulated drawdown
- Scenario frequency: ~10–12% strong-signal days

**Key Parameters:**

- Confidence threshold: 64%
- Position size: 10% per trade
- Stop loss: 1.5x ATR
- Take profit: 2.5x ATR
- Risk/Reward: ~1.67:1

---

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
   - `SCHWAB_CLIENT_ID` - Schwab API client ID
   - `SCHWAB_CLIENT_SECRET` - Schwab API secret
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

## �📚 Additional Resources

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

**Schwab API 401 errors:**

```bash
python3 scripts/setup_schwab_auth.py
```

**Database connection issues:**

```bash
npx prisma migrate reset
npx prisma migrate dev
```

**Missing environment variables:**
Check that all required variables are set in `.env.local` or `.env`

---

**Built with ❤️ for traders and quants**
