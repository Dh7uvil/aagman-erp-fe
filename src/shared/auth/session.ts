import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { serverRequest } from "@/shared/api/server-client";
import { SessionUserSchema, type SessionUser } from "@/shared/auth/session-schema";

const CLEAR_STALE_SESSION_PATH = "/api/auth/clear-session";

export type { SessionUser } from "@/shared/auth/session-schema";

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(env.AUTH_ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(env.AUTH_REFRESH_COOKIE)?.value;
}

export async function hasSessionCookie(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

export async function getSession(): Promise<SessionUser | null> {
  if (!(await hasSessionCookie())) {
    return null;
  }

  try {
    return SessionUserSchema.parse(await serverRequest("/auth/me"));
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const hadCookie = await hasSessionCookie();
  const session = await getSession();
  if (!session) {
    redirect(hadCookie ? CLEAR_STALE_SESSION_PATH : "/login");
  }
  return session;
}

/** Call after `getSession()` returned null; clears cookies when a stale token remains. */
export async function redirectIfStaleSessionCookie(): Promise<void> {
  if (await hasSessionCookie()) {
    redirect(CLEAR_STALE_SESSION_PATH);
  }
}
