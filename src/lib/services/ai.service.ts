// src/lib/services/ai.service.ts
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/prompts/default-sales";

export interface AIResponse {
  answer?: string;
  tags?: string[];
  score?: number;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export type AIProcessOutcome = { ok: true; data: AIResponse } | { ok: false; error: string };

export type AIServiceEnv = {
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  OPENAI_MODEL?: string;
  GEMINI_MODEL?: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export class AIService {
  private openaiKey: string;
  private geminiKey: string;
  private provider: string;
  private openaiModel: string;
  private geminiModel: string;
  private static geminiDisabled = false;
  private lastError: string | null = null;

  constructor(env: AIServiceEnv) {
    this.openaiKey = env.OPENAI_API_KEY || "";
    this.geminiKey = env.GEMINI_API_KEY || "";
    this.provider = env.AI_PROVIDER || "openai";
    this.openaiModel = env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    this.geminiModel = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  }

  async processMessage(
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    systemPrompt: string,
  ): Promise<AIProcessOutcome> {
    this.lastError = null;
    const preferred = (this.provider || "openai").toLowerCase();
    const providers =
      preferred === "gemini" ? (["gemini", "openai"] as const) : (["openai", "gemini"] as const);

    const errors: string[] = [];

    for (const provider of providers) {
      const result =
        provider === "gemini"
          ? await this.processGemini(message, history, systemPrompt)
          : await this.processOpenAI(message, history, systemPrompt);

      if (this.hasUsefulResult(result)) return { ok: true, data: result };
      if (this.lastError) errors.push(`${provider}: ${this.lastError}`);
      console.warn(`[AIService] Provider ${provider} returned empty response`);
    }

    if (!this.openaiKey && !this.geminiKey) {
      return { ok: false, error: "ai_keys_missing" };
    }

    return {
      ok: false,
      error: errors.length > 0 ? errors.join("; ") : "ai_unavailable",
    };
  }

  private hasUsefulResult(result: AIResponse): boolean {
    return Boolean(
      result.answer?.trim() ||
      result.summary?.trim() ||
      result.sentiment ||
      (Array.isArray(result.tags) && result.tags.length > 0) ||
      typeof result.score === "number",
    );
  }

  private parseStructuredResponse(raw: string): AIResponse {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Fall through and try to salvage plain-text answer.
    }
    const text = String(raw || "").trim();
    if (!text) return {};
    return { answer: text };
  }

  private async processOpenAI(
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    systemPrompt: string,
  ): Promise<AIResponse> {
    if (!this.openaiKey) {
      this.lastError = "missing_openai_key";
      return {};
    }

    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.lastError = `openai_http_${response.status}`;
        throw new Error(`OpenAI error: ${body}`);
      }
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = data?.choices?.[0]?.message?.content ?? "";
      return this.parseStructuredResponse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastError = msg.slice(0, 200);
      console.error("[AIService] OpenAI Error:", err);
      return {};
    }
  }

  private async processGemini(
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    systemPrompt: string,
  ): Promise<AIResponse> {
    if (AIService.geminiDisabled) {
      this.lastError = "gemini_disabled";
      return {};
    }

    if (!this.geminiKey) {
      this.lastError = "missing_gemini_key";
      return {};
    }

    try {
      const contents = [
        { role: "user", parts: [{ text: `SYSTEM: ${systemPrompt}` }] },
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        if (body.includes("API_KEY_INVALID") || body.includes("API Key not found")) {
          AIService.geminiDisabled = true;
          console.warn("[AIService] Gemini disabled for this runtime due to invalid API key");
        }
        this.lastError = `gemini_http_${response.status}`;
        throw new Error(`Gemini error: ${body}`);
      }
      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return this.parseStructuredResponse(content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!this.lastError) this.lastError = msg.slice(0, 200);
      console.error("[AIService] Gemini Error:", err);
      return {};
    }
  }

  getDefaultSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }
}
