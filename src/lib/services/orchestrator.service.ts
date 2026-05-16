// src/lib/services/orchestrator.service.ts
import { DatabaseService } from "./db.service";
import { EvolutionService } from "./evolution.service";
import { AIService, type AIServiceEnv } from "./ai.service";
import type { D1Database } from "./db.service";

function parseMetadataSafe(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mergeTags(existing: unknown, incoming: string[] | undefined): string[] {
  const base = Array.isArray(existing)
    ? existing.filter((t): t is string => typeof t === "string")
    : [];
  const added = (incoming ?? []).filter((t) => typeof t === "string" && t.trim());
  return Array.from(new Set([...base, ...added.map((t) => t.trim())]));
}

export class OrchestratorService {
  private db: DatabaseService;
  private evolution: EvolutionService;
  private ai: AIService;

  constructor(env: Record<string, unknown>) {
    const dbInstance = env.DB || (globalThis as { DB?: unknown }).DB || env.ggailabs_leadflow;
    const evolutionUrl = env.EVOLUTION_API_URL || env.EVOLUTION_API_BASE_URL;
    const evolutionKey = env.EVOLUTION_API_KEY || env.EVOLUTION_API_GLOBAL_KEY;

    if (!dbInstance) console.error("[Orchestrator] DB NOT FOUND IN ENV");
    if (!evolutionUrl) console.error("[Orchestrator] EVOLUTION_API_URL NOT FOUND");

    this.db = new DatabaseService(dbInstance as D1Database);
    this.evolution = new EvolutionService(String(evolutionUrl || ""), String(evolutionKey || ""));
    this.ai = new AIService(env as AIServiceEnv);
  }

  async handleIncomingMessage(payload: Record<string, unknown>) {
    const instance = payload.instance as string;
    const data = (payload as { data?: { message?: unknown; key?: unknown } })?.data?.message
      ? (payload as { data: Record<string, unknown> }).data
      : Array.isArray((payload as { data?: unknown[] })?.data)
        ? (payload as { data: Record<string, unknown>[] }).data[0]
        : (payload as { data?: Record<string, unknown> })?.data;

    if (!data?.key) {
      console.warn("[Orchestrator] Ignoring payload without data.key");
      return;
    }

    const key = data.key as { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean };
    const rawJid = key.remoteJid;
    const altJid = key.remoteJidAlt;
    const rawIsLid = typeof rawJid === "string" && rawJid.endsWith("@lid");
    const jid = rawIsLid ? altJid : rawJid;
    const message = data.message as Record<string, unknown> | undefined;
    const content =
      (message?.conversation as string) ||
      (message?.extendedTextMessage as { text?: string })?.text ||
      "";

    if (key.fromMe || !content || !jid) return;

    const contact = await this.db.getContactByJid(jid);
    if (!contact) return;

    const messages = await this.db.getMessagesByContact(jid, 10);
    const history = messages.reverse().map((m) => ({
      role: m.from_me ? ("assistant" as const) : ("user" as const),
      content: m.content || "",
    }));

    let systemPrompt = this.ai.getDefaultSystemPrompt();
    const resolvedPrompt = await this.db.resolvePromptForContact(contact);
    if (resolvedPrompt?.content) {
      systemPrompt = resolvedPrompt.content;
    }

    console.log(`[Orchestrator] Processing AI for ${jid}...`);
    const outcome = await this.ai.processMessage(content, history, systemPrompt);

    if (!outcome.ok) {
      console.warn(`[Orchestrator] AI failed for ${jid}:`, outcome.error);
      return;
    }

    const aiResult = outcome.data;

    if (aiResult.answer && contact.ai_enabled) {
      console.log(`[Orchestrator] Sending AI response to ${jid}`);
      const number = jid.split("@")[0].replace(/\D/g, "");
      await this.evolution.sendMessage(instance, number, aiResult.answer);

      const metadata = parseMetadataSafe(contact.metadata);
      await this.db.saveMessage({
        id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        contact_id: jid,
        from_me: 1,
        content: aiResult.answer,
        type: "text",
        raw_message: JSON.stringify({ ai_generated: true }),
      });
    } else if (!contact.ai_enabled) {
      console.log(`[Orchestrator] AI disabled for ${jid}, skipping reply`);
    } else if (!aiResult.answer) {
      console.warn(`[Orchestrator] AI returned no answer for ${jid}`);
    }

    const metadata = parseMetadataSafe(contact.metadata);
    const mergedTags = mergeTags(metadata.tags, aiResult.tags);
    const updatedMetadata = {
      ...metadata,
      summary: aiResult.summary || metadata.summary,
      sentiment: aiResult.sentiment || metadata.sentiment,
      tags: mergedTags,
      last_qualification_at: new Date().toISOString(),
      last_qualification_source: "orchestrator",
    };

    await this.db.updateContact(jid, {
      score: aiResult.score ?? contact.score,
      metadata: JSON.stringify(updatedMetadata),
    });
  }
}
