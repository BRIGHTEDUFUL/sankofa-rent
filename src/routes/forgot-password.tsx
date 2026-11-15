import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthLayout, AuthNotice } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Sankofa Rent" },
      { name: "description", content: "Reset your Sankofa Rent password." },
      { property: "og:title", content: "Reset password — Sankofa Rent" },
      { property: "og:description", content: "Reset your Sankofa Rent password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AuthLayout
      title="Password reset"
      subtitle="Resetting passwords by email is not enabled on this deployment yet."
      footer={
        <Link
          to="/login"
          className="-my-2 inline-flex items-center gap-2 py-2 font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <AuthNotice>
        For security, password reset emails require an email provider to be configured on the
        backend. Until then, contact support to regain access to your account.
      </AuthNotice>
      <div className="mt-6">
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
