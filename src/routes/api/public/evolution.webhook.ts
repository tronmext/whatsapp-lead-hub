import { createFileRoute } from "@tanstack/react-router";
import { DatabaseService } from "../../../lib/services/db.service";

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

      POST: async ({ request, context }) => {
        const reqUrl = new URL(request.url);
        console.log("[webhook] HIT", reqUrl.pathname);

        // Robust env resolution
        const env = {
          ...(process.env || {}),
          ...((context as any)?.env || {}),
          ...((context as any)?.cloudflare?.env || {}),
          ...((globalThis as any).env || {}),
        };

        const dbInstance = env.DB || env.ggailabs_leadflow || (globalThis as any).DB;

        if (!dbInstance) {
          console.error("WEBHOOK: DATABASE NOT FOUND");
          console.log(
            "Available env keys:",
            Object.keys(env).filter((k) => !k.startsWith("npm_")),
          );
          return jsonResponse({ ok: false, error: "no_db" }, 500);
        }

        const db = new DatabaseService(dbInstance);
        const expected = env.EVOLUTION_WEBHOOK_TOKEN;

        if (expected) {
          const token = reqUrl.searchParams.get("token") ?? request.headers.get("x-webhook-token");
          if (token !== expected) {
            console.warn("[webhook] invalid token");
            return jsonResponse({ ok: false, error: "invalid_token" }, 401);
          }
        }

        let payload: any = null;
        try {
          const text = await request.text();
          // Log full payload for debugging media issues (truncated)
          console.log("[webhook] FULL PAYLOAD (first 800 chars):", text.substring(0, 800));
          payload = text ? JSON.parse(text) : null;
        } catch {
          return jsonResponse({ ok: false, error: "invalid_json" }, 400);
        }

        if (!payload || typeof payload !== "object") {
          return jsonResponse({ ok: false, error: "no_payload" }, 400);
        }

        const { event, instance, data } = payload;
        const normalizedEvent = (event || "").toLowerCase().replace(/_/g, ".");
        console.log(`[webhook] received event=${normalizedEvent} instance=${instance}`);

        try {
          if (normalizedEvent === "messages.upsert" && data) {
            // Em algumas versões data é um objeto, em outras é o que está dentro de key
            const msgData = data.message ? data : Array.isArray(data) ? data[0] : data;

            if (!msgData?.key) {
              console.warn("[webhook] No key found in msgData:", msgData);
              return jsonResponse({ ok: true });
            }

            const rawJid = msgData.key.remoteJid;
            const altJid = msgData.key.remoteJidAlt;
            const rawIsLid = typeof rawJid === "string" && rawJid.endsWith("@lid");
            const jid = rawIsLid ? altJid : rawJid;

            if (!jid) {
              console.warn("[webhook] Ignorando evento sem JID utilizável", {
                rawJid,
                altJid,
              });
              return jsonResponse({ ok: true, ignored: true, reason: "no_jid" });
            }

            // Ignorar mensagens de status (stories) e listas de transmissão genéricas
            if (jid === "status@broadcast" || jid?.includes("@broadcast")) {
              console.log("[webhook] Ignorando status/broadcast:", jid);
              return jsonResponse({ ok: true, ignored: true, reason: "broadcast" });
            }
            const fromMe = msgData.key.fromMe ? 1 : 0;
            const messageObj = msgData.message || {};

            // Debug log for message structure
            console.log("[webhook] messageObj keys:", Object.keys(messageObj));
            console.log("[webhook] full messageObj:", JSON.stringify(messageObj).substring(0, 500));

            // Check for base64 at data/msgData/message level (Evolution API webhookBase64=true)
            // Evolution can send base64 in multiple locations depending on message type
            const base64Data = messageObj.base64 || msgData.base64 || data.base64;
            if (base64Data) {
              console.log("[webhook] base64 detected:", {
                type: base64Data.type,
                mimetype: base64Data.mimetype,
                hasData: !!base64Data.data,
                location: messageObj.base64 ? "messageObj" : msgData.base64 ? "msgData" : "data",
              });
            }

            // Extract text content - also check base64 caption
            const content =
              messageObj.conversation ||
              messageObj.extendedTextMessage?.text ||
              messageObj.imageMessage?.caption ||
              messageObj.videoMessage?.caption ||
              messageObj.documentMessage?.caption ||
              base64Data?.caption ||
              "";
            const messageId = msgData.key.id;

            // Detect message type - check both messageObj and base64Data
            let msgType = "text";

            // First check messageObj for standard WhatsApp message types
            if (messageObj.imageMessage) msgType = "image";
            else if (messageObj.audioMessage || messageObj.pttMessage) msgType = "audio";
            else if (messageObj.videoMessage) msgType = "video";
            else if (messageObj.documentMessage) msgType = "document";
            else if (messageObj.stickerMessage) msgType = "sticker";
            else if (messageObj.locationMessage) msgType = "location";
            else if (messageObj.contactMessage) msgType = "contact";
            else if (messageObj.extendedTextMessage) msgType = "extendedText";

            // Also check base64 data from Evolution API (webhookBase64=true)
            if (msgType === "text" && base64Data) {
              const base64Type = (base64Data.type || "").toLowerCase();
              const base64Mime = (base64Data.mimetype || "").toLowerCase();
              if (base64Type === "image" || base64Mime.startsWith("image/")) msgType = "image";
              else if (
                base64Type === "audio" ||
                base64Mime.startsWith("audio/") ||
                base64Mime.includes("ogg")
              )
                msgType = "audio";
              else if (base64Type === "video" || base64Mime.startsWith("video/")) msgType = "video";
              else if (
                base64Type === "document" ||
                base64Mime.includes("pdf") ||
                base64Mime.includes("doc")
              )
                msgType = "document";
              else if (base64Type === "sticker" || base64Mime.includes("webp")) msgType = "sticker";
            }

            // Serialize raw_message for later media download - include base64Data if present
            const rawMessageJson = JSON.stringify({
              key: msgData.key,
              message: messageObj,
              base64: base64Data,
              messageTimestamp: msgData.messageTimestamp,
            });

            // 1. Upsert Contact (preserve manual/custom name if already saved)
            const existingContact = await db.getContact(jid);
            const existingName =
              typeof existingContact?.name === "string" ? existingContact.name.trim() : "";
            const incomingName = (msgData.pushName || data.pushName || jid.split("@")[0] || "").trim();
            const stableName = existingName || incomingName;

            await db.upsertContact({
              jid,
              instance_id: instance,
              name: stableName,
              phone: jid.split("@")[0],
              type: jid.includes("@g.us") ? "group" : "lead",
            });

            // 2. Save Message with proper type and raw_message
            await db.saveMessage({
              id: messageId,
              contact_id: jid,
              from_me: fromMe,
              content,
              type: msgType,
              raw_message: rawMessageJson,
              timestamp: new Date(
                (msgData.messageTimestamp || Date.now() / 1000) * 1000,
              ).toISOString(),
            });

            // 3. Trigger AI Orchestrator
            const orchestrator = new (
              await import("../../../lib/services/orchestrator.service")
            ).OrchestratorService(env);
            await orchestrator.handleIncomingMessage(payload);
            console.log("[webhook] processed messages.upsert");
          }
        } catch (err) {
          console.error("[webhook] Error processing event:", err);
          // Still return 200 to Evolution API to avoid retries if it's a logic error
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});
