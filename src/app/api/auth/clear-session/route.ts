import { NextResponse } from "next/server";

import { clearTokenCookies } from "@/shared/auth/cookies";

/** Clears invalid auth cookies and sends the browser to sign-in. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearTokenCookies(response, request);
  return response;
}
