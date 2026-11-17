import fs from "node:fs";
import { spawn } from "node:child_process";

// Ensure .env.local exists before starting
if (!fs.existsSync(".env.local")) {
  if (fs.existsSync(".env.example")) {
    fs.copyFileSync(".env.example", ".env.local");
    console.log("[SETUP] Created .env.local from .env.example");
  }
}

console.log("\n======================================================");
console.log(" Sankofa Rent — Starting Full Stack (Convex + Vite)");
console.log(" App URL: http://localhost:3000");
console.log(" Press Ctrl+C at any time to stop both servers.");
console.log("======================================================\n");

const convexProcess = spawn("npx", ["convex", "dev", "--env-file", ".env.local"], {
  stdio: "inherit",
  shell: true,
});

const viteProcess = spawn("npx", ["vite", "dev"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  try {
    if (process.platform === "win32") {
      if (convexProcess.pid) spawn("taskkill", ["/pid", convexProcess.pid.toString(), "/f", "/t"]);
      if (viteProcess.pid) spawn("taskkill", ["/pid", viteProcess.pid.toString(), "/f", "/t"]);
    } else {
      convexProcess.kill("SIGTERM");
      viteProcess.kill("SIGTERM");
    }
  } catch {
    // ignore cleanup errors on exit
  }
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

convexProcess.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`[Convex] process exited with code ${code}`);
  }
});

viteProcess.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`[Vite] process exited with code ${code}`);
  }
});
