import "server-only";

type SchwabTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope?: string;
};

// Simple in-memory cache
let cachedAccessToken: {
  token: string;
  expiresAt: number; // ms since epoch
} | null = null;

export async function getSchwabAccessToken(): Promise<string> {
  // If we have a token and it's not about to expire, reuse it
  if (
    cachedAccessToken &&
    cachedAccessToken.expiresAt > Date.now() + 60 * 1000 // 60s safety buffer
  ) {
    return cachedAccessToken.token;
  }

  const clientId = process.env.SCHWAB_APP_KEY;
  const clientSecret = process.env.SCHWAB_APP_SECRET;
  const refreshToken = process.env.SCHWAB_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing SCHWAB_APP_KEY / SCHWAB_APP_SECRET / SCHWAB_REFRESH_TOKEN env vars"
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch("https://api.schwabapi.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Schwab refresh_token error:", res.status, text);
    throw new Error("Failed to refresh Schwab access token");
  }

  const json = (await res.json()) as
    | { token?: SchwabTokenResponse }
    | SchwabTokenResponse;

  // Some implementations wrap it in { token: { ... } }, some don't.
  const tokenObj: SchwabTokenResponse =
    "token" in json
      ? (json.token as SchwabTokenResponse)
      : (json as SchwabTokenResponse);

  const { access_token, expires_in } = tokenObj;

  // Cache for future calls
  cachedAccessToken = {
    token: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  console.log(
    "[Schwab] Refreshed access token, expires in",
    expires_in,
    "seconds"
  );

  return access_token;
}
