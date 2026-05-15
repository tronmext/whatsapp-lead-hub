// Type-safe server functions wrapping the Evolution API.
// Safe to import from client code: build replaces handlers with RPC stubs.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { evolutionFetch, normalizePhone } from "./evolution.server";

/* ----------------------------- shared schemas ----------------------------- */

const InstanceName = z.string().trim().min(1).max(120);

/* ============================== INSTANCES ================================ */

export const listInstances = createServerFn({ method: "GET" }).handler(async () => {
  const data = await evolutionFetch<unknown>({ path: "/instance/fetchInstances" });
  return { instances: Array.isArray(data) ? data : [data] };
});

export const createInstance = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().trim().optional(),
        token: z.string().trim().optional(),
        qrcode: z.boolean().default(true),
        integration: z
          .enum(["WHATSAPP-BAILEYS", "WHATSAPP-BUSINESS", "EVOLUTION"])
          .default("WHATSAPP-BAILEYS"),
        rejectCall: z.boolean().optional(),
        msgCall: z.string().optional(),
        groupsIgnore: z.boolean().optional(),
        alwaysOnline: z.boolean().optional(),
        readMessages: z.boolean().optional(),
        readStatus: z.boolean().optional(),
        syncFullHistory: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return evolutionFetch({
      method: "POST",
      path: "/instance/create",
      body: {
        instanceName: data.instanceName,
        number: data.number ? normalizePhone(data.number) : undefined,
        token: data.token,
        qrcode: data.qrcode,
        integration: data.integration,
        reject_call: data.rejectCall,
        msgCall: data.msgCall,
        groupsIgnore: data.groupsIgnore,
        alwaysOnline: data.alwaysOnline,
        readMessages: data.readMessages,
        readStatus: data.readStatus,
        syncFullHistory: data.syncFullHistory,
      },
    });
  });

export const connectInstance = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) => {
    return evolutionFetch<{ code?: string; base64?: string; pairingCode?: string }>({
      path: `/instance/connect/${encodeURIComponent(data.instanceName)}`,
    });
  });

export const connectionState = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) => {
    return evolutionFetch<{ instance: { instanceName: string; state: "open" | "connecting" | "close" } }>({
      path: `/instance/connectionState/${encodeURIComponent(data.instanceName)}`,
    });
  });

export const restartInstance = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ method: "PUT", path: `/instance/restart/${encodeURIComponent(data.instanceName)}` }),
  );

export const logoutInstance = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ method: "DELETE", path: `/instance/logout/${encodeURIComponent(data.instanceName)}` }),
  );

export const deleteInstance = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ method: "DELETE", path: `/instance/delete/${encodeURIComponent(data.instanceName)}` }),
  );

export const setPresence = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        presence: z.enum(["available", "unavailable"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/instance/setPresence/${encodeURIComponent(data.instanceName)}`,
      body: { presence: data.presence },
    }),
  );

/* =============================== SETTINGS ================================ */

export const setInstanceSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        rejectCall: z.boolean().optional(),
        msgCall: z.string().optional(),
        groupsIgnore: z.boolean().optional(),
        alwaysOnline: z.boolean().optional(),
        readMessages: z.boolean().optional(),
        readStatus: z.boolean().optional(),
        syncFullHistory: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/settings/set/${encodeURIComponent(data.instanceName)}`,
      body: {
        reject_call: data.rejectCall,
        msg_call: data.msgCall,
        groups_ignore: data.groupsIgnore,
        always_online: data.alwaysOnline,
        read_messages: data.readMessages,
        read_status: data.readStatus,
        sync_full_history: data.syncFullHistory,
      },
    }),
  );

export const getInstanceSettings = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ path: `/settings/find/${encodeURIComponent(data.instanceName)}` }),
  );

/* ============================== MESSAGES ================================= */

const QuotedSchema = z
  .object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.object({ conversation: z.string() }),
  })
  .optional();

export const sendText = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        text: z.string().min(1).max(8000),
        delay: z.number().int().min(0).max(60_000).optional(),
        mentioned: z.array(z.string()).optional(),
        mentionsEveryOne: z.boolean().optional(),
        quoted: QuotedSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendText/${encodeURIComponent(data.instanceName)}`,
      body: {
        number: normalizePhone(data.number),
        text: data.text,
        delay: data.delay,
        mentioned: data.mentioned,
        mentionsEveryOne: data.mentionsEveryOne,
        quoted: data.quoted,
      },
    }),
  );

export const sendMedia = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        mediatype: z.enum(["image", "video", "document", "gif"]),
        mimetype: z.string().min(1).max(120),
        media: z.string().min(1), // URL or base64
        caption: z.string().max(2000).optional(),
        fileName: z.string().max(200).optional(),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendMedia/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendAudio = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        audio: z.string().min(1),
        delay: z.number().int().min(0).max(60_000).optional(),
        encoding: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendAudio/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendSticker = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        sticker: z.string().min(1),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendSticker/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendLocation = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        name: z.string().min(1).max(120),
        address: z.string().min(1).max(240),
        latitude: z.number(),
        longitude: z.number(),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendLocation/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendContactCard = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        contact: z
          .array(
            z.object({
              fullName: z.string().min(1).max(120),
              wuid: z.string().min(8).max(40),
              phoneNumber: z.string().min(8).max(40),
              organization: z.string().max(120).optional(),
              email: z.string().email().optional(),
              url: z.string().url().optional(),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendContact/${encodeURIComponent(data.instanceName)}`,
      body: { number: normalizePhone(data.number), contact: data.contact },
    }),
  );

