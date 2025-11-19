# MarketMinute

**Your automated minute view of the markets.**

MarketMinute is a full-stack financial intelligence platform that combines real-time market data, AI-powered insights, and institutional-grade quantitative trading capabilities. Get instant market summaries, track custom watchlists, and leverage machine learning models for trading signals—all in one unified dashboard.

---

## 🎯 Overview

MarketMinute consists of two integrated systems:

**Web Application** - Modern Next.js dashboard for market monitoring and AI insights
**Quantitative Lab System** - ML-powered engine with movements predictions and forcasts

---

## ✨ Key Features

### 📊 Market Intelligence

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
- **Backtesting Engine** - Multi-year historical performance validation
- **Paper Trading** - Live simulation with realistic execution costs
- **Interactive Dashboards** - Streamlit-based visualization and monitoring
- **Walk-Forward Validation** - Robust cross-validation strategy

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

### Infrastructure

- **Market Data Provider:** Schwab API
- **Deployment:** Vercel-ready (Next.js)
- **Version Control:** Git
- **Environment:** Node.js 20+, Python 3.10+

---

## 🎨 Component Architecture

### Design System

- **Atoms** - Button, Card, Dialog, Stack, Box
- **Molecules** - TickerSearch, TickerListClient
- **Organisms** - Sidebar, MarketTicker, MarketMinuteSummary, SmartAlertsBar, EventsTimeline

### Key Hooks

- `useScrollAnimation` - Scroll-triggered animations
- `useWindowSize` - Responsive layout management

### Utilities

- `cacheManager` - Server-side caching with revalidation
- `schwabAuth` - Schwab API OAuth flow
- `marketData` - Market data fetching and transformation
- `eventDetector` - Macro event detection logic

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
│   │   └── watchlist/        # Watchlist management
│   ├── components/
│   │   ├── atoms/            # Basic UI components
│   │   ├── molecules/        # Composite components
│   │   └── organisms/        # Complex feature components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and helpers
│   ├── prisma/               # Database schema and migrations
│   └── public/               # Static assets
│
└── quant/                     # Quantitative trading system
    ├── backtest/             # Backtesting engines
    ├── paper_trading/        # Live paper trading
    ├── dashboards/           # Streamlit dashboards
    ├── scripts/              # CLI utilities
    ├── src/                  # Core library
    │   ├── data/            # Data loading & processing
    │   └── models/          # ML model implementations
    ├── data/                 # Data storage
    └── outputs/              # Models & results
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
npx prisma generate

# Run development server
npm run dev
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

# Generate Forcasts
python3 scripts/generate_distributional_forcasts.py
```

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

### Quant Lab

- `GET /api/quant/predictions` - Fetch ML trading predictions
- `GET /api/quant/forecasts` - Get distributional forecasts
- `POST /api/quant/generate` - Trigger new predictions
- `POST /api/quant/run-script` - Execute quant scripts

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
- **Macro** - Custom alert rules with parameters
- **DailyWatchlistSummary** - Historical performance snapshots
- **UserVisitSnapshot** - User activity tracking

Run migrations:

```bash
npx prisma migrate dev
```

---

## 📈 Quant System Performance

**2024 YTD Backtest Results:**

- **Return:** +129% (portfolio)
- **Win Rate:** 54.3%
- **Sharpe Ratio:** 3.40
- **Max Drawdown:** -17.9%

**Key Parameters:**

- Confidence threshold: 64%
- Position size: 10% per trade
- Stop loss: 1.5x ATR
- Take profit: 2.5x ATR
- Risk/Reward: ~1.67:1

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

## 📚 Additional Resources

- **System Specification:** [quant/SYSTEM_SPEC.yaml](quant/SYSTEM_SPEC.yaml)
- **Prisma Schema:** [webapp/prisma/schema.prisma](webapp/prisma/schema.prisma)

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
