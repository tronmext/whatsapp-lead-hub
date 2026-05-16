import { createServerFn } from "@tanstack/react-start";
import { DatabaseService } from "./services/db.service";
import { AIService } from "./services/ai.service";
import { DispatchService, type DispatchType } from "./services/dispatch.service";
import { EvolutionService } from "./services/evolution.service";
import { DEFAULT_CONVERSATION_CATEGORIES } from "./defaults/conversation-categories";

function parseMetadataSafe(raw: unknown): Record<string, any> {
  if (raw && typeof raw === "object") return raw as Record<string, any>;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const getLeads = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  try {
    const ctx = context as any;
    const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
    const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

    if (!dbInstance) {
      console.error("DATABASE NOT FOUND IN HANDLER. Available env keys:", Object.keys(env || {}));
      return []; // Return empty instead of crashing
    }

    const db = new DatabaseService(dbInstance);
    return db.getContacts();
  } catch (error: any) {
    console.error("Error in getLeads server function:", error.message);
    return [];
  }
});

export const getLeadsLite = createServerFn({ method: "GET" })
  .inputValidator((data: { instanceId?: string } | undefined) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return [];

      const db = new DatabaseService(dbInstance);
      return db.getContactsLite(data?.instanceId);
    } catch (error: any) {
      console.error("Error in getLeadsLite server function:", error.message);
      return [];
    }
  });

export const getInstanceLeadsAi = createServerFn({ method: "GET" })
  .inputValidator((data: { instanceId: string } | undefined) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance || !data?.instanceId) return [];

      const db = new DatabaseService(dbInstance);
      return db.getLeadsForAi(data.instanceId);
    } catch (error: any) {
      console.error("Error in getInstanceLeadsAi server function:", error.message);
      return [];
    }
  });

export const getConversationCategorySettings = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) {
        return {
          categories: [...DEFAULT_CONVERSATION_CATEGORIES],
          visibleCategories: ["lead", "group"],
        };
      }

      const db = new DatabaseService(dbInstance);
      return db.getConversationCategorySettings();
    } catch (error: any) {
      console.error("Error in getConversationCategorySettings:", error.message);
      return {
        categories: [...DEFAULT_CONVERSATION_CATEGORIES],
        visibleCategories: ["lead", "group"],
      };
    }
  },
);

export const saveConversationCategorySettings = createServerFn({ method: "POST" })
  .inputValidator((data: { categories: string[]; visibleCategories: string[] }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      const saved = await db.setConversationCategorySettings({
        categories: data?.categories || [],
        visibleCategories: data?.visibleCategories || [],
      });
      return { ok: true, settings: saved };
    } catch (error: any) {
      console.error("Error in saveConversationCategorySettings:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const getInstanceAiStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { instanceId: string } | undefined) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance || !data?.instanceId) {
        return { instance_id: data?.instanceId || "", total: 0, enabled: 0, disabled: 0 };
      }

      const db = new DatabaseService(dbInstance);
      return db.getInstanceAiStatus(data.instanceId);
    } catch (error: any) {
      console.error("Error in getInstanceAiStatus server function:", error.message);
      return { instance_id: data?.instanceId || "", total: 0, enabled: 0, disabled: 0 };
    }
  });

export const getMessages = createServerFn({ method: "GET" })
  .inputValidator((jid: string) => jid)
  .handler(async ({ data: jid, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return [];

      const db = new DatabaseService(dbInstance);
      return db.getMessages(jid);
    } catch (error: any) {
      console.error("Error in getMessages:", error.message);
      return [];
    }
  });

export const getInstances = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  try {
    const ctx = context as any;
    const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
    const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

    if (!dbInstance) return [];

    const db = new DatabaseService(dbInstance);
    return db.getInstances();
  } catch (error: any) {
    console.error("Error in getInstances:", error.message);
    return [];
  }
});

