import { DatabaseService } from "./services/db.service";

const DEFAULT_PROMPT = `Você é um analista comercial sênior especialista em High Ticket.
Analise a transcrição da conversa e gere um objeto JSON:

1. EXECUTIVE_SUMMARY (3-5 linhas diretas)
2. QUALIFICATION_SCORE (0-100 baseado em urgência e budget)
3. IDENTIFIED_NEEDS (Lista técnica de dores)
4. SUGGESTED_NEXT_STEPS (Ações pragmáticas)

Tom: Sóbrio, editorial, técnico.`;

export async function seedDatabase(db: any) {
  const dbService = new DatabaseService(db);
  
  const prompts = await dbService.getPrompts();
  if (prompts.length === 0) {
    await dbService.savePrompt({
      id: "default_sales",
      name: "Sales Analyst",
      content: DEFAULT_PROMPT,
      category: "sales",
    });
    console.log("[seed] Created default sales prompt");
  }
}
