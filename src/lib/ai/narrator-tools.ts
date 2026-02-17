// ============================================================
// Narrator Tools — Organized by sub-agent responsibility
// 3 groups: Battle Analyst, Narrator, Voice Actor
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BattleTurnContext, NarratorPersonality } from "./narrator-types";
import { speakCommentary } from "./narrator-tts";

// ── Type chart ───────────────────────────────────────────────

const TYPE_CHART: Record<string, string[]> = {
    normal: ["rock", "ghost"], fire: ["grass", "ice", "bug", "steel"],
    water: ["fire", "ground", "rock"], grass: ["water", "ground", "rock"],
    electric: ["water", "flying"], ice: ["grass", "ground", "flying", "dragon"],
    fighting: ["normal", "ice", "rock", "dark", "steel"], poison: ["grass", "fairy"],
    ground: ["fire", "electric", "poison", "rock", "steel"],
    flying: ["grass", "fighting", "bug"], psychic: ["fighting", "poison"],
    bug: ["grass", "psychic", "dark"], rock: ["fire", "ice", "flying", "bug"],
    ghost: ["psychic", "ghost"], dragon: ["dragon"],
    steel: ["ice", "rock", "fairy"], dark: ["psychic", "ghost"],
    fairy: ["fighting", "dragon", "dark"],
};

const TYPE_FR: Record<string, string> = {
    normal: "Normal", fire: "Feu", water: "Eau", grass: "Plante",
    electric: "Électrik", ice: "Glace", fighting: "Combat", poison: "Poison",
    ground: "Sol", flying: "Vol", psychic: "Psy", bug: "Insecte",
    rock: "Roche", ghost: "Spectre", dragon: "Dragon", steel: "Acier",
    dark: "Ténèbres", fairy: "Fée",
};

// ── Battle history (in-memory) ───────────────────────────────

const commentaryHistory: string[] = [];
export function pushToHistory(c: string) {
    commentaryHistory.push(c);
    if (commentaryHistory.length > 10) commentaryHistory.shift();
}

// ═════════════════════════════════════════════════════════════
// 🔍 BATTLE ANALYST TOOLS
// ═════════════════════════════════════════════════════════════

export function createAnalystTools(context: BattleTurnContext) {
    const getBattleContext = tool(
        async () => {
            console.log("  [🔍 Analyst Tool] get_battle_context");
            const eff = context.result.effectiveness === "super_effective"
                ? "Super efficace !" : context.result.effectiveness === "not_effective"
                    ? "Pas très efficace..." : "Efficacité normale";
            return JSON.stringify({
                tour: context.turnNumber,
                attaquant: {
                    nom: context.attacker.name,
                    types: context.attacker.types,
                    pv: `${context.attacker.currentHP}/${context.attacker.maxHP}`,
                    camp: context.attacker.isPlayer ? "joueur" : "ennemi",
                },
                defenseur: {
                    nom: context.defender.name,
                    types: context.defender.types,
                    pv: `${context.defender.currentHP}/${context.defender.maxHP}`,
                    camp: context.defender.isPlayer ? "joueur" : "ennemi",
                },
                attaque: { nom: context.move.name, type: context.move.type, puissance: context.move.power },
                resultat: {
                    degats: context.result.damage, coup_critique: context.result.isCritical,
                    efficacite: eff, ko: context.result.isKO,
                },
                statut: {
                    pokemon_joueur_restants: context.battleStatus.playerRemainingPokemon,
                    pokemon_ennemi_restants: context.battleStatus.enemyRemainingPokemon,
                    termine: context.battleStatus.isOver, vainqueur: context.battleStatus.winner,
                },
            });
        },
        {
            name: "get_battle_context",
            description: "Récupère toutes les données du tour actuel (attaquant, défenseur, dégâts, KO, etc.)",
            schema: z.object({}),
        }
    );

    const getTypeMatchup = tool(
        async ({ attackType, defenderTypes }) => {
            console.log("  [🔍 Analyst Tool] get_type_matchup:", attackType, "vs", defenderTypes);
            const strong = TYPE_CHART[attackType.toLowerCase()] || [];
            const atkFr = TYPE_FR[attackType.toLowerCase()] || attackType;
            const defFr = defenderTypes.map((t: string) => TYPE_FR[t.toLowerCase()] || t);
            const effective = defenderTypes.filter((t: string) => strong.includes(t.toLowerCase()));
            if (effective.length > 0) {
                return `${atkFr} est SUPER EFFICACE contre ${defFr.join("/")} ! Dégâts x2.`;
            }
            return `${atkFr} a une efficacité normale contre ${defFr.join("/")}.`;
        },
        {
            name: "get_type_matchup",
            description: "Explique l'efficacité d'un type d'attaque contre les types du défenseur.",
            schema: z.object({
                attackType: z.string().describe("Type de l'attaque (ex: fire)"),
                defenderTypes: z.array(z.string()).describe("Types du défenseur (ex: ['grass'])"),
            }),
        }
    );

    const getPokemonLore = tool(
        async ({ pokemonName }) => {
            console.log("  [🔍 Analyst Tool] get_pokemon_lore:", pokemonName);
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
                if (!res.ok) return `Aucune info sur ${pokemonName}.`;
                const data = await res.json();
                const fr = data.flavor_text_entries?.find((e: { language: { name: string } }) => e.language.name === "fr");
                const en = data.flavor_text_entries?.find((e: { language: { name: string } }) => e.language.name === "en");
                const text = (fr?.flavor_text || en?.flavor_text || "").replace(/[\n\r\f]/g, " ");
                const genus = data.genera?.find((g: { language: { name: string } }) => g.language.name === "fr")?.genus || "";
                return `Pokédex — ${pokemonName}: ${genus}. ${text}`;
            } catch {
                return `Impossible de récupérer les infos sur ${pokemonName}.`;
            }
        },
        {
            name: "get_pokemon_lore",
            description: "Récupère l'entrée Pokédex d'un Pokémon depuis la PokeAPI.",
            schema: z.object({
                pokemonName: z.string().describe("Nom du Pokémon en anglais (ex: pikachu)"),
            }),
        }
    );

    return [getBattleContext, getTypeMatchup, getPokemonLore];
}

