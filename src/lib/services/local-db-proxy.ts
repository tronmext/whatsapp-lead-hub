import { execSync } from "child_process";
import path from "path";

/**
 * Escape special characters for shell double-quoted strings.
 * Inside double quotes, these characters need escaping: $ \ ` " !
 */
function escapeForShellDoubleQuotes(str: string): string {
  return str
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\$/g, "\\$") // Escape dollar signs
    .replace(/`/g, "\\`") // Escape backticks
    .replace(/!/g, "\\!"); // Escape exclamation marks (history expansion in bash)
}

/**
 * LocalD1Proxy
 * Simula a interface do Cloudflare D1 Database usando a CLI do sqlite3.
 * Útil para desenvolvimento local quando as bindings da Cloudflare não estão disponíveis no Vite.
 */
export class LocalD1Proxy {
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

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
            // SQL escaping: double single quotes, then escape for shell
            const sqlEscaped = val.replace(/'/g, "''");
            val = `'${sqlEscaped}'`;
          } else if (typeof val === "object") {
            // JSON stringify, SQL escape single quotes, then escape for shell
            const jsonStr = JSON.stringify(val);
            const sqlEscaped = jsonStr.replace(/'/g, "''");
            val = `'${sqlEscaped}'`;
          }
          currentQuery += val + (parts[i + 1] || "");
        }

        if (parts.length > args.length + 1) {
          for (let i = args.length + 1; i < parts.length; i++) {
            currentQuery += "?" + parts[i];
          }
        }

        // Escape the entire query for shell double quotes
        const shellSafeQuery = escapeForShellDoubleQuotes(currentQuery);

        return {
          all: async <T>() => {
            const cmd = `sqlite3 -json ${this.dbPath} "${shellSafeQuery}"`;
            try {
              const output = execSync(cmd).toString().trim();
              const results = output ? (JSON.parse(output) as T[]) : [];
              return { results, success: true, meta: { duration: 0 } };
            } catch (err: any) {
              console.error("LocalD1Proxy [all] Error:", err.message, "\nQuery:", currentQuery);
              return { results: [], success: false, error: err.message };
            }
          },
          first: async <T>() => {
            const hasLimit = /\blimit\b/i.test(currentQuery);
            const firstQuery = hasLimit
              ? currentQuery
              : `${currentQuery.replace(/;$/, "")} LIMIT 1`;
            const shellSafeFirstQuery = escapeForShellDoubleQuotes(firstQuery);
            const cmd = `sqlite3 -json ${this.dbPath} "${shellSafeFirstQuery}"`;
            try {
              const output = execSync(cmd).toString().trim();
              const results = output ? (JSON.parse(output) as T[]) : [];
              return results[0] || null;
            } catch (err: any) {
              console.error("LocalD1Proxy [first] Error:", err.message, "\nQuery:", currentQuery);
              return null;
            }
          },
          run: async () => {
            const cmd = `sqlite3 ${this.dbPath} "${shellSafeQuery}"`;
            try {
              execSync(cmd);
              return { success: true, meta: { duration: 0 } };
            } catch (err: any) {
              console.error("LocalD1Proxy [run] Error:", err.message, "\nQuery:", currentQuery);
              return { success: false, error: err.message };
            }
          },
        };
      },
      all: async <T>() => {
        const shellSafeQuery = escapeForShellDoubleQuotes(query);
        const cmd = `sqlite3 -json ${this.dbPath} "${shellSafeQuery}"`;
        try {
          const output = execSync(cmd).toString().trim();
          const results = output ? (JSON.parse(output) as T[]) : [];
          return { results, success: true, meta: { duration: 0 } };
        } catch (err: any) {
          console.error("LocalD1Proxy [all-raw] Error:", err.message, "\nQuery:", query);
          return { results: [], success: false, error: err.message };
        }
      },
    };
  }
}
