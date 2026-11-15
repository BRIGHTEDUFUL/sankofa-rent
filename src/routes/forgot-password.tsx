import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { AuthLayout, AuthNotice, Field, SubmitButton } from "@/components/auth/AuthLayout";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { friendlyError } from "@/lib/format";
import { validateResetEmail } from "@/lib/auth-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Sankofa Rent" },
      { name: "description", content: "Request a password reset for your Sankofa Rent account." },
      { property: "og:title", content: "Reset password — Sankofa Rent" },
      {
        property: "og:description",
        content: "Request a password reset for your Sankofa Rent account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const requestReset = useMutation(api.passwordReset.requestReset);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    email: string;
    alreadyPending: boolean;
    message: string;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const email = String(values.get("email") || "").trim();
    const note = String(values.get("note") || "").trim();

    const emailErr = validateResetEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setError("");
    setPending(true);
    try {
      const res = await requestReset({ email, note: note || undefined });
      setSubmitted({
        email,
        alreadyPending: res.alreadyPending,
        message: res.message,
      });
    } catch (err) {
      setError(friendlyError(err, "Could not submit reset request. Please try again."));
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title={submitted.alreadyPending ? "Request already pending" : "Request submitted"}
        subtitle={
          submitted.alreadyPending
            ? "An administrator has already been alerted to reset this password."
            : "Your password reset request has been forwarded to the system administrator."
        }
        footer={
          <Link
            to="/login"
            className="-my-2 inline-flex items-center gap-2 py-2 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-accent/40 p-4">
            {submitted.alreadyPending ? (
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            )}
            <div className="min-w-0 space-y-1 text-sm leading-relaxed">
              <p className="font-semibold text-foreground">
                Account: <span className="font-mono text-primary">{submitted.email}</span>
              </p>
              <p className="text-muted-foreground">{submitted.message}</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-4 text-xs leading-relaxed text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">What happens next?</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>An administrator will review your account and assign a temporary password.</li>
              <li>
                You will receive the temporary password from your administrator (via phone or in
                person).
              </li>
              <li>Sign in with that temporary password.</li>
              <li>You will immediately be prompted to create your own permanent password.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Return to sign in
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(null);
                setError("");
              }}
              className="text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Submit request for another account
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Request a password reset from your system administrator."
      footer={
        <Link
          to="/login"
          className="-my-2 inline-flex items-center gap-2 py-2 font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error && <AuthNotice error>{error}</AuthNotice>}

        <Field
          label="Account email address"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="you@example.com"
          hint="Enter the email associated with your account."
        />

        <Field
          label="Contact phone or note (optional)"
          name="note"
          type="text"
          placeholder="e.g. 0244123456 or 'Call me for verification'"
          hint="Helps the administrator verify your identity to give you the temporary password."
        />

        <div className="pt-2">
          <SubmitButton>{pending ? "Submitting request…" : "Request password reset"}</SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}
