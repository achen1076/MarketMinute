const ADMIN_EMAILS = [
  "achen1076@gmail.com",
  ...(process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()),
].filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

/** Service-to-service calls (Lambda → webapp). Fails closed when LAMBDA_API_KEY is unset. */
export function isInternalRequest(req: Request): boolean {
  const key = process.env.LAMBDA_API_KEY;
  return !!key && req.headers.get("x-api-key") === key;
}
