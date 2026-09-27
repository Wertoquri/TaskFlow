import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiEntry = path.join(root, "backend", "server.js");
const viteEntry = path.join(root, "node_modules", "vite", "bin", "vite.js");
const localDbConfigPath = path.join(root, ".taskflow-local-db.json");

if (!existsSync(path.join(root, ".env"))) {
  console.error(
    "Missing .env. Copy .env.example, configure DATABASE_URL and JWT_SECRET, then run the migration.",
  );
  process.exit(1);
}
if (
  !existsSync(path.join(root, "backend", "node_modules")) ||
  !existsSync(viteEntry)
) {
  console.error(
    "Missing dependencies. Run npm ci and npm ci --prefix backend.",
  );
  process.exit(1);
}

if (existsSync(localDbConfigPath)) {
  try {
    const config = JSON.parse(readFileSync(localDbConfigPath, "utf8"));
    const envText = readFileSync(path.join(root, ".env"), "utf8");
    const databaseUrl = envText
      .match(/^DATABASE_URL=(.+)$/m)?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, "");
    const url = databaseUrl ? new URL(databaseUrl) : null;
    const port = Number(config.port);
    if (
      url?.hostname === "127.0.0.1" &&
      Number(url.port) === port &&
      Number.isInteger(port) &&
      port > 0 &&
      port < 65536 &&
      existsSync(config.pgCtl) &&
      existsSync(config.dataDir)
    ) {
      const args = ["-D", config.dataDir];
      const status = spawnSync(config.pgCtl, [...args, "status"], {
        stdio: "ignore",
      });
      if (status.status !== 0) {
        const started = spawnSync(
          config.pgCtl,
          [
            ...args,
            "-o",
            `-h 127.0.0.1 -p ${port}`,
            "-l",
            path.join(path.dirname(config.dataDir), "postgres.log"),
            "-w",
            "start",
          ],
          { stdio: "inherit" },
        );
        if (started.status !== 0) throw new Error("PostgreSQL did not start.");
      }
    }
  } catch (error) {
    console.error(`Local PostgreSQL setup failed: ${error.message}`);
    process.exit(1);
  }
}

let api;
let web;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  web?.kill();
  api?.kill();
  process.exitCode = code;
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

api = spawn(process.execPath, [apiEntry], { cwd: root, stdio: "inherit" });
api.on("exit", (code) => {
  if (!stopping) {
    console.error(`API stopped with code ${code ?? "unknown"}.`);
    stop(code || 1);
  }
});

let ready = false;
for (let attempt = 0; attempt < 60 && !stopping; attempt += 1) {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/health", {
      signal: AbortSignal.timeout(1000),
    });
    if (response.ok && (await response.json()).ok) {
      ready = true;
      break;
    }
  } catch {
    // The API may still be starting or waiting for PostgreSQL.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

if (!ready) {
  console.error(
    "API is not healthy. Check PostgreSQL, DATABASE_URL and backend logs above.",
  );
  stop(1);
} else {
  web = spawn(process.execPath, [viteEntry], { cwd: root, stdio: "inherit" });
  web.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
