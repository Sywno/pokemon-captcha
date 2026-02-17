// ============================================================
// 🧠 Master Orchestrator — Deterministic Pipeline
// Calls 3 sub-agents in fixed order: Analyst → Narrator → Voice
// Each sub-agent is a real LLM agent with its own tools
// ============================================================

import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
    BattleTurnContext,
    PERSONALITIES,
    NarratorResult,
} from "./narrator-types";
import { createNarratorModel } from "./model-factory";
import { createAnalystTools, createNarratorTools, pushToHistory } from "./narrator-tools";
import { speakCommentary } from "./narrator-tts";

// ── Helper: compile & run a sub-agent ────────────────────────

async function runSubAgent(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: any[],
    systemPrompt: string,
    task: string
): Promise<string> {
    console.log(`\n  ┌── 🤖 SUB-AGENT: ${name.toUpperCase()} ──────────`);
    console.log(`  │ Task: ${task.substring(0, 100)}...`);

    const modelWithTools = model.bindTools(tools);

    async function agentNode(state: typeof MessagesAnnotation.State) {
        const response = await modelWithTools.invoke(state.messages);
        const aiMsg = response as AIMessage;
        if (aiMsg.tool_calls?.length) {
            console.log(`  │ Tool calls: ${aiMsg.tool_calls.map((tc: { name: string }) => tc.name).join(", ")}`);
        }
        return { messages: [response] };
    }

    function shouldContinue(state: typeof MessagesAnnotation.State) {
        const last = state.messages[state.messages.length - 1] as AIMessage;
        return (last.tool_calls && last.tool_calls.length > 0) ? "tools" : "__end__";
    }

    const graph = new StateGraph(MessagesAnnotation)
        .addNode("agent", agentNode)
        .addNode("tools", new ToolNode(tools))
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent")
        .compile();

    const result = await graph.invoke({
        messages: [
            new SystemMessage(systemPrompt),
            new HumanMessage(task),
        ],
    });

    // Extract last AI text response
    let response = "Pas de réponse.";
    for (let i = result.messages.length - 1; i >= 0; i--) {
        const msg = result.messages[i];
        if (msg._getType() === "ai" && typeof msg.content === "string" && msg.content.trim()) {
            const aiMsg = msg as AIMessage;
            if (!aiMsg.tool_calls?.length) {
                response = msg.content.trim();
                break;
            }
        }
    }

    console.log(`  │ Response: ${response.substring(0, 120)}...`);
    console.log(`  └──────────────────────────────────────\n`);
    return response;
}

// ── Context formatter ────────────────────────────────────────

function formatContext(ctx: BattleTurnContext): string {
    const eff = ctx.result.effectiveness === "super_effective"
        ? "Super efficace" : ctx.result.effectiveness === "not_effective"
            ? "Pas très efficace" : "Normal";
    return `TOUR ${ctx.turnNumber}:
Attaquant: ${ctx.attacker.name} (${ctx.attacker.types.join("/")}) PV: ${ctx.attacker.currentHP}/${ctx.attacker.maxHP} [${ctx.attacker.isPlayer ? "Joueur" : "Ennemi"}]
Défenseur: ${ctx.defender.name} (${ctx.defender.types.join("/")}) PV: ${ctx.defender.currentHP}/${ctx.defender.maxHP} [${ctx.defender.isPlayer ? "Joueur" : "Ennemi"}]
Attaque: ${ctx.move.name} (type: ${ctx.move.type}, puissance: ${ctx.move.power})
Résultat: ${ctx.result.damage} dégâts | Critique: ${ctx.result.isCritical ? "OUI" : "Non"} | ${eff} | KO: ${ctx.result.isKO ? "OUI" : "Non"}
Restants — Joueur: ${ctx.battleStatus.playerRemainingPokemon} | Ennemi: ${ctx.battleStatus.enemyRemainingPokemon}${ctx.battleStatus.isOver ? ` | TERMINÉ → ${ctx.battleStatus.winner}` : ""}`;
}

// ═════════════════════════════════════════════════════════════
// PUBLIC ENTRY POINT
// ═════════════════════════════════════════════════════════════

export async function orchestrate(
    context: BattleTurnContext,
    personalityId: string = "sportscaster"
): Promise<NarratorResult> {
    const personality = PERSONALITIES[personalityId] || PERSONALITIES.sportscaster;
    const contextText = formatContext(context);
    const shuffledCatchphrases = [...personality.catchphrases]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    console.log("\n" + "=".repeat(70));
    console.log("🧠 MASTER ORCHESTRATOR — PIPELINE START");
    console.log(`   Tour: ${context.turnNumber} | Personnalité: ${personalityId}`);
    console.log("=".repeat(70));

    // Create model once, shared by all sub-agents
    const model = await createNarratorModel();

    // ── STEP 1: Battle Analyst ───────────────────────────────
    console.log("\n📤 STEP 1/3 → Battle Analyst");

    const analysis = await runSubAgent(
        "Battle Analyst",
        model,
        createAnalystTools(context),
        `Tu es un analyste de combat Pokémon. Voici les données du tour :

${contextText}

Tu peux appeler get_type_matchup ou get_pokemon_lore si pertinent.
Réponds avec un résumé analytique COURT (2-3 phrases factuelles) en français.`,
        `Analyse ce tour de combat.`
    );

    // ── STEP 2: Narrator ─────────────────────────────────────
    console.log("📤 STEP 2/3 → Narrator");

    const commentary = await runSubAgent(
        "Narrator",
        model,
        createNarratorTools(personality),
        `Tu es un narrateur créatif de combat Pokémon.

TA PERSONNALITÉ :
- Nom: ${personality.name} ${personality.emoji}
- Ton: ${personality.tone}
- Style: ${personality.systemPrompt}
- Inspirations: ${shuffledCatchphrases.join(" | ")}

Tu peux appeler get_battle_history pour éviter les répétitions.

RÈGLES :
- 2-3 phrases COMPLÈTES max, en français
- CRÉATIF et ORIGINAL
- PAS d'emojis, PAS de markdown
- Mentionne les vrais noms des Pokémon et attaques
- Réponds UNIQUEMENT avec le commentaire, rien d'autre`,
        `Voici l'analyse du tour :\n${analysis}\n\nÉcris un commentaire captivant basé sur cette analyse.`
    );

    // Clean markdown from commentary
    const cleanCommentary = commentary
        .replace(/\*\*[^*]*\*\*\s*:?\s*\n*/g, "")
        .replace(/^[""]|[""]$/g, "")
        .replace(/^\n+|\n+$/g, "")
        .trim();

    // ── STEP 3: Voice Actor (direct TTS) ─────────────────────
    console.log("📤 STEP 3/3 → Voice Actor");
    console.log(`  ┌── 🤖 SUB-AGENT: VOICE_ACTOR ──────────`);
    console.log(`  │ Text: ${cleanCommentary.substring(0, 80)}...`);

    const audio = await speakCommentary(cleanCommentary);

    console.log(`  │ Result: ${audio ? `Audio ${Math.round(audio.length * 0.75 / 1024)} Ko` : "No TTS key"}`);
    console.log(`  └──────────────────────────────────────\n`);

    // ── DONE ─────────────────────────────────────────────────
    console.log("=".repeat(70));
    console.log("🎯 FINAL RESULT");
    console.log("=".repeat(70));
    console.log(`Commentary: ${cleanCommentary}`);
    console.log(`Audio: ${audio ? "yes" : "no"}`);
    console.log("=".repeat(70) + "\n");

    pushToHistory(cleanCommentary);
    return { commentary: cleanCommentary, audio };
}
