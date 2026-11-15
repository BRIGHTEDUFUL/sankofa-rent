/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as branding from "../branding.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as leases from "../leases.js";
import type * as lib from "../lib.js";
import type * as maintenance from "../maintenance.js";
import type * as migration from "../migration.js";
import type * as passwordReset from "../passwordReset.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as properties from "../properties.js";
import type * as tenants from "../tenants.js";

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  announcements: typeof announcements;
  auth: typeof auth;
  branding: typeof branding;
  crons: typeof crons;
  dashboard: typeof dashboard;
  files: typeof files;
  http: typeof http;
  invoices: typeof invoices;
  leases: typeof leases;
  lib: typeof lib;
  maintenance: typeof maintenance;
  migration: typeof migration;
  passwordReset: typeof passwordReset;
  payments: typeof payments;
  profiles: typeof profiles;
  properties: typeof properties;
  tenants: typeof tenants;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;

export declare const components: {};
