import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    region: v.optional(v.string()),
    currency: v.literal("GHS"),
    momoNumber: v.optional(v.string()),
    momoNetwork: v.optional(v.union(v.literal("MTN"), v.literal("Telecel"), v.literal("AirtelTigo"))),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    rentDueDay: v.number(),            // e.g. 5
    lateFeePercent: v.optional(v.number()),
    notifySms: v.boolean(),
    notifyEmail: v.boolean(),
    notifyWhatsapp: v.boolean(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("business")),
  }).index("by_user", ["userId"]),

  properties: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    area: v.string(),                  // "Adenta, Accra"
    region: v.optional(v.string()),
    ghanaPostGps: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  }).index("by_landlord", ["landlordId"]),

  units: defineTable({
    landlordId: v.id("users"),
    propertyId: v.id("properties"),
    label: v.string(),                 // "A3", "2B"
    bedrooms: v.optional(v.number()),
    rent: v.number(),                  // pesewas / month
    status: v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance")),
  }).index("by_property", ["propertyId"]).index("by_landlord", ["landlordId"]),

  tenants: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    ghanaCardNo: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
    since: v.number(),
    archived: v.boolean(),
  }).index("by_landlord", ["landlordId"]).index("by_unit", ["unitId"]),

  leases: defineTable({
    landlordId: v.id("users"),
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
    start: v.number(),
    end: v.number(),
    rent: v.number(),                  // pesewas / month
    advanceMonths: v.number(),         // validate the applicable legal limit for the tenancy before launch
    deposit: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("expiring"), v.literal("ended")),
    documentId: v.optional(v.id("_storage")),
  }).index("by_landlord", ["landlordId"]).index("by_tenant", ["tenantId"]).index("by_end", ["landlordId", "end"]),

  invoices: defineTable({
    landlordId: v.id("users"),
    leaseId: v.id("leases"),
    tenantId: v.id("tenants"),
    number: v.string(),                // "INV-1042"
    period: v.string(),                // "2026-11"
    dueDate: v.number(),
    amount: v.number(),
    paid: v.number(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("partial"), v.literal("paid"), v.literal("overdue")),
  }).index("by_landlord", ["landlordId"]).index("by_status", ["landlordId", "status"]).index("by_tenant", ["tenantId"]),

  payments: defineTable({
    landlordId: v.id("users"),
    tenantId: v.id("tenants"),
    invoiceId: v.optional(v.id("invoices")),
    receiptNo: v.string(),             // "RCP-0881"
    method: v.union(v.literal("mtn_momo"), v.literal("telecel_cash"), v.literal("airteltigo_money"), v.literal("bank"), v.literal("cash")),
    reference: v.optional(v.string()),
    amount: v.number(),
    paidAt: v.number(),
  }).index("by_landlord", ["landlordId", "paidAt"]).index("by_tenant", ["tenantId"]),

  maintenance: defineTable({
    landlordId: v.id("users"),
    unitId: v.optional(v.id("units")),
    propertyId: v.id("properties"),
    title: v.string(),
    description: v.optional(v.string()),
    reportedBy: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")),
    cost: v.optional(v.number()),
    photoIds: v.optional(v.array(v.id("_storage"))),
  }).index("by_landlord", ["landlordId"]).index("by_status", ["landlordId", "status"]),

  announcements: defineTable({
    landlordId: v.id("users"),
    title: v.string(),
    body: v.string(),
    propertyId: v.optional(v.id("properties")), // undefined = all properties
    pinned: v.boolean(),
    channels: v.array(v.union(v.literal("sms"), v.literal("email"), v.literal("whatsapp"))),
  }).index("by_landlord", ["landlordId"]),

  counters: defineTable({ landlordId: v.id("users"), name: v.string(), value: v.number() })
    .index("by_name", ["landlordId", "name"]),
});
