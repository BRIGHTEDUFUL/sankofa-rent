import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Megaphone, Pin, Search, Building2, Bell, ShieldCheck, ArrowLeft } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useBranding } from "@/lib/branding";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "Tenant Notice Board — Sankofa Rent" },
      {
        name: "description",
        content: "Official notices and announcements for tenants. Built directly in-app.",
      },
      { property: "og:title", content: "Tenant Notice Board — Sankofa Rent" },
      {
        property: "og:description",
        content: "Official notices and announcements for tenants. Built directly in-app.",
      },
    ],
  }),
  component: TenantNoticeBoardPage,
});

function TenantNoticeBoardPage() {
  const { branding } = useBranding();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const properties = useQuery(api.announcements.publicProperties, {});
  const notices = useQuery(api.announcements.publicList, {
    propertyId: selectedPropertyId === "all" ? undefined : (selectedPropertyId as Id<"properties">),
  });

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    if (!searchQuery.trim()) return notices;
    const q = searchQuery.toLowerCase();
    return notices.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.propertyName.toLowerCase().includes(q),
    );
  }, [notices, searchQuery]);

  const pinnedNotices = useMemo(() => filteredNotices.filter((n) => n.pinned), [filteredNotices]);
  const regularNotices = useMemo(() => filteredNotices.filter((n) => !n.pinned), [filteredNotices]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-colors">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  {branding.brandName || "Sankofa Rent"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="h-3 w-3" /> Official Notices
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Tenant Notice Board & Updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-muted pressable"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Landlord Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-border/60 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Bell className="h-3.5 w-3.5 animate-pulse" />
            In-App Notice Board
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tenant Notices & Announcements
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Stay informed on scheduled maintenance, utility works, payment deadlines, and property
            updates. All notices are published directly inside the app.
          </p>

          {/* Search & Property Filter */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices by keyword or property..."
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Property Pills Filter */}
          {properties && properties.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPropertyId("all")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition pressable ${
                  selectedPropertyId === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All Properties
              </button>
              {properties.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedPropertyId(p._id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition pressable ${
                    selectedPropertyId === p._id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Building2 className="h-3 w-3 opacity-70" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Loading skeleton */}
        {!notices && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border/70 bg-card p-5"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {notices && filteredNotices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <Megaphone className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No notices found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? `No notices matched "${searchQuery}". Try a different search term or select "All Properties".`
                : "There are currently no active announcements for this property. Check back later."}
            </p>
          </div>
        )}

        {/* Pinned / Urgent Notices */}
        {pinnedNotices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Pin className="h-3.5 w-3.5 fill-amber-500" />
              <span>Pinned & Urgent Notices</span>
            </div>
            {pinnedNotices.map((notice) => (
              <div
                key={notice._id}
                className="rounded-2xl border-2 border-amber-500/40 bg-card p-5 shadow-sm transition hover:border-amber-500/70"
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Pin className="h-3 w-3 fill-amber-500" /> Important
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {notice.propertyName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notice._creationTime)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base sm:text-lg font-bold text-foreground">
                      {notice.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {notice.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Notices */}
        {regularNotices.length > 0 && (
          <div className="space-y-3">
            {pinnedNotices.length > 0 && (
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">
                All Property Updates
              </div>
            )}
            {regularNotices.map((notice) => (
              <div
                key={notice._id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:border-border"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {notice.propertyName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notice._creationTime)}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">{notice.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {notice.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-background/90 px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
        <p className="font-medium text-foreground">
          {branding.brandName || "Sankofa Rent"} Notice Board
        </p>
        <p className="mt-1">
          Direct in-app communication between property administration and tenants. No external SMS
          or WhatsApp gateways required.
        </p>
      </footer>
    </div>
  );
}
