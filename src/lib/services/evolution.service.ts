import { z } from "zod";

export const EvolutionInstanceSchema = z.object({
  instanceName: z.string(),
  status: z.string(),
  apikey: z.string().optional(),
});

export type EvolutionInstance = z.infer<typeof EvolutionInstanceSchema>;

export class EvolutionService {
  private baseUrl: string;
  private globalKey: string;

  constructor(baseUrl: string, globalKey: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.globalKey = globalKey;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      apikey: this.globalKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async fetchInstances() {
    return this.request("/instance/fetchInstances");
  }

  async connectionState(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`);
  }

  async connect(instanceName: string) {
    return this.request(`/instance/connect/${instanceName}`);
  }

  async sendMessage(instanceName: string, number: string, text: string) {
    return this.request(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number,
        text,
        delay: 300,
      }),
    });
  }

  async sendMedia(instanceName: string, number: string, mediaUrl: string, caption?: string) {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number,
        media: mediaUrl,
        mediatype: "image",
        caption,
        delay: 1200,
      }),
    });
  }

  async checkIsWhatsapp(instanceName: string, numbers: string[]) {
    return this.request(`/chat/checkIsWhatsapp/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ numbers }),
    });
  }
}
