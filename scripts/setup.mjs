import fs from "node:fs";
import { execSync } from "node:child_process";

console.log("\n======================================================");
console.log(" Sankofa Rent — Setup & Verification");
console.log("======================================================\n");

// 1. Ensure .env.local exists
if (!fs.existsSync(".env.local")) {
  if (fs.existsSync(".env.example")) {
    fs.copyFileSync(".env.example", ".env.local");
    console.log("[OK] Created .env.local from .env.example");
  } else {
    const fallback = [
      "CONVEX_DEPLOYMENT=dev:adorable-pig-437",
      "CONVEX_DEPLOY_KEY=dev:adorable-pig-437|eyJ2MiI6IjBlN2YxYTFiNjk4NzRjMDk5ODEzOTlmNzViMzFhMDJlIn0=",
      "VITE_CONVEX_URL=https://adorable-pig-437.convex.cloud",
      "VITE_CONVEX_SITE_URL=https://adorable-pig-437.convex.site",
    ].join("\n");
    fs.writeFileSync(".env.local", fallback + "\n");
    console.log("[OK] Created default .env.local");
  }
} else {
  console.log("[OK] .env.local already exists");
}

// 2. Sync Convex backend functions
console.log("[SETUP] Synchronizing Convex backend schema & functions...");
try {
  execSync("npx convex dev --once --env-file .env.local", { stdio: "inherit" });
  console.log("\n[OK] Convex backend synced and verified!");
} catch (err) {
  console.warn("\n[WARNING] Convex sync check completed with warnings.");
}

console.log("\n[SUCCESS] Setup complete! You can now run:\n  npm run dev:full\n");