// ═════════════════════════════════════════════════════════════
// 🎙️ NARRATOR TOOLS
// ═════════════════════════════════════════════════════════════

export function createNarratorTools(personality: NarratorPersonality) {
    const getPersonality = tool(
        async () => {
            console.log("  [🎙️ Narrator Tool] get_personality");
            const shuffled = [...personality.catchphrases].sort(() => Math.random() - 0.5);
            return JSON.stringify({
                nom: personality.name, ton: personality.tone,
                instructions: personality.systemPrompt,
                catchphrases: shuffled.slice(0, 3), emoji: personality.emoji,
            });
        },
        {
            name: "get_personality",
            description: "Récupère la personnalité du narrateur (ton, style, catchphrases).",
            schema: z.object({}),
        }
    );

    const getBattleHistory = tool(
        async () => {
            console.log("  [🎙️ Narrator Tool] get_battle_history, size:", commentaryHistory.length);
            if (commentaryHistory.length === 0) return "Aucun commentaire précédent.";
            const recent = commentaryHistory.slice(-3);
            return `Derniers commentaires:\n${recent.map((c, i) => `${i + 1}. "${c}"`).join("\n")}\nÉVITE de répéter.`;
        },
        {
            name: "get_battle_history",
            description: "Récupère les 3 derniers commentaires pour éviter les répétitions.",
            schema: z.object({}),
        }
    );

    return [getPersonality, getBattleHistory];
}

// ═════════════════════════════════════════════════════════════
// 🔊 VOICE ACTOR TOOLS
// ═════════════════════════════════════════════════════════════

export function createVoiceTools(audioCapture: { value: string | null }) {
    const speakTool = tool(
        async ({ text }) => {
            console.log("  [🔊 Voice Tool] speak_commentary, length:", text.length);
            const audio = await speakCommentary(text);
            audioCapture.value = audio;
            if (audio) {
                const kb = Math.round(audio.length * 0.75 / 1024);
                return `Audio généré avec succès (${kb} Ko).`;
            }
            return "TTS non disponible (pas de clé ElevenLabs).";
        },
        {
            name: "speak_commentary",
            description: "Convertit le texte en audio vocal via ElevenLabs. N'envoyer que du texte sans emojis.",
            schema: z.object({
                text: z.string().describe("Le commentaire à convertir en audio"),
            }),
        }
    );

    return [speakTool];
}
