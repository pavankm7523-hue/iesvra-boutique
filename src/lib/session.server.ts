import crypto from "node:crypto";

export type SessionUser = { name: string; email: string; role: "user" | "admin"; isPlusMember?: boolean; plusExpiry?: string };
const COOKIE = "iesvra_session";

function secret() {
  const value = (process.env.AUTH_SESSION_SECRET || "").trim();
  if (value.length < 32) throw new Error("AUTH_SESSION_SECRET must be set to at least 32 characters.");
  return value;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function sessionCookie(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 86400000 })).toString("base64url");
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSession(request: Request): SessionUser | null {
  const raw = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number };
  return value.exp > Date.now() ? value : null;
}

export function requireAdmin(request: Request): Response | null {
  const user = readSession(request);
  return user?.role === "admin" ? null : new Response(JSON.stringify({ error: "Administrator authorization required." }), {
    status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
