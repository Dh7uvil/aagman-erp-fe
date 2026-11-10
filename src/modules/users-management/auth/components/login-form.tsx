"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { APP_NAME } from "@/config/constants";
import { useLogin } from "@/modules/users-management/auth/mutations";
import { LoginFormSchema, type LoginFormValues } from "@/modules/users-management/auth/schemas";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { resolvePostLoginPath } from "@/shared/lib/redirect";
import { cn } from "@/shared/lib/cn";

const authFieldClass =
  "h-12 rounded-xl border border-[#e4e7eb] bg-white text-[15px] shadow-none placeholder:text-[#9aa3ad] focus-visible:border-[#0c684f] focus-visible:ring-[3px] focus-visible:ring-[#0c684f]/20";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const rememberMeId = useId();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.replace(resolvePostLoginPath(searchParams.get("next")));
      router.refresh();
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
      if (isApiError(error) && error.code === "AUTH_INVALID_CREDENTIALS") {
        form.setFocus("password");
      }
    }
  }

  const submit = form.handleSubmit(onSubmit);
  const pending = login.isPending || form.formState.isSubmitting;

  function toggleShowPassword() {
    setShowPassword((value) => !value);
  }

  return (
    <>
      <div className="mb-7 text-center">
        <p className="text-sm text-[#8b939e]">Welcome to</p>
        <h2 className="text-foreground mt-1 text-[1.65rem] leading-tight font-bold tracking-tight">
          {APP_NAME}
        </h2>
      </div>
      <Form {...form}>
        <div
          role="form"
          aria-label="Sign in"
          className="flex touch-manipulation flex-col gap-4"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !pending) {
              event.preventDefault();
              void submit();
            }
          }}
        >
          {formError ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-1">
                <FormLabel className="sr-only">Company email</FormLabel>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9aa3ad]"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Company email"
                      className={cn(authFieldClass, "pl-10")}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-1">
                <FormLabel className="sr-only">Password</FormLabel>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9aa3ad]"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <Input
                      key={showPassword ? "text" : "password"}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Password"
                      className={cn(authFieldClass, "pr-12 pl-10")}
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute top-1/2 right-0.5 z-10 flex size-11 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-lg text-[#9aa3ad] hover:text-[#4b5563]"
                    onClick={() => toggleShowPassword()}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="pointer-events-none size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="pointer-events-none size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <FormField
              control={form.control}
              name="remember_me"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-0 space-y-0">
                  <label
                    htmlFor={rememberMeId}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 touch-manipulation"
                  >
                    <input
                      type="checkbox"
                      id={rememberMeId}
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="size-4 shrink-0 cursor-pointer rounded-[4px] border border-[#d0d5dd] accent-[#0c684f]"
                    />
                    <span className="text-sm font-normal text-[#6b7280]">Remember me</span>
                  </label>
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#12866c] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="button"
            className="h-12 w-full touch-manipulation rounded-xl bg-[#0c684f] text-[15px] font-semibold text-white shadow-none hover:bg-[#0a5742]"
            disabled={pending}
            onClick={() => void submit()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Sign In
            {pending ? null : <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>

          <div className="mt-2 flex items-center gap-3 text-xs text-[#9aa3ad]">
            <span className="h-px flex-1 bg-[#e6e8ec]" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-3.5" aria-hidden="true" />
              Secure Access
            </span>
            <span className="h-px flex-1 bg-[#e6e8ec]" aria-hidden="true" />
          </div>
        </div>
      </Form>
    </>
  );
}
