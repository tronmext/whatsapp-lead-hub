import "./lib/error-capture";
import { LocalD1Proxy } from "./lib/services/local-db-proxy";
import path from "path";
import fs from "fs";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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
      console.log('--- SERVER FETCH ---');
      
      // Merge incoming env with process.env for local development
      const activeEnv = {
        ...(process.env || {}),
        ...(env || {}),
        ...((globalThis as any).env || {})
      };
      
      console.log('Env keys:', Object.keys(activeEnv).filter(k => !k.startsWith('npm_')));
      
      // Inject DB into global context for server functions
      let db = activeEnv?.DB || activeEnv?.ggailabs_leadflow;
      
      // --- FALLBACK PARA DESENVOLVIMENTO LOCAL ---
      if (!db && process.env.NODE_ENV !== 'production') {
        try {
          const stateDir = path.join(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
          if (fs.existsSync(stateDir)) {
            const files = fs.readdirSync(stateDir).filter(f => f.endsWith('.sqlite'));
            if (files.length > 0) {
              // Pega o arquivo mais recente
              const latest = files.sort((a, b) => 
                fs.statSync(path.join(stateDir, b)).mtimeMs - fs.statSync(path.join(stateDir, a)).mtimeMs
              )[0];
              const fullPath = path.join(stateDir, latest);
              console.log('--- LOCAL DEV DB DETECTED ---', fullPath);
              db = new LocalD1Proxy(fullPath);
            }
          }
        } catch (err) {
          console.error('Failed to auto-detect local DB:', err);
        }
      }
      // -------------------------------------------

      if (db) {
        console.log('DB active, injecting into globalThis');
        (globalThis as any).DB = db;
        
        // Seed default data if needed (only once)
        try {
          const { seedDatabase } = await import('./lib/seed');
          await seedDatabase(db);
        } catch (err) {
          console.error('Seed failed:', err);
        }
      } else {
        console.warn('DB NOT FOUND in env or local filesystem');
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
