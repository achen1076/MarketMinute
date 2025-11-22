import fs from "fs";

export function getSchwabAccessTokenFromFile(): string {
  const raw = fs.readFileSync("schwab_token.json", "utf8");
  const json = JSON.parse(raw);

  if (!json.token || !json.token.access_token) {
    throw new Error("Invalid schwab_token.json");
  }

  return json.token.access_token;
}
