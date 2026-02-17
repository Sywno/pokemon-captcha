// ============================================================
// API Route — POST /api/ai/narrate
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
                    error: "No AI provider configured. Set OPENAI_API_KEY, GOOGLE_API_KEY, or OLLAMA_BASE_URL in .env.local",
                },
                { status: 503 }
            );
        }

        // Run the narrator agent
        console.log("[API /narrate] Calling narrateTurn...");
        const commentary = await narrateTurn(
            battleContext,
            personalityId || "sportscaster"
        );

        console.log("[API /narrate] === RESULT ===");
        console.log("[API /narrate] commentary length:", commentary.length);
        console.log("[API /narrate] commentary:", commentary);

        return NextResponse.json({ commentary });
    } catch (error: unknown) {
        console.error("[Narrator API Error]", error);

        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Narrator failed: ${message}` },
            { status: 500 }
        );
    }
}
