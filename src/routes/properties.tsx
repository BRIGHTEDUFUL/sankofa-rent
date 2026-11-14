import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Card, Button } from "@/components/app/AppShell";
import { ConfirmDialog, FormDialog, TextField } from "@/components/app/FormDialog";
import { cediFromPesewas, pesewasFromCedi } from "@/lib/format";

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

export function Page() {
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Properties & units</h2>
          <p className="text-sm text-muted-foreground">
            {properties.length} properties · {unitCount} units
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add property
        </Button>
      </div>

      {properties.length === 0 && (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          No properties yet. Add your first property to get started.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => {
          const pct = p.units.length ? Math.round((p.occupied / p.units.length) * 100) : 0;
          const rentRoll = p.units.reduce((s, u) => s + u.rent, 0);
          return (
            <Card key={p._id}>
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs font-semibold text-muted-foreground">
                    {p.units.length} units
                  </span>
                  <button
                    onClick={() => setEditing(p)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                    title="Edit property"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRemoving(p)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                    title="Delete property"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {p.area}
                {p.region ? ` · ${p.region}` : ""}
              </p>
              <div className="mt-5 flex justify-between text-sm">
                <span className="text-muted-foreground">Occupancy</span>
                <span className="font-semibold">
                  {p.occupied}/{p.units.length} · {pct}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-primary"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Monthly rent roll</span>
                <span className="font-semibold">{cediFromPesewas(rentRoll)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.units.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => setEditingUnit({ property: p, unit: u })}
                    title={`${u.label} · ${u.status}`}
                    className={`h-7 min-w-7 rounded-md px-1.5 text-xs font-semibold ${u.status === "occupied" ? "bg-primary text-primary-foreground" : u.status === "maintenance" ? "bg-gold-soft text-gold" : "border-2 border-dashed border-border text-muted-foreground"}`}
                  >
                    {u.label}
                  </button>
                ))}
                <button
                  onClick={() => setUnitProperty(p)}
                  className="grid h-7 w-7 place-items-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:bg-muted"
                  title="Add unit"
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={editingUnit?.unit.status ?? "vacant"}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-ring"
          >
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
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
