import { createFileRoute } from "@tanstack/react-router";

/**
 * Public webhook receiver for the Evolution API.
 *
 * IMPORTANT: Lovable Cloud is NOT enabled in this project, so events are
 * acknowledged and logged only — they are not persisted. Enable Cloud and
 * extend this handler to write to a `whatsapp_events` table (or push to a
 * realtime channel) when persistence is required.
 *
 * Configure on the Evolution server with:
 *   POST /webhook/set/{instance}
 *   {
 *     "url": "https://<your-app>.lovable.app/api/public/evolution/webhook?token=...",
 *     "events": ["MESSAGES_UPSERT","CONNECTION_UPDATE","QRCODE_UPDATED", ...]
 *   }
 *
 * The optional `?token=...` query is verified against EVOLUTION_WEBHOOK_TOKEN
 * if that env var is set. If unset, the endpoint accepts unsigned calls.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/evolution/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const expected = process.env.EVOLUTION_WEBHOOK_TOKEN;
        if (expected) {
          const url = new URL(request.url);
          const token = url.searchParams.get("token") ?? request.headers.get("x-webhook-token");
          if (token !== expected) {
            return jsonResponse({ ok: false, error: "invalid_token" }, 401);
          }
        }

        let payload: unknown = null;
        try {
          const text = await request.text();
          payload = text ? JSON.parse(text) : null;
        } catch {
          return jsonResponse({ ok: false, error: "invalid_json" }, 400);
        }

        if (payload && typeof payload === "object") {
          const { event, instance } = payload as { event?: string; instance?: string };
          console.log(`[evolution] event=${event ?? "unknown"} instance=${instance ?? "?"}`);
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});
