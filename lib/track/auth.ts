import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "stats_session";

// The session cookie is an HMAC of the password: changing STATS_PASSWORD signs everyone out.
export function sessionToken() {
  const password = process.env.STATS_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("stats-session-v1").digest("hex");
}

export function passwordMatches(input: string) {
  const password = process.env.STATS_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isSignedIn() {
  const token = sessionToken();
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !value || value.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(token));
}
