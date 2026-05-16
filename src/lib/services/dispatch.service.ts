import type { D1Contact, DispatchSettings } from "./db.service";
import { EvolutionService } from "./evolution.service";

export type DispatchType = "secretaria" | "comercial" | "followup";

function parseMetadata(raw?: string): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatPhone(jid: string): string {
  const digits = jid.split("@")[0]?.replace(/\D/g, "") ?? "";
  if (!digits) return jid;
  if (digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, -4)}-${digits.slice(-4)}`;
  }
  return `+${digits}`;
}

export function buildSecretariaMessage(
  contact: D1Contact,
  metadata: Record<string, unknown>,
  baseUrl?: string,
): string {
  const summary = String(metadata.summary || "Sem resumo IA ainda.");
  const score = contact.score ?? 0;
  const tags = Array.isArray(metadata.tags) ? metadata.tags.join(", ") : "—";
  return `📋 *Despacho — Secretaria*

👤 *${contact.name || "Lead"}*
📱 ${formatPhone(contact.jid)}
🏷️ Tags: ${tags}
⭐ Score: ${score}/100

📝 *Resumo*
${summary}

🔗 ${baseUrl ? `${baseUrl}/inbox` : "Leadflow"}`;
}

export function buildComercialMessage(
  contact: D1Contact,
  metadata: Record<string, unknown>,
  baseUrl?: string,
): string {
  const summary = String(metadata.summary || "Sem resumo.");
  const sentiment = String(metadata.sentiment || "neutral");
  const company = String(metadata.company || metadata.role || "—");
  const deepLink = baseUrl ? `${baseUrl}/inbox?jid=${encodeURIComponent(contact.jid)}` : "";
  return `💼 *Briefing Comercial*

Lead: *${contact.name || contact.jid}*
Tel: ${formatPhone(contact.jid)}
Status CRM: ${contact.status}
Score: ${contact.score ?? 0}/100
Sentimento: ${sentiment}
Contexto: ${company}

*Resumo técnico*
${summary}

${deepLink ? `Abrir no Leadflow:\n${deepLink}` : ""}`;
}

export function buildFollowupMessage(contact: D1Contact, note: string, followupAt: string): string {
  return `⏰ *Follow-up agendado*

Lead: *${contact.name || contact.jid}*
Tel: ${formatPhone(contact.jid)}
Quando: ${followupAt}
Nota: ${note || "—"}`;
}

export class DispatchService {
  constructor(
    private evolution: EvolutionService,
    private settings: DispatchSettings,
    private baseUrl = "",
  ) {}

  resolveTarget(type: DispatchType): string {
    if (type === "secretaria") return this.settings.secretaria;
    if (type === "comercial") return this.settings.comercial;
    return this.settings.followupNotify;
  }

  buildMessage(
    type: DispatchType,
    contact: D1Contact,
    options?: { note?: string; followupAt?: string },
  ): string {
    const metadata = parseMetadata(contact.metadata);
    if (type === "secretaria") return buildSecretariaMessage(contact, metadata, this.baseUrl);
    if (type === "comercial") return buildComercialMessage(contact, metadata, this.baseUrl);
    return buildFollowupMessage(
      contact,
      options?.note || "",
      options?.followupAt || new Date().toLocaleString("pt-BR"),
    );
  }

  async send(
    instanceId: string,
    type: DispatchType,
    contact: D1Contact,
    options?: { note?: string; followupAt?: string },
  ): Promise<{ ok: true; target: string; preview: string } | { ok: false; error: string }> {
    const target = this.resolveTarget(type);
    if (!target) {
      return { ok: false, error: "dispatch_target_not_configured" };
    }

    const text = this.buildMessage(type, contact, options);
    try {
      await this.evolution.sendMessage(instanceId, target, text);
      return { ok: true, target, preview: text.slice(0, 120) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  }
}
