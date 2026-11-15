import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Card, Button } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, SelectField, TextField } from "@/components/app/FormDialog";
import { cediFromPesewas, pesewasFromCedi, plural } from "@/lib/format";

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: "Properties & units — Sankofa Rent" },
      { name: "description", content: "Manage your properties and rental units across Ghana." },
      { property: "og:title", content: "Properties & units — Sankofa Rent" },
      {
        property: "og:description",
        content: "Manage your properties and rental units across Ghana.",
      },
    ],
  }),
  component: Page,
});

type UnitRow = Doc<"units">;
type PropertyRow = Doc<"properties"> & { units: UnitRow[]; occupied: number };

function Page() {
  const properties = useQuery(api.properties.list, {});
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const removeProperty = useMutation(api.properties.remove);
  const addUnit = useMutation(api.properties.addUnit);
  const updateUnit = useMutation(api.properties.updateUnit);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);
  const [unitProperty, setUnitProperty] = useState<PropertyRow | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ property: PropertyRow; unit: UnitRow } | null>(
    null,
  );
  const [removing, setRemoving] = useState<PropertyRow | null>(null);

  if (!properties) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-72 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  const unitCount = properties.reduce((s, p) => s + p.units.length, 0);

  async function submitProperty(values: FormData) {
    const name = String(values.get("name") || "").trim();
    const area = String(values.get("area") || "").trim();
    const region = String(values.get("region") || "").trim();
    const ghanaPostGps = String(values.get("ghanaPostGps") || "").trim();
    if (!name || !area) throw new Error("Name and area are required.");
    await createProperty({
      name,
      area,
      region: region || undefined,
      ghanaPostGps: ghanaPostGps || undefined,
    });
    setCreateOpen(false);
  }

  async function submitEdit(values: FormData) {
    if (!editing) return;
    const name = String(values.get("name") || "").trim();
    const area = String(values.get("area") || "").trim();
    const region = String(values.get("region") || "").trim();
    const ghanaPostGps = String(values.get("ghanaPostGps") || "").trim();
    if (!name || !area) throw new Error("Name and area are required.");
    await updateProperty({
      id: editing._id,
      name,
      area,
      region: region || undefined,
      ghanaPostGps: ghanaPostGps || undefined,
    });
    setEditing(null);
  }

  async function submitUnit(values: FormData) {
    if (!unitProperty) return;
    const label = String(values.get("label") || "").trim();
    const rent = pesewasFromCedi(String(values.get("rent") || ""));
    const bedroomsRaw = String(values.get("bedrooms") || "").trim();
    if (!label) throw new Error("Unit label is required.");
    if (Number.isNaN(rent)) throw new Error("Enter a valid monthly rent.");
    await addUnit({
      propertyId: unitProperty._id,
      label,
      rent,
      bedrooms: bedroomsRaw ? Number(bedroomsRaw) : undefined,
    });
    setUnitProperty(null);
  }

  async function submitUnitEdit(values: FormData) {
    if (!editingUnit) return;
    const label = String(values.get("label") || "").trim();
    const rent = pesewasFromCedi(String(values.get("rent") || ""));
    const bedroomsRaw = String(values.get("bedrooms") || "").trim();
    const status = String(values.get("status") || "vacant");
    if (!label) throw new Error("Unit label is required.");
    if (Number.isNaN(rent)) throw new Error("Enter a valid monthly rent.");
    await updateUnit({
      id: editingUnit.unit._id,
      label,
      rent,
      bedrooms: bedroomsRaw ? Number(bedroomsRaw) : undefined,
      status: status as "vacant" | "occupied" | "maintenance",
    });
    setEditingUnit(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Properties & units</h2>
          <p className="text-sm text-muted-foreground">
            {plural(properties.length, "property")} · {plural(unitCount, "unit")}
          </p>
        </div>
        <Button
          className="h-12 w-full justify-center sm:h-auto sm:w-auto sm:justify-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      </div>

      {properties.length === 0 && (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="font-semibold">No properties yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first property to get started.
          </p>
        </Card>
      )}

      <div className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => {
          const pct = p.units.length ? Math.round((p.occupied / p.units.length) * 100) : 0;
          const rentRoll = p.units.reduce((s, u) => s + u.rent, 0);
          return (
            <Card key={p._id}>
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="mr-2 text-xs font-semibold text-muted-foreground">
                    {p.units.length} {p.units.length === 1 ? "unit" : "units"}
                  </span>
                  <button
                    onClick={() => setEditing(p)}
                    className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground pressable sm:h-8 sm:w-8"
                    title="Edit property"
                    aria-label="Edit property"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRemoving(p)}
                    className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive pressable sm:h-8 sm:w-8"
                    title="Delete property"
                    aria-label="Delete property"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {p.area}
                  {p.region ? ` · ${p.region}` : ""}
                </span>
              </p>
              <div className="mt-5 flex justify-between text-sm">
                <span className="text-muted-foreground">Occupancy</span>
                <span className="font-semibold tabular-nums">
                  {p.occupied}/{p.units.length} · {pct}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border/60 pt-4">
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  Monthly rent roll
                </span>
                <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
                  {cediFromPesewas(rentRoll)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.units.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => setEditingUnit({ property: p, unit: u })}
                    title={`${u.label} · ${u.status}`}
                    aria-label={`${u.label} – ${u.status}`}
                    className={`h-11 min-w-[2.75rem] rounded-md px-2 text-xs font-semibold transition-colors pressable sm:h-8 sm:min-w-[2rem] sm:px-1.5 ${u.status === "occupied" ? "bg-primary text-primary-foreground" : u.status === "maintenance" ? "bg-gold-soft text-gold" : "border-2 border-dashed border-border text-muted-foreground hover:border-muted-foreground/50"}`}
                  >
                    {u.label}
                  </button>
                ))}
                <button
                  onClick={() => setUnitProperty(p)}
                  className="grid h-11 w-11 place-items-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/50 pressable sm:h-8 sm:w-8"
                  title="Add unit"
                  aria-label="Add unit"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add property"
        onSubmit={submitProperty}
        submitLabel="Add property"
      >
        <TextField label="Property name" name="name" required placeholder="Adenta Court" />
        <TextField label="Area" name="area" required placeholder="Adenta, Accra" />
        <TextField label="Region" name="region" placeholder="Greater Accra" />
        <TextField label="GhanaPost GPS" name="ghanaPostGps" placeholder="GA-183-8164" />
      </FormDialog>

      <FormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit property"
        onSubmit={submitEdit}
        submitLabel="Save changes"
      >
        <TextField
          label="Property name"
          name="name"
          required
          defaultValue={editing?.name}
          placeholder="Adenta Court"
        />
        <TextField
          label="Area"
          name="area"
          required
          defaultValue={editing?.area}
          placeholder="Adenta, Accra"
        />
        <TextField
          label="Region"
          name="region"
          defaultValue={editing?.region ?? ""}
          placeholder="Greater Accra"
        />
        <TextField
          label="GhanaPost GPS"
          name="ghanaPostGps"
          defaultValue={editing?.ghanaPostGps ?? ""}
          placeholder="GA-183-8164"
        />
      </FormDialog>

      <FormDialog
        open={!!unitProperty}
        onOpenChange={(o) => !o && setUnitProperty(null)}
        title={`Add unit · ${unitProperty?.name ?? ""}`}
        onSubmit={submitUnit}
        submitLabel="Add unit"
      >
        <TextField label="Unit label" name="label" required placeholder="A3" />
        <TextField label="Bedrooms" name="bedrooms" type="number" min={0} placeholder="2" />
        <TextField
          label="Monthly rent (GH₵)"
          name="rent"
          required
          inputMode="decimal"
          placeholder="1,600"
        />
      </FormDialog>

      <FormDialog
        open={!!editingUnit}
        onOpenChange={(o) => !o && setEditingUnit(null)}
        title={`Edit unit · ${editingUnit?.unit.label ?? ""}`}
        onSubmit={submitUnitEdit}
        submitLabel="Save changes"
      >
        <TextField
          label="Unit label"
          name="label"
          required
          defaultValue={editingUnit?.unit.label}
        />
        <TextField
          label="Bedrooms"
          name="bedrooms"
          type="number"
          min={0}
          defaultValue={editingUnit?.unit.bedrooms ?? ""}
        />
        <TextField
          label="Monthly rent (GH₵)"
          name="rent"
          required
          inputMode="decimal"
          defaultValue={editingUnit ? String(editingUnit.unit.rent / 100) : ""}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={editingUnit?.unit.status ?? "vacant"}
          options={[
            { value: "vacant", label: "Vacant" },
            { value: "occupied", label: "Occupied" },
            { value: "maintenance", label: "Maintenance" },
          ]}
        />
      </FormDialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Delete property"
        message={`Delete ${removing?.name ?? "this property"} and its vacant units? This cannot be undone.`}
        confirming="Delete"
        onConfirm={async () => {
          if (removing) {
            await removeProperty({ id: removing._id });
            setRemoving(null);
          }
        }}
      />
    </div>
  );
}
