import { ChatOpenAI } from "@langchain/openai";

export function isLlmConfigured(): boolean {
  const base = process.env.LITELLM_BASE_URL?.trim();
  const key = process.env.LITELLM_API_KEY?.trim();
  const model = process.env.LITELLM_MODEL?.trim();
  if (!base || !key || !model) return false;
  if (base.includes("placeholder") || key === "placeholder") return false;
  return true;
}

export function createChatModel(): ChatOpenAI {
  if (!isLlmConfigured()) {
    throw new Error("LiteLLM is not configured");
  }
  return new ChatOpenAI({
    model: process.env.LITELLM_MODEL,
    apiKey: process.env.LITELLM_API_KEY,
    configuration: {
      baseURL: process.env.LITELLM_BASE_URL,
    },
    temperature: 0.2,
  });
}