export const syncInstances = createServerFn({ method: "POST" })
  .inputValidator((instances: { name: string; state?: string; ownerJid?: string }[]) => instances)
  .handler(async ({ data: instances, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { synced: 0 };

      const db = new DatabaseService(dbInstance);
      const existing = await db.getInstances();
      const existingNames = new Set(existing.map((i) => i.name));

      let synced = 0;
      for (const inst of instances) {
        if (!existingNames.has(inst.name)) {
          await db.upsertInstance({
            id: inst.name,
            name: inst.name,
            alias: "",
            api_key: "",
            webhook_token: "",
            is_active: inst.state === "open" ? 1 : 0,
          });
          synced++;
        }
      }
      return { synced };
    } catch (error: any) {
      console.error("Error in syncInstances:", error.message);
      return { synced: 0 };
    }
  });

export const getContact = createServerFn({ method: "GET" })
  .inputValidator((jid: string) => jid)
  .handler(async ({ data: jid, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return null;

      const db = new DatabaseService(dbInstance);
      const contact = await db.getContact(jid);
      return contact;
    } catch (error: any) {
      console.error("Error in getContact:", error.message);
      return null;
    }
  });

export const updateContact = createServerFn({ method: "POST" })
  .inputValidator((data: { jid: string; updates: any; instanceId?: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.updateContact(data.jid, data.updates, data.instanceId);
    } catch (error: any) {
      console.error("Error in updateContact:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const createLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { jid: string; instanceId?: string; name?: string; phone?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);

      // Ensure JID format
      let jid = data.jid.replace(/\D+/g, "");
      if (!jid.includes("@")) {
        jid = `${jid}@s.whatsapp.net`;
      }

      await db.upsertContact({
        jid,
        instance_id: data.instanceId || "default",
        name: data.name || jid.split("@")[0],
        phone: data.phone || jid.split("@")[0],
        type: "lead",
        status: "novo",
        score: 0,
        ai_enabled: 0,
        metadata: "{}",
      });

      return { ok: true, jid };
    } catch (error: any) {
      console.error("Error in createLead:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const ensureContact = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { jid: string; instanceId: string; name?: string; phone?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      const contact = await db.ensureContact({
        jid: data.jid,
        instance_id: data.instanceId,
        name: data.name,
        phone: data.phone,
      });
      return { ok: true, contact };
    } catch (error: any) {
      console.error("Error in ensureContact:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const getAnalyticsMetrics = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance)
        return {
          totalContacts: 0,
          newToday: 0,
          inNegotiation: 0,
          avgResponseMs: 0,
          conversionRate: 0,
          aiAutomations: 0,
          aiEnabledLeads: 0,
          messagesToday: 0,
          avgScore: 0,
          qualifiedCount: 0,
          lostCount: 0,
          weeklyQualified: [],
          prevWeekQualified: 0,
          currentWeekQualified: 0,
        };

      const db = new DatabaseService(dbInstance);
      return db.getAnalyticsMetrics();
    } catch (error: any) {
      console.error("Error in getAnalyticsMetrics:", error.message);
      return {
        totalContacts: 0,
        newToday: 0,
        inNegotiation: 0,
        avgResponseMs: 0,
        conversionRate: 0,
        aiAutomations: 0,
        aiEnabledLeads: 0,
        messagesToday: 0,
        avgScore: 0,
        qualifiedCount: 0,
        lostCount: 0,
        weeklyQualified: [],
        prevWeekQualified: 0,
        currentWeekQualified: 0,
      };
    }
  },
);

export const getPrompts = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  try {
    const ctx = context as any;
    const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
    const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

    if (!dbInstance) return [];

    const db = new DatabaseService(dbInstance);
    return db.getPrompts();
  } catch (error: any) {
    console.error("Error in getPrompts:", error.message);
    return [];
  }
});

