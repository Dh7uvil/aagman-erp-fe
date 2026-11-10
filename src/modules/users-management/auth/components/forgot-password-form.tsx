"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { AtSign, CheckCircle, ChevronLeft, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { COMPANY_EMAIL_PLACEHOLDER } from "@/config/constants";
import { useForgotPassword } from "@/modules/users-management/auth/mutations";
import {
  ForgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/modules/users-management/auth/schemas";
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
import { getErrorMessage } from "@/shared/api/errors";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { cn } from "@/shared/lib/cn";

const authFieldClass =
  "h-11 rounded-xl border border-input bg-background shadow-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-12";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await forgotPassword.mutateAsync(values);
      setSubmitted(true);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = forgotPassword.isPending || form.formState.isSubmitting;

  return (
    <>
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm transition-colors lg:mb-6 lg:min-h-0"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
      <div className="mb-8">
        <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-xl">
          <KeyRound className="text-primary size-5" aria-hidden="true" />
        </div>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">Forgot your password?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your company email. If an account exists, we will send reset instructions.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="text-chart-2 size-9" aria-hidden="true" />
          <p className="text-center text-sm font-medium">
            If an account exists for that email, we sent reset instructions.
          </p>
          <p className="text-muted-foreground text-center text-xs">
            Check your inbox and follow the link to choose a new password.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

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
                        className={cn(authFieldClass, "pl-10")}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="mt-2 h-12 w-full rounded-xl shadow-lg shadow-primary/25"
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Send reset link
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
