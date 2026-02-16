import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Pokemon, UserInventory } from '@/types';
import { calculateLevelStats } from './pokeapi';

interface GameState extends UserInventory {
    // Actions
    addMoney: (amount: number) => void;
    spendMoney: (amount: number) => boolean;
    addPokemon: (pokemonList: Pokemon[]) => void;
    getPokemonCount: (id: number) => number;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            ownedPokemon: {},
            pokemonList: [],
            money: 500, // Starter cash
            totalPacksOpened: 0,
            battlesWon: 0,

            addMoney: (amount) => set((state) => ({ money: state.money + amount })),

            spendMoney: (amount) => {
                const { money } = get();
                if (money < amount) return false;
                set({ money: money - amount });
                return true;
            },

            addPokemon: (newPokemon) => set((state) => {
                const updatedOwned = { ...state.ownedPokemon };
                let updatedList = [...state.pokemonList];

                newPokemon.forEach(p => {
                    const currentCount = updatedOwned[p.id] || 0;
                    updatedOwned[p.id] = currentCount + 1;

                    // Leveling Logic: 
                    // If we already have this pokemon, we need to find it and upgrade it?
                    // The prompt says "Level 1 -> 1 copy", "Level 2 -> 2 copies", "Level 3 -> 4 copies".
                    // This implies the LEVEL is derived from the TOTAL COUNT.
                    // So we don't necessarily store "Level" in the object, or we update it dynamically.
                    // However, for the UI, it's easier if the list contains the leveled-up version.

                    // Check if we already have this pokemon in our "active" list (unique by ID for the display?)
                    // Usually in these games, you have ONE instance of Pikachu that gets stronger.
                    const existingIndex = updatedList.findIndex(existing => existing.id === p.id);

                    if (existingIndex > -1) {
                        // Update existing
                        const count = updatedOwned[p.id];
                        // Level formula: 
                        // 1 copy = lvl 1
                        // 2 copies = lvl 2
                        // 4 copies = lvl 3
                        // 8 copies = lvl 4
                        // Formula: Log2(count) + 1 ? 
                        // 1 -> 0+1=1. 2-> 1+1=2. 4->2+1=3. 8->3+1=4.
                        // Yes, Math.floor(Math.log2(count)) + 1

                        const newLevel = Math.floor(Math.log2(count)) + 1;
                        const existing = updatedList[existingIndex];

                        if (newLevel > existing.level) {
                            // Update stats
                            // We need base stats. We should store base stats in the pokemon object.
                            const newStats = calculateLevelStats(existing.baseStats, newLevel);
                            updatedList[existingIndex] = { ...existing, level: newLevel, stats: newStats };
                        }
                    } else {
                        // Add new
                        updatedList.push({ ...p, level: 1, obtainedAt: new Date().toISOString() });
                    }
                });

                return {
                    ownedPokemon: updatedOwned,
                    pokemonList: updatedList,
                    totalPacksOpened: state.totalPacksOpened + 1
                };
            }),

            getPokemonCount: (id) => get().ownedPokemon[id] || 0,
        }),
        {
            name: 'pokemon-game-storage',
        }
    )
);
