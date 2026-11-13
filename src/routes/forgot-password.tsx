import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AuthLayout, AuthNotice, Field, SubmitButton } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { validatePassword, validateResetCode } from "@/lib/auth-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Nyumba Rent" }, { name: "description", content: "Reset your Nyumba Rent password." }, { property: "og:title", content: "Reset password — Nyumba Rent" }, { property: "og:description", content: "Reset your Nyumba Rent password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

function Page() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string>();
  return (
    <AuthLayout title={step === "request" ? "Forgot your password?" : "Set a new password"} subtitle={step === "request" ? "A fresh start begins with your email address." : "Enter your reset code and choose a new password."} footer={<Link to="/login" className="inline-flex items-center gap-2 font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>}>
      <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground"><span className={step === "request" ? "font-semibold text-primary" : ""}>01 · Email address</span><span className="h-px flex-1 bg-border" /><span className={step === "verify" ? "font-semibold text-primary" : ""}>02 · New password</span></div>
      {step === "request" ? (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setNotice("Email delivery isn’t connected yet. No reset code was sent."); }}>
          <Field label="Email address" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setNotice(""); }} placeholder="you@example.com" />
          {notice && <AuthNotice>{notice}</AuthNotice>}
          <SubmitButton>Send reset code</SubmitButton>
          <Button type="button" variant="link" className="h-auto w-full whitespace-normal" onClick={() => { setStep("verify"); setNotice(""); }}>I already have a code</Button>
        </form>
      ) : (
        <form className="space-y-4" onChange={() => { setError(undefined); setNotice(""); }} onSubmit={(e) => {
          e.preventDefault();
          const values = new FormData(e.currentTarget);
          const problem = validateResetCode(String(values.get("code") || "")) || validatePassword(String(values.get("newPassword") || ""), String(values.get("confirmPassword") || ""));
          setError(problem);
          setNotice(problem ? "" : "Password reset isn’t connected yet. Your password hasn’t changed.");
        }}>
          <KeyRound className="mb-2 h-6 w-6 text-primary" />
          <Field label="Email address" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Field label="Reset code" name="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="8-digit code" />
          <Field label="New password" name="newPassword" type="password" required autoComplete="new-password" placeholder="Create a new password" hint="Use at least 8 characters." />
          <Field label="Confirm new password" name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Re-enter your password" />
          {error && <AuthNotice error>{error}</AuthNotice>}
          {notice && <AuthNotice>{notice}</AuthNotice>}
          <SubmitButton>Reset password</SubmitButton>
          <Button type="button" variant="link" className="h-auto w-full" onClick={() => { setStep("request"); setError(undefined); setNotice(""); }}>Request another code</Button>
        </form>
      )}
    </AuthLayout>
  );
}