export const savePrompt = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id?: string;
      name: string;
      content: string;
      category?: string;
      scope_instance_id?: string | null;
      scope_tag?: string | null;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.savePrompt(data);
    } catch (error: any) {
      console.error("Error in savePrompt:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { jid: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.updateContactStatus(data.jid, data.status);
    } catch (error: any) {
      console.error("Error in updateLeadStatus:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const updateInstanceAlias = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; alias: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      return db.updateInstanceAlias(data.id, data.alias);
    } catch (error: any) {
      console.error("Error in updateInstanceAlias:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const setInstanceAiDefault = createServerFn({ method: "POST" })
  .inputValidator((data: { instanceId: string; enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance || !data?.instanceId) return { ok: false, error: "no_db_or_instance" };

      const db = new DatabaseService(dbInstance);
      const result = await db.setAiEnabledForInstance(data.instanceId, data.enabled ? 1 : 0);
      return { ok: true, changes: (result.meta as any)?.changes ?? 0 };
    } catch (error: any) {
      console.error("Error in setInstanceAiDefault:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const setLeadsAiBatch = createServerFn({ method: "POST" })
  .inputValidator((data: { instanceId: string; jids: string[]; enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;

      if (!dbInstance || !data?.instanceId) return { ok: false, error: "no_db_or_instance" };

      const db = new DatabaseService(dbInstance);
      const result = await db.setAiEnabledForJids(
        data.instanceId,
        data.jids || [],
        data.enabled ? 1 : 0,
      );
      return { ok: true, updated: result.updated };
    } catch (error: any) {
      console.error("Error in setLeadsAiBatch:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const requalifyLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { jid: string; instanceId: string; promptId?: string; customPrompt?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;
      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      const ai = new AIService(env);

      const ensured = await db.ensureContact({
        jid: data.jid,
        instance_id: data.instanceId,
        name: data.jid.split("@")[0],
        phone: data.jid.split("@")[0],
      });
      if (!ensured) return { ok: false, error: "contact_not_found" };

      const messages = await db.getMessagesByContact(data.jid, 40);
      const history = messages
        .slice(-30)
        .map((m) => ({
          role: (m.from_me ? "assistant" : "user") as "assistant" | "user",
          content: m.content || "",
        }))
        .filter((m) => m.content.trim());

      const lastInbound =
        [...messages].reverse().find((m) => !m.from_me && (m.content || "").trim())?.content ||
        "Reavalie este lead com base no histórico.";

      let systemPrompt = ai.getDefaultSystemPrompt();
      let promptSource: "default" | "saved" | "custom" = "default";

      const customPrompt = data.customPrompt?.trim();
      if (customPrompt) {
        systemPrompt = customPrompt;
        promptSource = "custom";
      } else if (data.promptId) {
        const savedPrompt = await db.getPrompt(data.promptId);
        if (savedPrompt?.content?.trim()) {
          systemPrompt = savedPrompt.content;
          promptSource = "saved";
        }
      }

      const outcome = await ai.processMessage(lastInbound, history, systemPrompt);
      if (!outcome.ok) {
        return { ok: false, error: outcome.error };
      }

      const aiResult = outcome.data;

      const currentMeta = parseMetadataSafe(ensured.metadata);
      const existingTags = Array.isArray(currentMeta.tags)
        ? currentMeta.tags.filter((t: unknown) => typeof t === "string")
        : [];
      const aiTags = Array.isArray(aiResult.tags)
        ? aiResult.tags.filter((t) => typeof t === "string" && t.trim())
        : [];
      const mergedTags = Array.from(new Set([...existingTags, ...aiTags]));

      const nextMetadata = {
        ...currentMeta,
        summary: aiResult.summary || currentMeta.summary,
        sentiment: aiResult.sentiment || currentMeta.sentiment,
        tags: mergedTags,
        last_qualification_at: new Date().toISOString(),
        last_qualification_source: "manual_button",
        last_qualification_prompt_source: promptSource,
      };

      await db.updateContact(
        data.jid,
        {
          score: aiResult.score ?? ensured.score,
          metadata: JSON.stringify(nextMetadata),
        },
        data.instanceId,
      );

      return {
        ok: true,
        score: aiResult.score ?? ensured.score,
        summary: aiResult.summary ?? null,
        sentiment: aiResult.sentiment ?? null,
        tags: mergedTags,
      };
    } catch (error: any) {
      console.error("Error in requalifyLead:", error.message);
      return { ok: false, error: error.message };
    }
  });

export const getDispatchSettings = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;
      if (!dbInstance) return { ok: false, error: "no_db", settings: null };

      const db = new DatabaseService(dbInstance);
      const settings = await db.getDispatchSettings();
      return { ok: true, settings };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: msg, settings: null };
    }
  },
);

export const saveDispatchSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { secretaria: string; comercial: string; followupNotify: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;
      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      const settings = await db.setDispatchSettings(data);
      return { ok: true, settings };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: msg };
    }
  });

export const dispatchLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      jid: string;
      instanceId: string;
      type: DispatchType;
      note?: string;
      followupAt?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;
      if (!dbInstance) return { ok: false, error: "no_db" };

      const db = new DatabaseService(dbInstance);
      const contact = await db.getContact(data.jid);
      if (!contact) return { ok: false, error: "contact_not_found" };

      const settings = await db.getDispatchSettings();
      const evolutionUrl =
        (env as Record<string, string>)?.EVOLUTION_API_URL ||
        (env as Record<string, string>)?.EVOLUTION_API_BASE_URL ||
        "";
      const evolutionKey =
        (env as Record<string, string>)?.EVOLUTION_API_KEY ||
        (env as Record<string, string>)?.EVOLUTION_API_GLOBAL_KEY ||
        "";
      const baseUrl = String((env as Record<string, string>)?.BASE_URL || "");

      const dispatch = new DispatchService(
        new EvolutionService(evolutionUrl, evolutionKey),
        settings,
        baseUrl,
      );

      const result = await dispatch.send(data.instanceId, data.type, contact, {
        note: data.note,
        followupAt: data.followupAt,
      });

      if (!result.ok) return result;

      if (data.type === "followup" && data.followupAt) {
        let metadata: Record<string, unknown> = {};
        if (contact.metadata) {
          try {
            metadata = JSON.parse(contact.metadata);
          } catch {
            metadata = {};
          }
        }
        metadata.followup = { at: data.followupAt, note: data.note || "" };
        await db.updateContact(data.jid, { metadata: JSON.stringify(metadata) }, data.instanceId);
      }

      await db.appendContactTimeline(data.jid, {
        type: data.type,
        at: new Date().toISOString(),
        target: result.target,
        preview: result.preview,
      });

      return { ok: true, target: result.target };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: msg };
    }
  });

