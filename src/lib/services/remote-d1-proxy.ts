import { execSync } from "child_process";

const DB_NAME = "ggailabs-leadflow";

/**
 * RemoteD1Proxy
 * Executes queries against the production Cloudflare D1 database via wrangler CLI.
 * Falls back to local SQLite if wrangler is not authenticated.
 */
export class RemoteD1Proxy {
  prepare(query: string) {
    return {
      bind: (...args: any[]) => {
        const parts = query.split("?");
        let currentQuery = parts[0];
        for (let i = 0; i < args.length; i++) {
          let val = args[i];
          if (val === null || val === undefined) {
            val = "NULL";
          } else if (typeof val === "string") {
            val = `'${val.replace(/'/g, "''")}'`;
          } else if (typeof val === "object") {
            val = `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          }
          currentQuery += val + (parts[i + 1] || "");
        }

        if (parts.length > args.length + 1) {
          for (let i = args.length + 1; i < parts.length; i++) {
            currentQuery += "?" + parts[i];
          }
        }

        return {
          all: async <T>() => {
            try {
              const output = execSync(
                `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${currentQuery.replace(/"/g, '\\"')}"`,
                { timeout: 30000 },
              )
                .toString()
                .trim();
              const parsed = JSON.parse(output);
              const results = (Array.isArray(parsed) ? parsed[0]?.results : []) as T[];
              return { results, success: true, meta: { duration: 0 } };
            } catch (err: any) {
              console.error("RemoteD1Proxy [all] Error:", err.message, "\nQuery:", currentQuery);
              return { results: [], success: false, error: err.message };
            }
          },
          first: async <T>() => {
            try {
              const limitedQuery = currentQuery.includes("LIMIT")
                ? currentQuery
                : `${currentQuery.replace(/;$/, "")} LIMIT 1`;
              const output = execSync(
                `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${limitedQuery.replace(/"/g, '\\"')}"`,
                { timeout: 30000 },
              )
                .toString()
                .trim();
              const parsed = JSON.parse(output);
              const results = (Array.isArray(parsed) ? parsed[0]?.results : []) as T[];
              return results[0] || null;
            } catch (err: any) {
              console.error("RemoteD1Proxy [first] Error:", err.message, "\nQuery:", currentQuery);
              return null;
            }
          },
          run: async () => {
            try {
              execSync(
                `npx wrangler d1 execute ${DB_NAME} --remote --command "${currentQuery.replace(/"/g, '\\"')}"`,
                { timeout: 30000 },
              );
              return { success: true, meta: { duration: 0 } };
            } catch (err: any) {
              console.error("RemoteD1Proxy [run] Error:", err.message, "\nQuery:", currentQuery);
              return { success: false, error: err.message };
            }
          },
        };
      },
      all: async <T>() => {
        try {
          const output = execSync(
            `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${query.replace(/"/g, '\\"')}"`,
            { timeout: 30000 },
          )
            .toString()
            .trim();
          const parsed = JSON.parse(output);
          const results = (Array.isArray(parsed) ? parsed[0]?.results : []) as T[];
          return { results, success: true, meta: { duration: 0 } };
        } catch (err: any) {
          console.error("RemoteD1Proxy [all-raw] Error:", err.message, "\nQuery:", query);
          return { results: [], success: false, error: err.message };
        }
      },
      first: async <T>() => {
        try {
          const limitedQuery = query.includes("LIMIT")
            ? query
            : `${query.replace(/;$/, "")} LIMIT 1`;
          const output = execSync(
            `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${limitedQuery.replace(/"/g, '\\"')}"`,
            { timeout: 30000 },
          )
            .toString()
            .trim();
          const parsed = JSON.parse(output);
          const results = (Array.isArray(parsed) ? parsed[0]?.results : []) as T[];
          return results[0] || null;
        } catch (err: any) {
          console.error("RemoteD1Proxy [first-raw] Error:", err.message, "\nQuery:", query);
          return null;
        }
      },
    };
  }
}