export const sendReaction = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        key: z.object({ remoteJid: z.string(), fromMe: z.boolean(), id: z.string() }),
        reaction: z.string().max(8),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendReaction/${encodeURIComponent(data.instanceName)}`,
      body: { key: data.key, reaction: data.reaction },
    }),
  );

export const sendPoll = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        name: z.string().min(1).max(120),
        selectableCount: z.number().int().min(1).max(12).default(1),
        values: z.array(z.string().min(1).max(80)).min(2).max(12),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendPoll/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendList = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        title: z.string().min(1).max(120),
        description: z.string().max(500),
        buttonText: z.string().min(1).max(40),
        footerText: z.string().max(120).optional(),
        sections: z
          .array(
            z.object({
              title: z.string().min(1).max(80),
              rows: z
                .array(
                  z.object({
                    title: z.string().min(1).max(80),
                    description: z.string().max(120).optional(),
                    rowId: z.string().min(1).max(80),
                  }),
                )
                .min(1)
                .max(20),
            }),
          )
          .min(1)
          .max(10),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendList/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const sendButton = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        title: z.string().min(1).max(120),
        description: z.string().max(500),
        footer: z.string().max(120).optional(),
        buttons: z
          .array(
            z.object({
              type: z.enum(["reply", "url", "call"]),
              displayText: z.string().min(1).max(40),
              id: z.string().max(80).optional(),
              url: z.string().url().optional(),
              phoneNumber: z.string().min(8).max(40).optional(),
            }),
          )
          .min(1)
          .max(5),
        delay: z.number().int().min(0).max(60_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/message/sendButton/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

/* ================================ CHAT =================================== */

export const checkIsWhatsapp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        numbers: z.array(z.string().min(8).max(40)).min(1).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch<Array<{ exists: boolean; jid: string; name?: string }>>({
      method: "POST",
      path: `/chat/checkIsWhatsapp/${encodeURIComponent(data.instanceName)}`,
      body: { numbers: data.numbers.map(normalizePhone) },
    }),
  );

export const findChats = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ path: `/chat/findChats/${encodeURIComponent(data.instanceName)}` }),
  );

export const findContacts = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ instanceName: InstanceName, jid: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      path: `/chat/findContacts/${encodeURIComponent(data.instanceName)}`,
      query: data.jid ? { "where[id]": data.jid } : undefined,
    }),
  );

export const findMessages = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        remoteJid: z.string(),
        limit: z.number().int().min(1).max(200).default(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      path: `/chat/findMessages/${encodeURIComponent(data.instanceName)}`,
      query: { "where[key.remoteJid]": data.remoteJid, limit: data.limit },
    }),
  );

export const fetchProfilePictureUrl = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ instanceName: InstanceName, number: z.string().min(8).max(40) }).parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch<{ profilePictureUrl?: string }>({
      path: `/chat/fetchProfilePictureUrl/${encodeURIComponent(data.instanceName)}`,
      query: { number: normalizePhone(data.number) },
    }),
  );

export const markMessageAsRead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        readMessages: z
          .array(
            z.object({ remoteJid: z.string(), fromMe: z.boolean(), id: z.string() }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/chat/markMessageAsRead/${encodeURIComponent(data.instanceName)}`,
      body: { readMessages: data.readMessages },
    }),
  );

export const sendChatPresence = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        number: z.string().min(8).max(40),
        delay: z.number().int().min(0).max(60_000).default(2000),
        presence: z.enum(["composing", "recording", "paused"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/chat/sendPresence/${encodeURIComponent(data.instanceName)}`,
      body: { ...data, number: normalizePhone(data.number) },
    }),
  );

export const getBase64FromMediaMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        message: z.object({
          key: z.object({ remoteJid: z.string(), fromMe: z.boolean(), id: z.string() }),
        }),
        convertToMp4: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch<{ base64: string; mimetype?: string; fileName?: string }>({
      method: "POST",
      path: `/chat/getBase64FromMediaMessage/${encodeURIComponent(data.instanceName)}`,
      body: { message: data.message, convertToMp4: data.convertToMp4 },
    }),
  );

/* ============================== WEBHOOK ================================== */

export const setWebhook = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        instanceName: InstanceName,
        url: z.string().url(),
        webhookByEvents: z.boolean().default(false),
        webhookBase64: z.boolean().default(false),
        events: z.array(z.string().min(1).max(80)).min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    evolutionFetch({
      method: "POST",
      path: `/webhook/set/${encodeURIComponent(data.instanceName)}`,
      body: {
        url: data.url,
        webhook_by_events: data.webhookByEvents,
        webhook_base64: data.webhookBase64,
        events: data.events,
      },
    }),
  );

export const findWebhook = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ instanceName: InstanceName }).parse(input))
  .handler(async ({ data }) =>
    evolutionFetch({ path: `/webhook/find/${encodeURIComponent(data.instanceName)}` }),
  );
