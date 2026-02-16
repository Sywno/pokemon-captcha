import { Pack, Pokemon, Rarity } from "@/types";
import { getPokemonData } from "./pokeapi";

export const PACKS: Pack[] = [
    {
        id: "common",
        name: "Pack Commun",
        price: 0,
        description: "Un pack basique pour débuter. Contient principalement des Pokémon communs.",
        dropRates: { COMMON: 80, RARE: 15, SUPER_RARE: 4, EPIC: 1, LEGENDARY: 0 },
        imageColor: "bg-gray-400",
    },
    {
        id: "rare",
        name: "Pack Rare",
        price: 200,
        description: "De meilleures chances d'obtenir des Pokémon rares.",
        dropRates: { COMMON: 40, RARE: 40, SUPER_RARE: 15, EPIC: 4, LEGENDARY: 1 },
        imageColor: "bg-blue-500",
    },
    {
        id: "epic",
        name: "Pack Épique",
        price: 500,
        description: "Pour les collectionneurs sérieux. Forte chance d'épiques.",
        dropRates: { COMMON: 10, RARE: 20, SUPER_RARE: 40, EPIC: 25, LEGENDARY: 5 },
        imageColor: "bg-purple-600",
    },
    {
        id: "legendary",
        name: "Pack Légendaire",
        price: 1000,
        description: "Le pack ultime. La seule façon fiable d'avoir des légendaires.",
        dropRates: { COMMON: 0, RARE: 10, SUPER_RARE: 30, EPIC: 40, LEGENDARY: 20 },
        imageColor: "bg-yellow-500",
    },
];

export async function openPack(packId: string): Promise<Pokemon[]> {
    const pack = PACKS.find(p => p.id === packId);
    if (!pack) throw new Error("Pack not found");

    // Logic: 5 cards per pack
    const results: Pokemon[] = [];

    for (let i = 0; i < 5; i++) {
        const rarity = pickRarity(pack.dropRates);
        const pokemon = await getRandomPokemonByRarity(rarity);
        results.push(pokemon);
    }

    return results;
}

function pickRarity(rates: Record<Rarity, number>): Rarity {
    const rand = Math.random() * 100;
    let cumulative = 0;

    // Order matters? Iterate entries
    // rates sum should be approx 100
    for (const [rarity, rate] of Object.entries(rates)) {
        cumulative += rate;
        if (rand < cumulative) return rarity as Rarity;
    }
    return 'COMMON'; // Fallback
}

// Predefined Gen 1 Pokémon ID pools by rarity (based on base stat totals)
// COMMON: total < 320 | RARE: 320-419 | SUPER_RARE: 420-499 | EPIC: 500-579 | LEGENDARY: 580+
const RARITY_POOLS: Record<Rarity, number[]> = {
    COMMON: [
        10, 11, 13, 14, 16, 17, 19, 20, 21, 23, 27, 29, 32, 35, 39, 41, 43,
        46, 48, 50, 52, 54, 56, 58, 60, 66, 69, 72, 74, 79, 81, 84, 86, 88,
        90, 92, 96, 98, 100, 102, 104, 109, 111, 116, 118, 120, 129, 133,
        1, 4, 7, 25, 37, 44, 70, 147
    ],
    RARE: [
        2, 5, 8, 12, 15, 18, 22, 24, 26, 28, 30, 33, 36, 38, 40, 42, 47,
        49, 51, 53, 55, 57, 61, 64, 67, 73, 75, 77, 80, 82, 85, 87, 89,
        91, 93, 97, 99, 101, 105, 106, 107, 108, 110, 112, 113, 114, 117,
        119, 121, 122, 123, 124, 125, 126, 127, 128, 132, 137, 138, 139, 140, 141, 148
    ],
    SUPER_RARE: [
        3, 6, 9, 31, 34, 45, 62, 65, 68, 71, 76, 78, 83, 94, 95, 103,
        115, 130, 131, 134, 135, 136, 142, 143, 149
    ],
    EPIC: [
        59, 63, 38, 73, 76, 131, 142, 143, 149
    ],
    LEGENDARY: [144, 145, 146, 150, 151]
};

async function getRandomPokemonByRarity(rarity: Rarity): Promise<Pokemon> {
    const pool = RARITY_POOLS[rarity];
    const id = pool[Math.floor(Math.random() * pool.length)];
    const pokemon = await getPokemonData(id);
    // Return a copy so we don't mutate the cache, and override rarity
    return { ...pokemon, rarity };
}
