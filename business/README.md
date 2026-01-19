# Mintalyze Business

Expectation Gap Engine (EGE) - Institutional-grade analysis platform for serious investors.

## Features

- **Expectation Gap Analysis** - Classify price moves as fundamental, macro, positioning, narrative, or noise
- **Card Library** - Save and organize analysis cards with filtering by ticker and date
- **Authentication** - Google OAuth with user sessions
- **Responsive Design** - Desktop sidebar + mobile navigation

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` - PostgreSQL connection string (shared with main webapp)
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `AUTH_URL` - Set to `https://business.mintalyze.com` in production
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret
- `FMP_API_KEY` - Financial Modeling Prep API key

Optional (for ML-enhanced analysis):

- `SENTIMENT_SERVICE_URL` - ML sentiment scoring service
- `RELEVANCE_SERVICE_URL` - ML relevance filtering service

### 2. Database Setup

The business app shares the same database as the main webapp. Run migrations from the webapp folder:

```bash
cd ../webapp
npx prisma db push
```

### 3. Development

```bash
npm install
npm run dev  # Runs on http://localhost:3002
```

### 4. Production Build

```bash
npm run build
npm start
```

## Deployment

Deploy to `https://business.mintalyze.com` via Vercel:

### Vercel Configuration

1. **Create Project**: Import from the `business` folder
2. **Root Directory**: Set to `business`
3. **Domain**: Add `business.mintalyze.com`
4. **Environment Variables**: Add all variables from `.env.example`
   - `AUTH_URL=https://business.mintalyze.com`
   - `DATABASE_URL=<production-db-url>`
   - `AUTH_SECRET=<generated-secret>`
   - `AUTH_GOOGLE_ID=<google-client-id>`
   - `AUTH_GOOGLE_SECRET=<google-client-secret>`
   - `FMP_API_KEY=<fmp-api-key>`

### Google OAuth Configuration

In Google Cloud Console, add authorized redirect URIs:

- `https://business.mintalyze.com/api/auth/callback/google`
- `http://localhost:3002/api/auth/callback/google` (for development)

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- NextAuth.js 5 (Google OAuth)
- Prisma (PostgreSQL)
- Lucide Icons
