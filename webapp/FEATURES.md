# MarketMinute Features

## ✅ Implemented Features

### 1. **Authentication & User Management**
- ✅ Google OAuth via NextAuth.js v5
- ✅ User info displayed in sidebar (avatar/name)
- ✅ Sign out button in sidebar
- ✅ Protected routes (dashboard and watchlist pages)
- ✅ Automatic redirect to sign-in for unauthenticated users

### 2. **Watchlist Management**
- ✅ Create watchlists with custom names
- ✅ Add multiple stock symbols (comma-separated)
- ✅ View all watchlists with symbol counts
- ✅ User-specific watchlists (tied to authenticated user)
- ✅ **Active watchlist selection** - users can pick which watchlist is "active"
- ✅ Active watchlist persisted in database

### 3. **Dashboard Integration**
- ✅ Active watchlist displayed on homepage
- ✅ Key stats for active watchlist:
  - Watchlist name and symbol count
  - Active macros count
  - Total symbols tracked
  - Alerts placeholder
- ✅ List of tracked symbols displayed
- ✅ Active macros list with descriptions
- ✅ Watchlist selector with visual feedback

### 4. **Macros System**
- ✅ Create macros attached to watchlists
- ✅ Three macro types:
  - **Price Change**: Alert when price moves ±X%
  - **Volume Spike**: Alert when volume is Xx average
  - **Near 52w High**: Alert when within X% of 52-week high
- ✅ Macro parameters stored as JSON
- ✅ Enabled/disabled status per macro
- ✅ Visual macro cards showing type and parameters
- ✅ Expandable "Manage" section in each watchlist card
- ✅ Inline macro creation form with:
  - Custom name input
  - Type selector dropdown
  - Dynamic threshold/parameter input

### 5. **Database Schema**
- ✅ Users table with `activeWatchlistId`
- ✅ Watchlists table with user relation
- ✅ WatchlistItems table for stock symbols
- ✅ Macros table for automation rules
- ✅ Proper foreign keys and cascade deletes
- ✅ Snake_case column names with Prisma `@map` directives

### 6. **API Endpoints**
- ✅ `POST /api/watchlist` - Create watchlist
- ✅ `GET /api/watchlist` - Get user's watchlists
- ✅ `POST /api/user/active-watchlist` - Set active watchlist
- ✅ `POST /api/macros` - Create macro
- ✅ `GET /api/macros` - Get watchlist macros
- ✅ `DELETE /api/macros` - Delete macro
- ✅ All endpoints protected with authentication

### 7. **UI/UX Enhancements**
- ✅ User avatar (initials fallback) in sidebar
- ✅ User name/email display
- ✅ Responsive sidebar with mobile menu
- ✅ Clean card-based layouts
- ✅ Loading states for all async operations
- ✅ Empty states with helpful CTAs
- ✅ Color-coded status indicators (active/inactive macros)
- ✅ Expandable watchlist management sections

## 🎯 How to Use

### Creating a Watchlist
1. Go to `/watchlist`
2. Enter a watchlist name (e.g., "Tech Momentum")
3. Add symbols separated by commas (e.g., "AAPL, MSFT, NVDA")
4. Click "Add"

### Setting Active Watchlist
1. Go to `/` (dashboard)
2. Click on any watchlist button in the "Active Watchlist" section
3. The dashboard will update to show stats for that watchlist

### Adding Macros
1. Go to `/watchlist`
2. Click "Manage" on any watchlist card
3. Fill in the macro creation form:
   - Name: e.g., "5% Price Alert"
   - Type: Select from dropdown (Price Change, Volume Spike, Near 52w High)
   - Threshold: Enter value (e.g., 5 for 5%)
4. Click "Add Macro"
5. Macro will appear in the watchlist card and on the dashboard

## 🔧 Technical Stack
- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5 with Google Provider
- **State**: React useState (client components)
- **Validation**: Server-side with Prisma

## 📊 Database Models
- `User` - Auth users with active watchlist reference
- `Account` - OAuth accounts (NextAuth)
- `Session` - User sessions (NextAuth)
- `Watchlist` - User's watchlists
- `WatchlistItem` - Stock symbols in watchlists
- `Macro` - Automation rules attached to watchlists

## 🚀 Next Steps (Future Enhancements)
- Real-time stock price data integration
- Actual macro execution and alert generation
- Email/SMS notifications for triggered macros
- Historical performance tracking
- Portfolio integration
- Macro scheduling and time-based triggers
- Advanced macro conditions (multiple criteria)
- Macro templates/presets
- Export/import watchlists
- Collaborative watchlists
