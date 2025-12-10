# Rate Limiting Configuration

This document lists all API endpoints with rate limiting in MarketMinute.

## Rate Limit Presets

Located in `/lib/rateLimit.ts`:

| Preset                | Limit       | Window                | Use Case                        |
| --------------------- | ----------- | --------------------- | ------------------------------- |
| `AI_EXPLAIN`          | 10 requests | 60 seconds            | AI explanation endpoints        |
| `AI_SENTINEL`         | 3 requests  | 300 seconds (5 min)   | AI Sentinel reports             |
| `AI_SUMMARY`          | 15 requests | 60 seconds            | Watchlist summaries             |
| `MARKET_DATA`         | 30 requests | 60 seconds            | Market data endpoints           |
| `GENERAL`             | 60 requests | 60 seconds            | General API endpoints           |
| `AUTH`                | 5 requests  | 3600 seconds (1 hour) | Authentication operations       |
| `AUTH_PASSWORD_RESET` | 3 requests  | 3600 seconds (1 hour) | Password reset requests         |
| `DATA_FETCH`          | 30 requests | 60 seconds            | Data fetching endpoints         |
| `MUTATION`            | 20 requests | 60 seconds            | Create/update/delete operations |
| `SUBSCRIPTION`        | 5 requests  | 3600 seconds (1 hour) | Subscription checkout/portal    |

---

## Protected Endpoints

### Authentication Endpoints

#### `/api/auth/signup` (POST)

- **Limit:** 5 requests per hour
- **Identifier:** Email address (lowercase)
- **Purpose:** Prevent spam account creation
- **Preset:** `AUTH`

#### `/api/auth/forgot-password` (POST)

- **Limit:** 3 requests per hour
- **Identifier:** Email address (lowercase)
- **Purpose:** Prevent email bombing
- **Preset:** `AUTH_PASSWORD_RESET`

#### `/api/auth/reset-password` (POST)

- **Limit:** 5 requests per hour
- **Identifier:** Email address (lowercase)
- **Purpose:** Prevent brute force attacks on password reset
- **Preset:** `AUTH`

#### `/api/auth/check-method` (POST)

- **Limit:** 10 requests per minute
- **Identifier:** Email address (lowercase)
- **Purpose:** Prevent email enumeration attacks
- **Custom config:** `{ maxRequests: 10, windowSeconds: 60 }`

---

### AI-Powered Endpoints

#### `/api/explain` (POST)

- **Limit:** 10 requests per minute
- **Identifier:** User email
- **Purpose:** Prevent abuse of expensive OpenAI calls
- **Preset:** `AI_EXPLAIN`

#### `/api/summary` (GET)

- **Limit:** 15 requests per minute
- **Identifier:** User email
- **Purpose:** Limit AI summary generation costs
- **Preset:** `AI_SUMMARY`

#### `/api/sentinel` (POST)

- **Limit:** 3 requests per 5 minutes
- **Identifier:** User email (or "anonymous")
- **Purpose:** Heavy AI usage (multiple steps), strict limit
- **Preset:** `AI_SENTINEL`

#### `/api/sentinel/preview` (POST)

- **Limit:** 3 requests per 5 minutes
- **Identifier:** User email (or "anonymous")
- **Purpose:** Heavy AI usage, preview mode
- **Preset:** `AI_SENTINEL`

---

### Data Fetching Endpoints

#### `/api/snapshots` (GET)

- **Limit:** 30 requests per minute
- **Identifier:** User email
- **Purpose:** Limit external FMP API calls
- **Preset:** `DATA_FETCH`

---

### Mutation Endpoints

#### `/api/watchlist` (POST)

- **Limit:** 20 requests per minute
- **Identifier:** User email
- **Purpose:** Prevent watchlist spam creation
- **Preset:** `MUTATION`

---

### Subscription Endpoints

#### `/api/subscription/create-checkout` (POST)

- **Limit:** 5 requests per hour
- **Identifier:** User email
- **Purpose:** Prevent checkout session spam
- **Preset:** `SUBSCRIPTION`

#### `/api/subscription/portal` (POST)

- **Limit:** 5 requests per hour
- **Identifier:** User email
- **Purpose:** Prevent portal session spam
- **Preset:** `SUBSCRIPTION`

---

### Admin Endpoints

#### `/api/admin/scripts` (POST)

- **Limit:** 5 requests per 5 minutes
- **Identifier:** User email
- **Purpose:** Limit script execution
- **Custom config:** `{ maxRequests: 5, windowSeconds: 300 }`

#### `/api/admin/trigger-cron` (POST)

- **Limit:** 10 requests per hour
- **Identifier:** User email
- **Purpose:** Prevent cron trigger spam
- **Custom config:** `{ maxRequests: 10, windowSeconds: 3600 }`

---

### Quant Lab Endpoints

#### `/api/quant/generate` (POST)

- **Limit:** 3 requests per 5 minutes
- **Identifier:** User email
- **Purpose:** Expensive prediction generation
- **Custom config:** `{ maxRequests: 3, windowSeconds: 300 }`

---

## Rate Limit Response

When a rate limit is exceeded, the API returns:

### HTTP Status Code

```
429 Too Many Requests
```

### Response Body

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

### Response Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702168923000
Retry-After: 45
```

---

## Implementation Details

### Storage

- Uses **in-memory storage** with sliding window algorithm
- Automatic cleanup of expired entries every 5 minutes
- Keys format: `{endpoint}:{identifier}`

### Identifier

- **Authenticated endpoints:** User email address
- **Unauthenticated endpoints:** IP address (not yet implemented)

### Window Algorithm

- **Sliding window** approach
- Resets after the specified window duration
- Counter increments on each request

---

## Endpoints WITHOUT Rate Limiting

The following endpoints currently lack rate limiting and should be considered for future implementation:

### High Priority

- `/api/events` - Database queries
- `/api/macro-news` - External API + AI processing
- `/api/daily-summary` - AI generation
- `/api/ticker-search` - Public endpoint, needs IP-based limiting

### Medium Priority

- `/api/watchlist/items` (POST/DELETE) - Item mutations
- `/api/macros` (POST/DELETE) - Macro mutations
- `/api/watchlist/favorite` (POST) - Favorite toggling

### Low Priority

- `/api/user/active-watchlist` - Lightweight update
- `/api/watchlist` (DELETE) - Already covered by POST limit
- `/api/subscription/status` (GET) - Read-only

---

## Testing Rate Limits

To test rate limits locally:

1. Make repeated requests to an endpoint
2. Observe the `X-RateLimit-Remaining` header decreasing
3. When limit is hit, expect `429` response
4. Wait for the `Retry-After` duration
5. Request should succeed again

Example with curl:

```bash
# Make 6 signups in a row (limit is 5/hour)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"password123\"}"
  echo "\n"
done
```

The 6th request should return `429 Too Many Requests`.

---

## Updating Rate Limits

To modify rate limits:

1. Update presets in `/lib/rateLimit.ts`
2. Or pass custom config to `checkRateLimit()`:
   ```typescript
   const rateLimitResult = checkRateLimit("my-endpoint", identifier, {
     maxRequests: 100,
     windowSeconds: 60,
   });
   ```

No database migration needed - changes take effect immediately.
