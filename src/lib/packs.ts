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

async function getRandomPokemonByRarity(rarity: Rarity): Promise<Pokemon> {
    // In a real app we'd query DB by rarity.
    // With PokeAPI, we don't know rarity until we fetch stats.
    // Strategy: Fetch random ID (1-151), check rarity. If match, keep. If not, retry (up to limit).
    // Optimization: Just get ANY random one for now to avoid infinite loops, but "pretend" it matches or bias RNG?
    // Better: We defined rarity ranges by stats.
    // Let's brute force a little bit: Try 3 times to get matching rarity. If fail, return whatever we got.

    for (let i = 0; i < 5; i++) {
        const id = Math.floor(Math.random() * 151) + 1;
        const p = await getPokemonData(id);
        if (p.rarity === rarity) return p;

        // If we want Legendaries and keep getting Common, this is slow.
        // For 'LEGENDARY', we might know specific IDs (Mewtwo: 150, Birds: 144-146)
        if (rarity === 'LEGENDARY' && [144, 145, 146, 150, 151].includes(id)) return p;
    }

    // Fallback: just return a random one
    const id = Math.floor(Math.random() * 151) + 1;
    return await getPokemonData(id);
}
