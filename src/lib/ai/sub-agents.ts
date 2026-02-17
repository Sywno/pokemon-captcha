// ============================================================
// Sub-Agents — 3 specialized agents
// OPTIMIZED: pre-inject data, Voice Actor is direct function
// ============================================================

import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { BattleTurnContext, NarratorPersonality } from "./narrator-types";
import { createAnalystTools, createNarratorTools, createVoiceTools } from "./narrator-tools";

// ── Helper: compile a sub-agent graph ────────────────────────

function compileSubAgent(
    model: BaseChatModel,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: any[],
    systemPrompt: string
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelWithTools = (model as any).bindTools(tools);

    async function agentNode(state: typeof MessagesAnnotation.State) {
        const response = await modelWithTools.invoke(state.messages);
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

    return { graph, systemPrompt };
}

// ── Helper: wrap a compiled sub-agent as a tool ──────────────

function createSubAgentTool(
    name: string,
    description: string,
    compiledAgent: { graph: ReturnType<ReturnType<typeof StateGraph.prototype.addNode>["compile"]>; systemPrompt: string }
) {
    return tool(
        async ({ task }) => {
            console.log(`\n  ┌── 🤖 SUB-AGENT: ${name.toUpperCase()} ──────────`);
            console.log(`  │ Task: ${task.substring(0, 80)}...`);

            const result = await compiledAgent.graph.invoke({
                messages: [
                    new SystemMessage(compiledAgent.systemPrompt),
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

            console.log(`  │ Response: ${response.substring(0, 100)}...`);
            console.log(`  └──────────────────────────────────────\n`);
            return response;
        },
        {
            name,
            description,
            schema: z.object({
                task: z.string().describe("La tâche à déléguer au sous-agent"),
            }),
        }
    );
}

// ── Helper: format battle context as readable text ───────────

function formatContextForPrompt(ctx: BattleTurnContext): string {
    const eff = ctx.result.effectiveness === "super_effective"
        ? "Super efficace" : ctx.result.effectiveness === "not_effective"
            ? "Pas très efficace" : "Normal";
    return `TOUR ${ctx.turnNumber}:
- Attaquant: ${ctx.attacker.name} (${ctx.attacker.types.join("/")}) PV: ${ctx.attacker.currentHP}/${ctx.attacker.maxHP} [${ctx.attacker.isPlayer ? "Joueur" : "Ennemi"}]
- Défenseur: ${ctx.defender.name} (${ctx.defender.types.join("/")}) PV: ${ctx.defender.currentHP}/${ctx.defender.maxHP} [${ctx.defender.isPlayer ? "Joueur" : "Ennemi"}]
- Attaque: ${ctx.move.name} (type: ${ctx.move.type}, puissance: ${ctx.move.power})
- Résultat: ${ctx.result.damage} dégâts | Critique: ${ctx.result.isCritical ? "OUI" : "Non"} | ${eff} | KO: ${ctx.result.isKO ? "OUI" : "Non"}
- Restants — Joueur: ${ctx.battleStatus.playerRemainingPokemon} | Ennemi: ${ctx.battleStatus.enemyRemainingPokemon}${ctx.battleStatus.isOver ? ` | COMBAT TERMINÉ, Vainqueur: ${ctx.battleStatus.winner}` : ""}`;
}

// ═════════════════════════════════════════════════════════════
// CREATE ALL 3 SUB-AGENT TOOLS (OPTIMIZED)
// ═════════════════════════════════════════════════════════════

export function createSubAgentTools(
    model: BaseChatModel,
    context: BattleTurnContext,
    personality: NarratorPersonality,
    audioCapture: { value: string | null }
) {
    // Pre-format battle context for injection
    const contextText = formatContextForPrompt(context);

    // ── 🔍 Battle Analyst ────────────────────────────────────
    // OPTIMIZATION: Battle data is PRE-INJECTED in the system prompt
    // Tools are OPTIONAL enrichment (type matchup, pokemon lore)
    console.log("  ✅ Battle Analyst sub-agent created");
    console.log("     Tools: get_type_matchup, get_pokemon_lore (optional enrichment)");

    const analystAgent = compileSubAgent(
        model,
        createAnalystTools(context),
        `Tu es un analyste de combat Pokémon. Les données du tour sont déjà incluses ci-dessous.

DONNÉES DU TOUR :
${contextText}

Tu peux OPTIONNELLEMENT appeler :
- get_type_matchup pour une analyse d'efficacité détaillée
- get_pokemon_lore pour des anecdotes Pokédex

Mais tu as déjà TOUTES les données essentielles. Réponds directement avec un résumé analytique COURT (2-3 phrases) en français.`
    );

    const analystTool = createSubAgentTool(
        "battle_analyst",
        "Sous-agent d'analyse de combat. Délègue l'analyse du tour pour obtenir les faits.",
        analystAgent
    );

    // ── 🎙️ Narrator ─────────────────────────────────────────
    // OPTIMIZATION: Personality is PRE-INJECTED in the system prompt
    // get_battle_history is the only optional tool
    console.log("  ✅ Narrator sub-agent created");
    console.log("     Tools: get_battle_history (optional)");

    const shuffledCatchphrases = [...personality.catchphrases]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    const narratorAgent = compileSubAgent(
        model,
        createNarratorTools(personality),
        `Tu es un narrateur créatif de combat Pokémon.

TA PERSONNALITÉ :
- Nom: ${personality.name}
- Ton: ${personality.tone}
- Style: ${personality.systemPrompt}
- Inspirations: ${shuffledCatchphrases.join(" | ")}

Tu peux appeler get_battle_history pour voir les commentaires précédents et éviter les répétitions.

RÈGLES :
- 2-3 phrases COMPLÈTES max, en français
- CRÉATIF et ORIGINAL
- PAS d'emojis, PAS de markdown (**gras**, etc.)
- Mentionne les vrais noms des Pokémon
- Réponds UNIQUEMENT avec le commentaire, rien d'autre`
    );

    const narratorTool = createSubAgentTool(
        "narrator",
        "Sous-agent narrateur créatif. Délègue la rédaction du commentaire avec l'analyse du tour.",
        narratorAgent
    );

    // ── 🔊 Voice Actor ──────────────────────────────────────
    // OPTIMIZATION: NO inner LLM — direct TTS function call
    // Still presented as a sub-agent tool for the architecture
    console.log("  ✅ Voice Actor sub-agent created");
    console.log("     Tools: speak_commentary (direct, no LLM)");

    const voiceTools = createVoiceTools(audioCapture);
    const speakFn = voiceTools[0]; // the speak_commentary tool

    const voiceTool = tool(
        async ({ task }) => {
            console.log(`\n  ┌── 🤖 SUB-AGENT: VOICE_ACTOR ──────────`);
            console.log(`  │ Task: ${task.substring(0, 80)}...`);

            // Direct TTS — no LLM needed for this
            const result = await speakFn.invoke({ text: task });

            console.log(`  │ Response: ${String(result).substring(0, 100)}...`);
            console.log(`  └──────────────────────────────────────\n`);
            return String(result);
        },
        {
            name: "voice_actor",
            description: "Sous-agent de synthèse vocale. Délègue le commentaire final pour la conversion text-to-speech.",
            schema: z.object({
                task: z.string().describe("Le commentaire à convertir en audio vocal"),
            }),
        }
    );

    return [analystTool, narratorTool, voiceTool];
}
