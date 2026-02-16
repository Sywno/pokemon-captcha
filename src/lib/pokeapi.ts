import { Pokemon, PokemonStats, Rarity, Move } from '@/types';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Cache to avoid spamming the API
const cache: Record<number, Pokemon> = {};

export async function getPokemonData(id: number): Promise<Pokemon> {
    if (cache[id]) return cache[id];

    try {
        const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
        const data = await res.json();

        const stats: PokemonStats = {
            hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
            attack: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
            defense: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
            speed: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
        };

        const types = data.types.map((t: any) => t.type.name);

        // Fetch Moves (Random 4)
        const allMoves = data.moves;
        const selectedMoves: Move[] = [];

        if (allMoves.length > 0) {
            // Shuffle and pick 4
            const shuffled = allMoves.sort(() => 0.5 - Math.random());
            const candidates = shuffled.slice(0, 4);

            // We need to fetch details for these moves to get power/type
            // Use Promise.all
            await Promise.all(candidates.map(async (m: any) => {
                try {
                    const moveRes = await fetch(m.move.url);
                    const moveData = await moveRes.json();

                    // Only keep moves with power (damage dealing) for this simple game, 
                    // or default to 50 if null but valid.
                    // Actually, let's just take them. If power is null, it's a status move. 
                    // We'll handle null power in damage calc.

                    selectedMoves.push({
                        name: moveData.name.replace("-", " "),
                        type: moveData.type.name,
                        power: moveData.power || 0,
                        accuracy: moveData.accuracy || 100,
                        pp: moveData.pp || 15
                    });
                } catch (e) {
                    console.error("Failed to fetch move details", e);
                }
            }));
        }

        // Fallback if no moves
        if (selectedMoves.length === 0) {
            selectedMoves.push({ name: "Struggle", type: "normal", power: 50, accuracy: 100, pp: 35 });
        }


        const pokemon: Pokemon = {
            id: data.id,
            name: data.name,
            types: types,
            sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            stats: stats,
            baseStats: { ...stats },
            rarity: calculateRarity(stats),
            level: 1,
            moves: selectedMoves
        };

        cache[id] = pokemon;
        return pokemon;

    } catch (error) {
        console.error(`Error fetching pokemon ${id}:`, error);
        throw error;
    }
}

function calculateRarity(baseStats: PokemonStats): Rarity {
    const total = baseStats.hp + baseStats.attack + baseStats.defense + baseStats.speed;
    if (total < 320) return 'COMMON';
    if (total < 420) return 'RARE';
    if (total < 500) return 'SUPER_RARE';
    if (total < 580) return 'EPIC';
    return 'LEGENDARY';
}

export function calculateLevelStats(baseStats: PokemonStats, level: number): PokemonStats {
    // Simple multiplier: 10% increase per level approx
    // Formula: Stat = Base * (1 + 0.1 * (Level - 1))
    const multiplier = 1 + 0.1 * (level - 1);

    return {
        hp: Math.floor(baseStats.hp * multiplier),
        attack: Math.floor(baseStats.attack * multiplier),
        defense: Math.floor(baseStats.defense * multiplier),
        speed: Math.floor(baseStats.speed * multiplier),
    };
}
