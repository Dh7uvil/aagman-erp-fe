import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/modules/users-management/auth/components/login-form";
import { getSession, redirectIfStaleSessionCookie } from "@/shared/auth/session";

function LoginPageFallback() {
  return <p className="text-muted-foreground text-sm">Loading sign in…</p>;
}

async function LoginPageContent() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }
  await redirectIfStaleSessionCookie();

  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
