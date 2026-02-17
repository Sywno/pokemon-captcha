// ============================================================
// Narrator Agent — Direct API call (bypasses LangChain model wrappers)
// ============================================================

import {
    BattleTurnContext,
    PERSONALITIES,
} from "./narrator-types";

// ── Helper: format context as a readable string ──────────────

function formatBattleContext(ctx: BattleTurnContext): string {
    const eff =
        ctx.result.effectiveness === "super_effective"
            ? "Super efficace !"
            : ctx.result.effectiveness === "not_effective"
                ? "Pas très efficace..."
                : "Efficacité normale";

    return `--- DONNÉES DU TOUR ${ctx.turnNumber} ---
Attaquant: ${ctx.attacker.name} (${ctx.attacker.types.join("/")}) — PV: ${ctx.attacker.currentHP}/${ctx.attacker.maxHP} — Camp: ${ctx.attacker.isPlayer ? "Joueur" : "Ennemi"}
Défenseur: ${ctx.defender.name} (${ctx.defender.types.join("/")}) — PV: ${ctx.defender.currentHP}/${ctx.defender.maxHP} — Camp: ${ctx.defender.isPlayer ? "Joueur" : "Ennemi"}
Attaque utilisée: ${ctx.move.name} (type: ${ctx.move.type}, puissance: ${ctx.move.power})
Résultat: ${ctx.result.damage} dégâts | Coup critique: ${ctx.result.isCritical ? "OUI" : "Non"} | ${eff} | KO: ${ctx.result.isKO ? "OUI" : "Non"}
Pokémon restants — Joueur: ${ctx.battleStatus.playerRemainingPokemon} | Ennemi: ${ctx.battleStatus.enemyRemainingPokemon}`;
}

// ── Gemini direct API call ───────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: userPrompt }],
            },
        ],
        systemInstruction: {
            parts: [{ text: systemPrompt }],
        },
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            // Gemini 2.5 "thinking" tokens eat into maxOutputTokens budget
            // Disable thinking for simple narration — no need for chain-of-thought
            thinkingConfig: {
                thinkingBudget: 0,
            },
        },
    };

    console.log("[Narrator] Calling Gemini API directly...");
    console.log("[Narrator] Model:", model);
    console.log("[Narrator] maxOutputTokens:", 500);

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Narrator] Gemini API error:", response.status, errText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("[Narrator] === RAW GEMINI RESPONSE ===");
    console.log("[Narrator] finishReason:", data.candidates?.[0]?.finishReason);
    console.log("[Narrator] usageMetadata:", JSON.stringify(data.usageMetadata, null, 2));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "...";

    console.log("[Narrator] content length:", text.length);
    console.log("[Narrator] content:", text);
    console.log("[Narrator] === END DEBUG ===");

    return text;
}

// ── OpenAI-compatible API call (OpenAI + Ollama) ─────────────

async function callOpenAICompatible(systemPrompt: string, userPrompt: string): Promise<string> {
    // Detect provider: Mistral > OpenAI > Ollama
    let baseUrl: string;
    let apiKey: string;
    let model: string;

    if (process.env.MISTRAL_API_KEY) {
        baseUrl = "https://api.mistral.ai/v1";
        apiKey = process.env.MISTRAL_API_KEY;
        model = process.env.MISTRAL_MODEL || "mistral-small-latest";
    } else if (process.env.OPENAI_API_KEY) {
        baseUrl = "https://api.openai.com/v1";
        apiKey = process.env.OPENAI_API_KEY;
        model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    } else {
        baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434") + "/v1";
        apiKey = "ollama";
        model = process.env.OLLAMA_MODEL || "llama3";
    }

    console.log(`[Narrator] Calling ${baseUrl} with model: ${model}`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "...";
}

// ── Main entry point ─────────────────────────────────────────

/**
 * Narrates a single battle turn with a direct API call.
 * No LangChain model wrapper — guaranteed maxTokens control.
 */
export async function narrateTurn(
    context: BattleTurnContext,
    personalityId: string = "sportscaster"
): Promise<string> {
    const personality = PERSONALITIES[personalityId] || PERSONALITIES.sportscaster;
    const battleData = formatBattleContext(context);
    // Pick 2 random catchphrases for variety (different each call)
    const shuffled = [...personality.catchphrases].sort(() => Math.random() - 0.5);
    const randomCatchphrases = shuffled.slice(0, 2);

    const systemPrompt = `${personality.systemPrompt}

PERSONNALITÉ: ${personality.name} (${personality.tone})
Emojis de style: ${personality.emoji}
Inspiration possible (ne pas copier texto, juste s'en inspirer): "${randomCatchphrases.join('" ou "')}"

RÈGLES STRICTES:
- Écris UN commentaire court (2-3 phrases COMPLÈTES).
- Base-toi UNIQUEMENT sur les données du tour ci-dessous.
- Mentionne les vrais noms des Pokémon et des attaques.
- Sois CRÉATIF et ORIGINAL — chaque commentaire doit être UNIQUE.
- Termine TOUJOURS tes phrases correctement.
- Réponds en français.`;

    const userPrompt = `Tour numéro ${context.turnNumber}. Commente ce tour de façon ORIGINALE:\n\n${battleData}`;

    // Route to the correct provider
    if (process.env.GOOGLE_API_KEY && !process.env.MISTRAL_API_KEY) {
        return callGemini(systemPrompt, userPrompt);
    } else {
        return callOpenAICompatible(systemPrompt, userPrompt);
    }
}
