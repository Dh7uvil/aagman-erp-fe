"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { AlertCircle, AtSign, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { COMPANY_EMAIL_PLACEHOLDER } from "@/config/constants";
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
      <div className="mb-7">
        <h2 className="text-foreground text-xl font-semibold">Sign in to your account</h2>
        <p className="text-muted-foreground mt-1 text-sm">Authorized employees only</p>
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
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Email</FormLabel>
                <div className="relative">
                  <AtSign
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={COMPANY_EMAIL_PLACEHOLDER}
                      className="h-11 pl-9 md:h-9"
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
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      key={showPassword ? "text" : "password"}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-11 pr-12 md:h-9"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0.5 z-10 flex size-11 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-md"
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormField
              control={form.control}
              name="remember_me"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <label
                    htmlFor={rememberMeId}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 touch-manipulation"
                  >
                    <input
                      type="checkbox"
                      id={rememberMeId}
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="border-input size-4 shrink-0 cursor-pointer rounded-[4px] accent-primary"
                    />
                    <span className="text-muted-foreground text-sm font-normal">Remember me</span>
                  </label>
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className="text-primary inline-flex min-h-11 items-center text-sm hover:underline sm:min-h-0"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-1 h-12 w-full touch-manipulation"
            disabled={pending}
            onClick={() => void submit()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Sign In
          </Button>
        </div>
      </Form>
    </>
  );
}
