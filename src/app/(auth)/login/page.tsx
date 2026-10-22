import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/modules/users-management/auth/components/login-form";
import { getSession, redirectIfStaleSessionCookie } from "@/shared/auth/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }
  await redirectIfStaleSessionCookie();

  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading sign in…</p>}>
      <LoginForm />
    </Suspense>
  );
}
