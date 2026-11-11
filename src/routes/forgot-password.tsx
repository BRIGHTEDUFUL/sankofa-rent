import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout, Field, SubmitButton } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Nyumba Rent" }, { name: "description", content: "Reset your Nyumba Rent password." }, { property: "og:title", content: "Reset password — Nyumba Rent" }, { property: "og:description", content: "Reset your Nyumba Rent password." }] }),
  component: Page,
});

function Page() {
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link." footer={<Link to="/login" className="font-semibold text-primary">← Back to sign in</Link>}>
      {sent ? (
        <div className="rounded-2xl bg-primary-soft p-5 text-sm"><MailCheck className="mb-2 h-6 w-6 text-primary" />Check your inbox — if an account exists, a reset link is on its way.</div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <Field label="Email" type="email" placeholder="kofi@example.com" />
          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
