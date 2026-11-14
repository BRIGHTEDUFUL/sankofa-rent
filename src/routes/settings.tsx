import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Building2,
  Bell,
  CreditCard,
  ShieldCheck,
  Palette,
  Upload,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Badge, Button, Card } from "@/components/app/AppShell";
import { ConfirmDialog, TextField } from "@/components/app/FormDialog";
import { Switch } from "@/components/ui/switch";
import { useBranding, isHexColor, isUsableAccent, DEFAULT_BRANDING } from "@/lib/branding";
import { friendlyError } from "@/lib/format";

const TAB_IDS = [
  "profile",
  "business",
  "branding",
  "notifications",
  "payments",
  "security",
] as const;
type Tab = (typeof TAB_IDS)[number];

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = typeof search["tab"] === "string" ? search["tab"] : undefined;
    return t && (TAB_IDS as readonly string[]).includes(t) ? { tab: t as Tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Settings — Sankofa Rent" },
      {
        name: "description",
        content: "Manage your profile, business, notifications, payments and team.",
      },
      { property: "og:title", content: "Settings — Sankofa Rent" },
      {
        property: "og:description",
        content: "Manage your profile, business, notifications, payments and team.",
      },
    ],
  }),
  component: Page,
});

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

// Curated accents — all clear 4.5:1 against white so button text stays readable.
const ACCENT_SWATCHES = [
  "#4E735A", // default brand green
  "#1F6F5C", // teal green
  "#2563EB", // blue
  "#7C3AED", // violet
  "#B45309", // amber/brown
  "#BE123C", // rose
  "#0E7490", // cyan
  "#334155", // slate
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  region: string;
  momoNumber: string;
  momoNetwork: string;
  bankName: string;
  bankAccount: string;
  rentDueDay: number;
  lateFeePercent: string;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
};

function fromProfile(p: Doc<"profiles">): FormState {
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phone: p.phone ?? "",
    businessName: p.businessName ?? "",
    region: p.region ?? "",
    momoNumber: p.momoNumber ?? "",
    momoNetwork: p.momoNetwork ?? "",
    bankName: p.bankName ?? "",
    bankAccount: p.bankAccount ?? "",
    rentDueDay: p.rentDueDay,
    lateFeePercent: p.lateFeePercent !== undefined ? String(p.lateFeePercent) : "",
    notifySms: p.notifySms,
    notifyEmail: p.notifyEmail,
    notifyWhatsapp: p.notifyWhatsapp,
  };
}

// Sticky at the bottom on mobile, plain flex row on sm+
function SaveBar({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile: sticky bar above safe area */}
      <div className="sm:hidden sticky bottom-0 mt-6 flex justify-end px-0 pt-3 pb-[calc(0.75rem+var(--sab))] bg-card/95 backdrop-blur border-t border-border">
        {children}
      </div>
      {/* Desktop: plain right-aligned row */}
      <div className="hidden sm:flex justify-end mt-6">{children}</div>
    </>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mb-5 text-sm text-muted-foreground">{desc}</p>
      {children}
    </Card>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="px-2 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-soft">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  tone,
  label,
  value,
  onClick,
  destructive,
  selected,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value?: string;
  onClick: () => void;
  destructive?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className={`pressable flex min-h-[52px] w-full items-center gap-3 px-4 text-left hover:bg-muted/40 ${selected ? "lg:bg-muted" : ""}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span
        className={`text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}
      >
        {label}
      </span>
      {value && <span className="ml-auto truncate text-sm text-muted-foreground">{value}</span>}
      <ChevronRight
        className={`h-5 w-5 shrink-0 text-muted-foreground/70 ${value ? "" : "ml-auto"}`}
      />
    </button>
  );
}

function NotificationRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function SettingsListNav({
  form,
  isAdmin,
  appName,
  detailTab,
  onSelect,
  onSignOut,
}: {
  form: FormState;
  isAdmin: boolean;
  appName: string;
  detailTab: Tab;
  onSelect: (tab: Tab) => void;
  onSignOut: () => void;
}) {
  return (
    <nav aria-label="Settings sections">
      <SettingsGroup title="Account">
        <SettingsRow
          icon={User}
          tone="bg-primary-soft text-primary"
          label="Profile"
          value={form.firstName ? `${form.firstName} ${form.lastName}`.trim() : undefined}
          onClick={() => onSelect("profile")}
          selected={detailTab === "profile"}
        />
        <SettingsRow
          icon={Building2}
          tone="bg-gold-soft text-gold"
          label="Business details"
          value={form.businessName || undefined}
          onClick={() => onSelect("business")}
          selected={detailTab === "business"}
        />
      </SettingsGroup>

      <SettingsGroup title="Preferences">
        <SettingsRow
          icon={Bell}
          tone="bg-ink text-ink-foreground"
          label="Notifications"
          onClick={() => onSelect("notifications")}
          selected={detailTab === "notifications"}
        />
        {isAdmin && (
          <SettingsRow
            icon={Palette}
            tone="bg-ink text-ink-foreground"
            label="Branding"
            onClick={() => onSelect("branding")}
            selected={detailTab === "branding"}
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Money">
        <SettingsRow
          icon={CreditCard}
          tone="bg-success-soft text-success"
          label="Payment methods"
          value={form.momoNumber || undefined}
          onClick={() => onSelect("payments")}
          selected={detailTab === "payments"}
        />
      </SettingsGroup>

      <SettingsGroup title="System">
        <SettingsRow
          icon={ShieldCheck}
          tone="bg-muted text-muted-foreground"
          label="Security"
          onClick={() => onSelect("security")}
          selected={detailTab === "security"}
        />
      </SettingsGroup>

      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-soft">
        <SettingsRow
          icon={LogOut}
          tone="bg-destructive-soft text-destructive"
          label="Sign out"
          onClick={onSignOut}
          destructive
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{appName} · v1.0</p>
    </nav>
  );
}

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.me, {});
  const updateProfile = useMutation(api.profiles.update);
  const branding = useBranding();
  const brandingData = useQuery(api.branding.get, {});
  const saveBranding = useMutation(api.branding.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const isAdmin = profile?.role === "admin";

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Branding editor state (admin only).
  const [brand, setBrand] = useState<{
    appName: string;
    tagline: string;
    accentColor: string;
  } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMessage, setBrandMessage] = useState("");
  const [brandError, setBrandError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !form) setForm(fromProfile(profile));
  }, [profile, form]);

  useEffect(() => {
    if (brandingData && !brand) {
      setBrand({
        appName: brandingData.appName,
        tagline: brandingData.tagline,
        accentColor: brandingData.accentColor,
      });
    }
  }, [brandingData, brand]);

  // Object URL for a logo picked but not yet saved.
  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  if (!profile || !form) {
    return <Card className="h-64 animate-pulse bg-muted/40" />;
  }

  // Non-admins never see the Branding tab (the server rejects the write too).
  const visibleTabs = tabs.filter((t) => t.id !== "branding" || isAdmin);
  const detailTab: Tab =
    search.tab && visibleTabs.some((t) => t.id === search.tab) ? search.tab : "profile";
  const showDetail = Boolean(search.tab); // mobile: list hidden when drilling in

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  async function save(extra?: Partial<FormState>) {
    if (!form) return;
    const next = { ...form, ...extra };
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateProfile({
        firstName: next.firstName,
        lastName: next.lastName,
        phone: next.phone,
        businessName: next.businessName,
        region: next.region,
        momoNumber: next.momoNumber,
        momoNetwork: next.momoNetwork
          ? (next.momoNetwork as "MTN" | "Telecel" | "AirtelTigo")
          : undefined,
        bankName: next.bankName,
        bankAccount: next.bankAccount,
        rentDueDay: next.rentDueDay,
        lateFeePercent: next.lateFeePercent.trim() ? Number(next.lateFeePercent) : undefined,
        notifySms: next.notifySms,
        notifyEmail: next.notifyEmail,
        notifyWhatsapp: next.notifyWhatsapp,
      });
      setForm(next);
      setMessage("Saved.");
    } catch (err) {
      setError(friendlyError(err, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  }

  const initials =
    `${form.firstName} ${form.lastName}`
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  async function saveBrandingChanges() {
    if (!brand) return;
    setBrandSaving(true);
    setBrandError("");
    setBrandMessage("");
    try {
      let logoArg: { logoId?: Id<"_storage"> | null } = {};
      if (logoRemoved) {
        logoArg = { logoId: null };
      } else if (logoFile) {
        // 1) get an upload URL, 2) POST the file, 3) hand the storage id over.
        const url = await generateUploadUrl({});
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        if (!res.ok) throw new Error("Upload failed — try a smaller image.");
        const { storageId } = (await res.json()) as { storageId: string };
        logoArg = { logoId: storageId as Id<"_storage"> };
      }
      await saveBranding({
        appName: brand.appName.trim(),
        tagline: brand.tagline.trim(),
        accentColor: brand.accentColor.trim(),
        ...logoArg,
      });
      setLogoFile(null);
      setLogoRemoved(false);
      setBrandMessage("Branding saved. It's live across the app already.");
    } catch (err) {
      setBrandError(friendlyError(err, "Could not save branding."));
    } finally {
      setBrandSaving(false);
    }
  }

  // Stage the shipped defaults (name/tagline/accent, no custom logo) in the
  // editor — the user still has to press Save to apply them.
  function resetBrandingForm() {
    setBrand({
      appName: DEFAULT_BRANDING.appName,
      tagline: DEFAULT_BRANDING.tagline,
      accentColor: DEFAULT_BRANDING.accentColor,
    });
    setLogoFile(null);
    setLogoRemoved(true);
    setBrandError("");
    setBrandMessage("Defaults staged — press Save branding to apply them.");
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Manage your account and how {branding.appName} works for you
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className={showDetail ? "hidden lg:block" : ""}>
          <SettingsListNav
            form={form}
            isAdmin={isAdmin}
            appName={branding.appName}
            detailTab={detailTab}
            onSelect={(t) => navigate({ to: "/settings", search: { tab: t }, replace: true })}
            onSignOut={() => setSignOutOpen(true)}
          />
        </div>
        <div className={`space-y-5 ${showDetail ? "" : "hidden lg:block"}`}>
          <button
            type="button"
            onClick={() => navigate({ to: "/settings", search: {}, replace: true })}
            className="mb-3 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-primary lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
            Settings
          </button>
          {/* Mobile tab chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1 lg:hidden">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  navigate({ to: "/settings", search: { tab: t.id as Tab }, replace: true })
                }
                className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition pressable ${
                  detailTab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {(message || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`border-l-2 py-2 pl-3 text-sm ${error ? "border-destructive text-destructive" : "border-primary text-muted-foreground"}`}
            >
              {error || message}
            </p>
          )}

          {detailTab === "profile" && (
            <Section title="Profile" desc="Your personal details">
              <div className="mb-6 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-semibold text-ink-foreground">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium">Avatar</p>
                  <p className="text-xs text-muted-foreground">Generated from your name</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="024 123 4567"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "business" && (
            <Section title="Business details" desc="Shown on invoices and receipts">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Business name"
                  name="businessName"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="Mensah Properties"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Region"
                  name="region"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Greater Accra"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Currency"
                  name="currency"
                  value="GH₵ Ghana cedi"
                  readOnly
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Rent due day"
                  name="rentDueDay"
                  type="number"
                  min={1}
                  max={31}
                  value={form.rentDueDay}
                  onChange={(e) => set("rentDueDay", Number(e.target.value))}
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Late fee (%)"
                  name="lateFeePercent"
                  inputMode="decimal"
                  value={form.lateFeePercent}
                  onChange={(e) => set("lateFeePercent", e.target.value)}
                  placeholder="5"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "branding" && isAdmin && brand && (
            <Section
              title="Branding"
              desc="The name, logo and colour shown across the app — including the login page and browser tab"
            >
              {/* Live preview of the header + login identity */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center gap-3 bg-background px-4 py-3">
                  {(previewUrl ?? (logoRemoved ? null : branding.logoUrl)) ? (
                    <img
                      src={(previewUrl ?? (logoRemoved ? null : branding.logoUrl)) as string}
                      alt=""
                      className="h-9 w-9 rounded-lg object-contain"
                      width={36}
                      height={36}
                    />
                  ) : (
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg text-lg font-semibold text-white"
                      style={{ backgroundColor: brand.accentColor }}
                      aria-hidden
                    >
                      {brand.appName.slice(0, 1).toUpperCase() || "A"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {brand.appName || "Untitled app"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{brand.tagline}</p>
                  </div>
                  <span
                    className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: brand.accentColor }}
                  >
                    Preview
                  </span>
                </div>
                <div className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                  Browser tab: {brand.appName || "Untitled"} — Settings
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="App name"
                  name="appName"
                  value={brand.appName}
                  maxLength={60}
                  onChange={(e) => setBrand({ ...brand, appName: e.target.value })}
                  placeholder="Sankofa Rent"
                  hint="Up to 60 characters. Shown in the header, login page and tab title."
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Tagline"
                  name="tagline"
                  value={brand.tagline}
                  maxLength={120}
                  onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                  placeholder="Your property. Your peace of mind."
                  hint="Up to 120 characters. Shown under the app name on sign-in pages."
                  className="h-11 sm:h-9"
                />
              </div>

              {/* Accent colour */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Accent colour</p>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Use accent colour ${c}`}
                      aria-pressed={brand.accentColor.toLowerCase() === c.toLowerCase()}
                      onClick={() => setBrand({ ...brand, accentColor: c })}
                      className={`h-9 w-9 rounded-full transition ${brand.accentColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted">
                    Custom
                    <input
                      type="color"
                      value={isHexColor(brand.accentColor) ? brand.accentColor : "#4E735A"}
                      onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                      aria-label="Pick a custom accent colour"
                    />
                  </label>
                </div>
                {!isUsableAccent(brand.accentColor) && (
                  <p className="mt-2 text-xs text-destructive" role="alert">
                    Too light — white text on this colour wouldn't be readable. Pick a darker shade.
                  </p>
                )}
              </div>

              {/* Logo upload */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Logo</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {branding.logoUrl && !logoRemoved ? "Replace logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload logo file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setBrandError("");
                        if (!f) return;
                        if (!f.type.startsWith("image/")) {
                          setBrandError("The logo file must be an image.");
                          return;
                        }
                        if (f.size > 1024 * 1024) {
                          setBrandError("Logo must be 1 MB or smaller.");
                          return;
                        }
                        setLogoFile(f);
                        setLogoRemoved(false);
                      }}
                    />
                  </label>
                  {((branding.logoUrl && !logoRemoved) || logoFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoRemoved(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Remove logo
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    PNG, SVG or JPG · max 1 MB · falls back to the default mark
                  </span>
                </div>
              </div>

              {(brandMessage || brandError) && (
                <p
                  role={brandError ? "alert" : "status"}
                  className={`mt-4 border-l-2 py-2 pl-3 text-sm ${brandError ? "border-destructive text-destructive" : "border-primary text-muted-foreground"}`}
                >
                  {brandError || brandMessage}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={resetBrandingForm}
                  disabled={brandSaving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  Reset to defaults
                </Button>
                <Button
                  onClick={() => saveBrandingChanges()}
                  disabled={
                    brandSaving ||
                    !brand.appName.trim() ||
                    !brand.tagline.trim() ||
                    !isUsableAccent(brand.accentColor)
                  }
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {brandSaving ? "Saving…" : "Save branding"}
                </Button>
              </div>
            </Section>
          )}

          {detailTab === "notifications" && (
            <Section title="Notifications" desc="Choose what you and your tenants are told about">
              <NotificationRow
                label="Rent reminders to tenants"
                hint="SMS before rent is due"
                checked={form.notifySms}
                onCheckedChange={(v) => set("notifySms", v)}
              />
              <NotificationRow
                label="Payment received"
                hint="Get a message when money comes in"
                checked={form.notifyEmail}
                onCheckedChange={(v) => set("notifyEmail", v)}
              />
              <NotificationRow
                label="WhatsApp updates"
                hint="Send notices over WhatsApp"
                checked={form.notifyWhatsapp}
                onCheckedChange={(v) => set("notifyWhatsapp", v)}
              />
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "payments" && (
            <Section title="Payment methods" desc="Where your tenants pay rent">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="MoMo number"
                  name="momoNumber"
                  value={form.momoNumber}
                  onChange={(e) => set("momoNumber", e.target.value)}
                  placeholder="024 123 4567"
                  className="h-11 sm:h-9"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">MoMo network</label>
                  <select
                    name="momoNetwork"
                    value={form.momoNetwork}
                    onChange={(e) => set("momoNetwork", e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base focus:ring-1 focus:ring-ring sm:h-9 sm:text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="MTN">MTN</option>
                    <option value="Telecel">Telecel</option>
                    <option value="AirtelTigo">AirtelTigo</option>
                  </select>
                </div>
                <TextField
                  label="Bank name"
                  name="bankName"
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  placeholder="GCB Bank"
                  className="h-11 sm:h-9"
                />
                <TextField
                  label="Bank account"
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={(e) => set("bankAccount", e.target.value)}
                  placeholder="•••• 4410"
                  className="h-11 sm:h-9"
                />
              </div>
              <SaveBar>
                <Button
                  onClick={() => save()}
                  disabled={saving}
                  className="h-12 w-full justify-center sm:h-auto sm:w-auto"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </SaveBar>
            </Section>
          )}

          {detailTab === "security" && (
            <Section title="Account" desc="Your sign-in details">
              <div className="divide-y divide-border/70">
                <div className="flex min-h-[52px] items-center justify-between px-1">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge tone="green">{profile.plan}</Badge>
                </div>
                <div className="flex min-h-[52px] items-center justify-between px-1">
                  <span className="text-sm font-medium">Role</span>
                  <Badge tone={profile.role === "admin" ? "gold" : "gray"}>
                    {profile.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </div>
                <div className="flex min-h-[52px] items-center justify-between px-1">
                  <span className="text-sm font-medium">Currency</span>
                  <span className="text-sm text-muted-foreground">{profile.currency}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Password changes and account deletion are not available on this deployment yet.
              </p>
            </Section>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        message="You'll need your password to sign back in."
        confirming="Sign out"
        onConfirm={async () => {
          await signOut();
          window.location.assign("/login");
        }}
      />
    </div>
  );
}
