import { defineConfig } from "cypress";
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";

const FRONTEND_URL = "http://127.0.0.1:5173";
let viteProcess;

function isFrontendRunning() {
  return new Promise((resolve) => {
    const request = http.get(FRONTEND_URL, (response) => {
      response.resume();
      resolve(true);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForFrontend(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isFrontendRunning()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Vite dev server did not start at ${FRONTEND_URL}`);
}

async function startFrontend(projectRoot) {
  if (await isFrontendRunning()) {
    return null;
  }

  if (!viteProcess || viteProcess.killed) {
    const viteBin = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

    viteProcess = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", "5173", "--strictPort"], {
      cwd: projectRoot,
      shell: false,
      stdio: "inherit",
    });
  }

  await waitForFrontend();
  return null;
}

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: FRONTEND_URL,
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        await startFrontend(config.projectRoot);
      });

      on("task", {
        startVite() {
          return startFrontend(config.projectRoot);
        },
      });

      on("after:run", () => {
        if (viteProcess && !viteProcess.killed) {
          viteProcess.kill();
          viteProcess = undefined;
        }
      });

      return config;
    },
  },
});
