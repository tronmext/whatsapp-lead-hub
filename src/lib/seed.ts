import { DatabaseService, type D1Database } from "./services/db.service";
import { DEFAULT_PROMPT_SEED } from "./prompts/default-sales";

export async function seedDatabase(db: D1Database) {
  const dbService = new DatabaseService(db);

  const prompts = await dbService.getPrompts();
  if (prompts.length === 0) {
    await dbService.savePrompt(DEFAULT_PROMPT_SEED);
    console.log("[seed] Created default sales prompt");
  }
}
