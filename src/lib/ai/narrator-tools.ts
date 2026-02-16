// ============================================================
// Narrator Tools — Zod-validated LangChain tools
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BattleTurnContext, PERSONALITIES, NarratorPersonality } from "./narrator-types";

/**
 * Creates the `get_battle_context` tool bound to a specific turn's data.
 */
export function createBattleContextTool(context: BattleTurnContext) {
    return tool(
        async () => {
            return JSON.stringify({
                turn: context.turnNumber,
                attacker: {
                    name: context.attacker.name,
                    types: context.attacker.types,
                    hp: `${context.attacker.currentHP}/${context.attacker.maxHP}`,
                    side: context.attacker.isPlayer ? "player" : "enemy",
                },
                defender: {
                    name: context.defender.name,
                    types: context.defender.types,
                    hp: `${context.defender.currentHP}/${context.defender.maxHP}`,
                    side: context.defender.isPlayer ? "player" : "enemy",
                },
                move: {
                    name: context.move.name,
                    type: context.move.type,
                    power: context.move.power,
                },
                result: {
                    damage: context.result.damage,
                    critical: context.result.isCritical,
                    effectiveness: context.result.effectiveness,
                    ko: context.result.isKO,
                },
                battle_status: {
                    player_remaining: context.battleStatus.playerRemainingPokemon,
                    enemy_remaining: context.battleStatus.enemyRemainingPokemon,
                    is_over: context.battleStatus.isOver,
                    winner: context.battleStatus.winner,
                },
            });
        },
        {
            name: "get_battle_context",
            description:
                "Retrieves the structured data for the current battle turn: who attacked, who defended, which move was used, the damage dealt, type effectiveness, critical hit status, and KO status. ALWAYS call this tool before writing commentary.",
            schema: z.object({}),
        }
    );
}

/**
 * Creates the `get_personality` tool bound to a specific narrator personality.
 */
export function createPersonalityTool(personality: NarratorPersonality) {
    return tool(
        async () => {
            return JSON.stringify({
                name: personality.name,
                tone: personality.tone,
                system_instructions: personality.systemPrompt,
                catchphrases: personality.catchphrases,
                emoji: personality.emoji,
            });
        },
        {
            name: "get_personality",
            description:
                "Retrieves the narrator's personality configuration: tone, style, catchphrases, and system instructions. ALWAYS call this tool to know how to write your commentary.",
            schema: z.object({}),
        }
    );
}