export const exportAnalyticsMetrics = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    try {
      const ctx = context as any;
      const env = ctx?.cloudflare?.env || ctx?.env || (globalThis as any).env || process.env;
      const dbInstance = env?.DB || (globalThis as any).DB || env?.ggailabs_leadflow;
      if (!dbInstance) return { ok: false, error: "no_db", csv: "" };

      const db = new DatabaseService(dbInstance);
      const m = await db.getAnalyticsMetrics();
      const lines = [
        "metrica,valor",
        `total_contacts,${m.totalContacts}`,
        `novos_hoje,${m.newToday}`,
        `em_negociacao,${m.inNegotiation}`,
        `taxa_conversao,${m.conversionRate.toFixed(1)}`,
        `resposta_media_ms,${m.avgResponseMs}`,
        `ia_automacoes,${m.aiAutomations}`,
        `leads_ia_ativa,${m.aiEnabledLeads}`,
        `mensagens_hoje,${m.messagesToday}`,
        `score_medio,${Math.round(m.avgScore)}`,
        `qualificados,${m.qualifiedCount}`,
        `perdidos,${m.lostCount}`,
        "",
        "semana,qualificados",
        ...m.weeklyQualified.map((w) => `${w.week_start},${w.count}`),
      ];
      return { ok: true, csv: lines.join("\n") };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { ok: false, error: msg, csv: "" };
    }
  },
);
