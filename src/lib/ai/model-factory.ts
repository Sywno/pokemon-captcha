// ============================================================
// Model Factory — Creates LangChain chat models for any provider
// Supports: Mistral, OpenAI, Gemini, Ollama
// ============================================================

import { BaseChatModel } from "@langchain/core/language_models/chat_models";

type AIProvider = "mistral" | "openai" | "gemini" | "ollama";

function detectProvider(): AIProvider {
    if (process.env.MISTRAL_API_KEY) return "mistral";
    if (process.env.OPENAI_API_KEY) return "openai";
    if (process.env.GOOGLE_API_KEY) return "gemini";
    return "ollama";
}

/**
 * Creates a LangChain chat model for the narrator agent.
 * Auto-detects provider from env vars, or use explicit provider.
 */
export async function createNarratorModel(
    provider?: AIProvider
): Promise<BaseChatModel> {
    const selected = provider || (process.env.AI_PROVIDER as AIProvider) || detectProvider();

    console.log(`[ModelFactory] Using provider: ${selected}`);

    switch (selected) {
        case "mistral": {
            // Mistral uses OpenAI-compatible API
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                model: process.env.MISTRAL_MODEL || "mistral-small-latest",
                apiKey: process.env.MISTRAL_API_KEY,
                configuration: {
                    baseURL: "https://api.mistral.ai/v1",
                },
                temperature: 0.8,
                maxTokens: 500,
            });
        }
        case "openai": {
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                apiKey: process.env.OPENAI_API_KEY,
                temperature: 0.8,
                maxTokens: 500,
            });
        }
        case "gemini": {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            return new ChatGoogleGenerativeAI({
                model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
                apiKey: process.env.GOOGLE_API_KEY,
                temperature: 0.8,
                maxOutputTokens: 500,
            });
        }
        case "ollama": {
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                model: process.env.OLLAMA_MODEL || "llama3",
                configuration: {
                    baseURL: (process.env.OLLAMA_BASE_URL || "http://localhost:11434") + "/v1",
                },
                apiKey: "ollama",
                temperature: 0.8,
                maxTokens: 500,
            });
        }
        default:
            throw new Error(`Unknown AI provider: ${selected}`);
    }
}
