import { AIService } from "./src/lib/services/ai.service.ts";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  const ai = new AIService(process.env as any);
  console.log("Testing AI...");
  const res = await ai.processMessage("hello", [], "You are a helpful assistant.");
  console.log("Result:", res);
}
test().catch(console.error);
