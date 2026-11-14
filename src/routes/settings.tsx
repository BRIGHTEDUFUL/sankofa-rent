import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Building,
  Bell,
  CreditCard,
  ShieldCheck,
  Users,
  Palette,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Badge, Button, Card } from "@/components/app/AppShell";
import { TextField } from "@/components/app/FormDialog";
import { useBranding, isHexColor, isUsableAccent, DEFAULT_BRANDING } from "@/lib/branding";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/settings")({
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
  { id: "business", label: "Business", icon: Building },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;
type Tab = (typeof tabs)[number]["id"];

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

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0 [&>*:first-child]:min-w-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function Page() {
  const profile = useQuery(api.profiles.me, {});
  const updateProfile = useMutation(api.profiles.update);
  const branding = useBranding();
  const brandingData = useQuery(api.branding.get, {});
  const saveBranding = useMutation(api.branding.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const isAdmin = profile?.role === "admin";

  const [tab, setTab] = useState<Tab>("profile");
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
  const activeTab: Tab = visibleTabs.some((t) => t.id === tab) ? tab : "profile";

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
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and how {branding.appName} works for you
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit !p-2">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:flex-col">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${activeTab === t.id ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </Card>
        <div className="space-y-5">
          {(message || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`border-l-2 py-2 pl-3 text-sm ${error ? "border-destructive text-destructive" : "border-primary text-muted-foreground"}`}
            >
              {error || message}
            </p>
          )}

          {activeTab === "profile" && (
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
                />
                <TextField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="024 123 4567"
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => save()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Section>
          )}

          {activeTab === "business" && (
            <Section title="Business details" desc="Shown on invoices and receipts">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Business name"
                  name="businessName"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="Mensah Properties"
                />
                <TextField
                  label="Region"
                  name="region"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Greater Accra"
                />
                <TextField label="Currency" name="currency" value="GH₵ Ghana cedi" readOnly />
                <TextField
                  label="Rent due day"
                  name="rentDueDay"
                  type="number"
                  min={1}
                  max={31}
                  value={form.rentDueDay}
                  onChange={(e) => set("rentDueDay", Number(e.target.value))}
                />
                <TextField
                  label="Late fee (%)"
                  name="lateFeePercent"
                  inputMode="decimal"
                  value={form.lateFeePercent}
                  onChange={(e) => set("lateFeePercent", e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => save()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Section>
          )}

          {activeTab === "branding" && isAdmin && brand && (
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
                />
                <TextField
                  label="Tagline"
                  name="tagline"
                  value={brand.tagline}
                  maxLength={120}
                  onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                  placeholder="Your property. Your peace of mind."
                  hint="Up to 120 characters. Shown under the app name on sign-in pages."
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

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button variant="ghost" onClick={resetBrandingForm} disabled={brandSaving}>
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
                >
                  {brandSaving ? "Saving…" : "Save branding"}
                </Button>
              </div>
            </Section>
          )}

          {activeTab === "notifications" && (
            <Section title="Notifications" desc="Choose what you and your tenants are told about">
              <Toggle
                label="Rent reminders to tenants"
                hint="SMS before rent is due"
                on={form.notifySms}
                onChange={(v) => set("notifySms", v)}
              />
              <Toggle
                label="Payment received"
                hint="Get a message when money comes in"
                on={form.notifyEmail}
                onChange={(v) => set("notifyEmail", v)}
              />
              <Toggle
                label="WhatsApp updates"
                hint="Send notices over WhatsApp"
                on={form.notifyWhatsapp}
                onChange={(v) => set("notifyWhatsapp", v)}
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={() => save()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Section>
          )}

          {activeTab === "payments" && (
            <Section title="Payment methods" desc="Where your tenants pay rent">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="MoMo number"
                  name="momoNumber"
                  value={form.momoNumber}
                  onChange={(e) => set("momoNumber", e.target.value)}
                  placeholder="024 123 4567"
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">MoMo network</label>
                  <select
                    name="momoNetwork"
                    value={form.momoNetwork}
                    onChange={(e) => set("momoNetwork", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring"
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
                />
                <TextField
                  label="Bank account"
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={(e) => set("bankAccount", e.target.value)}
                  placeholder="•••• 4410"
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => save()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Section>
          )}

          {activeTab === "security" && (
            <>
              <Section title="Account" desc="Your sign-in details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Plan</span>
                    <div>
                      <Badge tone="green">{profile.plan}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Role</span>
                    <div>
                      <Badge tone={profile.role === "admin" ? "gold" : "gray"}>
                        {profile.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Currency</span>
                    <div className="text-sm text-muted-foreground">{profile.currency}</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Password changes and account deletion are not available on this deployment yet.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
