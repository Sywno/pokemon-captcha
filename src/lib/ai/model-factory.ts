// ============================================================
// Model Factory — Provider-agnostic LLM instantiation
// ============================================================

import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type AIProvider = "openai" | "gemini" | "ollama";

/**
 * Detects the best available provider from env vars.
 */
function detectProvider(): AIProvider {
    if (process.env.OPENAI_API_KEY) return "openai";
    if (process.env.GOOGLE_API_KEY) return "gemini";
    return "ollama"; // Fallback to local
}

/**
 * Creates a chat model instance for the narrator agent.
 * Supports OpenAI, Google Gemini, and Ollama (local).
 */
export async function createNarratorModel(
    provider?: AIProvider
): Promise<BaseChatModel> {
    const selected = provider || (process.env.AI_PROVIDER as AIProvider) || detectProvider();

    switch (selected) {
        case "openai": {
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                temperature: 0.8,
                maxTokens: 500,
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        case "gemini": {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            return new ChatGoogleGenerativeAI({
                model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
                temperature: 0.8,
                maxOutputTokens: 500,
                apiKey: process.env.GOOGLE_API_KEY,
            });
        }

        case "ollama": {
            // Ollama uses OpenAI-compatible API
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                model: process.env.OLLAMA_MODEL || "llama3",
                temperature: 0.8,
                maxTokens: 500,
                configuration: {
                    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
                },
                apiKey: "ollama", // Ollama doesn't need a real key
            });
        }

        default:
            throw new Error(`Unknown AI provider: ${selected}`);
    }
}
