import "./lib/error-capture";
import { LocalD1Proxy } from "./lib/services/local-db-proxy";
import { RemoteD1Proxy } from "./lib/services/remote-d1-proxy";
import path from "path";
import fs from "fs";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let seeded = false;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      // Merge incoming env with process.env for local development
      const activeEnv = {
        ...(process.env || {}),
        ...(env || {}),
        ...((globalThis as any).env || {}),
      };
      const debugFetch = activeEnv.DEBUG_SERVER_FETCH === "1";
      if (debugFetch) {
        console.log("--- SERVER FETCH ---", request.method, new URL(request.url).pathname);
      }

      // Inject DB into global context for server functions
      let db = activeEnv?.DB || activeEnv?.ggailabs_leadflow;

      // --- FALLBACK PARA DESENVOLVIMENTO LOCAL ---
      // Priorizar SQLite LOCAL para queries rápidas durante desenvolvimento
      // RemoteD1Proxy (wrangler CLI) é muito lento para iterar rapidamente
      if (!db && process.env.NODE_ENV !== "production") {
        // 1. PRIORIDADE: SQLite local do wrangler (fastest for dev)
        try {
          const stateDir = path.join(
            process.cwd(),
            ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
          );
          if (fs.existsSync(stateDir)) {
            const files = fs.readdirSync(stateDir).filter((f) => {
              if (!f.endsWith(".sqlite")) return false;
              const fullPath = path.join(stateDir, f);
              try {
                return fs.statSync(fullPath).size > 0;
              } catch {
                return false;
              }
            });
            if (files.length > 0) {
              const latest = files.sort(
                (a, b) =>
                  fs.statSync(path.join(stateDir, b)).mtimeMs -
                  fs.statSync(path.join(stateDir, a)).mtimeMs,
              )[0];
              const fullPath = path.join(stateDir, latest);
              if (debugFetch) console.log("--- LOCAL DEV DB ACTIVE ---", fullPath);
              db = new LocalD1Proxy(fullPath);
            }
          }
        } catch (err) {
          console.error("Failed to auto-detect local DB:", err);
        }

        // 2. FALLBACK: RemoteD1Proxy (slow, via wrangler CLI)
        if (!db) {
          try {
            if (debugFetch) console.log("--- TRYING REMOTE D1 (fallback) ---");
            const remoteDb = new RemoteD1Proxy();
            const testResult = await remoteDb
              .prepare("SELECT 1 as test")
              .bind()
              .first<{ test: number }>();
            if (testResult) {
              db = remoteDb;
              if (debugFetch) console.log("--- REMOTE D1 ACTIVE ---");
            }
          } catch (err) {
            if (debugFetch) console.log("Remote D1 unavailable:", (err as Error).message);
          }
        }
      }
      // -------------------------------------------

      if (db) {
        if (debugFetch) console.log("DB active, injecting into globalThis");
        (globalThis as any).DB = db;

        // Seed default data if needed (only once per server instance)
        if (!seeded) {
          try {
            const { seedDatabase } = await import("./lib/seed");
            await seedDatabase(db);
            seeded = true;
          } catch (err) {
            console.error("Seed failed:", err);
          }
        }
      } else {
        console.warn("DB NOT FOUND in env or local filesystem");
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
