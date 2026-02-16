import { Pokemon, Move } from "@/types";

// Type effectiveness chart (simplified for MVP)
const TYPE_CHART: Record<string, string[]> = {
    normal: ["rock", "ghost"],
    fire: ["grass", "ice", "bug", "steel"],
    water: ["fire", "ground", "rock"],
    grass: ["water", "ground", "rock"],
    electric: ["water", "flying"],
    ice: ["grass", "ground", "flying", "dragon"],
    fighting: ["normal", "ice", "rock", "dark", "steel"],
    poison: ["grass", "fairy"],
    ground: ["fire", "electric", "poison", "rock", "steel"],
    flying: ["grass", "fighting", "bug"],
    psychic: ["fighting", "poison"],
    bug: ["grass", "psychic", "dark"],
    rock: ["fire", "ice", "flying", "bug"],
    ghost: ["psychic", "ghost"],
    dragon: ["dragon"],
    steel: ["ice", "rock", "fairy"],
    dark: ["psychic", "ghost"],
    fairy: ["fighting", "dragon", "dark"],
};

// Returns multiplier (1, 2, 0.5)
export function getTypeEffectiveness(attackerType: string, defenderTypes: string[]): number {
    let multiplier = 1;
    const strongAgainst = TYPE_CHART[attackerType] || [];

    // Simple logic: if attacker type is strong against any defender type, 2x.
    // We can add "Weak Against" later for 0.5x

    if (defenderTypes.some(t => strongAgainst.includes(t))) {
        multiplier = 2;
    }

    return multiplier;
}

export interface BattleState {
    playerActive: Pokemon;
    enemyActive: Pokemon;
    playerTeam: Pokemon[];
    enemyTeam: Pokemon[];
    log: string[];
    turn: number;
    isPlayerTurn: boolean;
    winner: 'player' | 'enemy' | null;
}

export function calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move): { damage: number; isCrit: boolean; multiplier: number } {
    // Classic-ish formula
    // Damage = (((2 * Level / 5 + 2) * Power * A / D) / 50 + 2) * Modifier

    const movePower = move.power || 50;
    const level = attacker.level;
    const attack = attacker.stats.attack;
    const defense = defender.stats.defense;

    const baseDamage = (((2 * level / 5 + 2) * movePower * (attack / defense)) / 50) + 2;

    // Random variance 0.85 - 1.0
    const random = (Math.floor(Math.random() * 16) + 85) / 100;

    // Crit chance (fixed 6.25%)
    const isCrit = Math.random() < 0.0625;
    const critMult = isCrit ? 1.5 : 1;

    // Type effectiveness (Use move type)
    const typeMult = getTypeEffectiveness(move.type, defender.types);

    // STAB
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;

    const damage = Math.floor(baseDamage * typeMult * critMult * stab * random);

    return { damage, isCrit, multiplier: typeMult };
}
