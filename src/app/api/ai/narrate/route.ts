// ============================================================
// API Route — POST /api/ai/narrate
// Orchestrator: calls the LangGraph narrator agent
// Returns: { commentary: string, audio: string | null }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { narrateTurn } from "@/lib/ai/narrator-agent";
import { BattleTurnContext } from "@/lib/ai/narrator-types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { battleContext, personalityId } = body as {
            battleContext: BattleTurnContext;
            personalityId: string;
        };

        // Validate required fields
        if (!battleContext || !battleContext.attacker || !battleContext.defender) {
            return NextResponse.json(
                { error: "Missing or invalid battleContext" },
                { status: 400 }
            );
        }

        // Check that at least one AI provider is configured
        const hasProvider =
            process.env.OPENAI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.MISTRAL_API_KEY ||
            process.env.OLLAMA_BASE_URL;

        if (!hasProvider) {
            return NextResponse.json(
                {
                    error: "No AI provider configured. Set MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, or OLLAMA_BASE_URL in .env.local",
                },
                { status: 503 }
            );
        }

        // Run the LangGraph narrator agent
        // The agent autonomously calls its tools (battle context, personality,
        // type matchup, pokemon lore, battle history, TTS) and returns results
        console.log("[API /narrate] Starting narrator agent...");
        const result = await narrateTurn(
            battleContext,
            personalityId || "sportscaster"
        );

        console.log("[API /narrate] Agent complete:", {
            commentary: result.commentary?.substring(0, 80) + "...",
            hasAudio: !!result.audio,
        });

        return NextResponse.json({
            commentary: result.commentary,
            audio: result.audio,
        });
    } catch (error: unknown) {
        console.error("[Narrator API Error]", error);

        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Narrator failed: ${message}` },
            { status: 500 }
        );
    }
}
