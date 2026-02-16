export type Rarity = 'COMMON' | 'RARE' | 'SUPER_RARE' | 'EPIC' | 'LEGENDARY';

export interface PokemonStats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
}

export interface Move {
    name: string;
    type: string;
    power: number;
    accuracy: number;
    pp: number;
}

export interface Pokemon {
    id: number;
    name: string;
    types: string[];
    sprite: string;
    stats: PokemonStats;
    baseStats: PokemonStats; // Original stats for reference
    rarity: Rarity;
    level: number;
    moves: Move[];
    obtainedAt?: string; // Date string
}

export interface Pack {
    id: string;
    name: string;
    price: number;
    description: string;
    dropRates: Record<Rarity, number>;
    imageColor: string; // Tailwinc color class prefix
}

export interface UserInventory {
    ownedPokemon: { [id: number]: number }; // ID -> Count
    pokemonList: Pokemon[]; // Instantiated pokemon with current levels
    money: number;
    totalPacksOpened: number;
    battlesWon: number;
}
