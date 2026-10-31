import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function signingSecret() {
  return process.env.ADMIN_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function signature(timestamp: string) {
  const secret = signingSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(`admin-session:${timestamp}`).digest("hex");
}

export function createAdminSessionToken() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return `${timestamp}.${signature(timestamp)}`;
}

export function isValidAdminSession(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;
  const [timestamp, supplied] = token.split(".");
  if (!timestamp || !supplied || !/^\d+$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now + 60 || now - issuedAt > SESSION_TTL_SECONDS) return false;
  const expected = signature(timestamp);
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
export const ADMIN_SESSION_TTL = SESSION_TTL_SECONDS;
