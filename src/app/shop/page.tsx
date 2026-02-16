"use client";

import { PACKS, openPack } from "@/lib/packs";
import { useGameStore } from "@/lib/store";
import { PackCard } from "../../components/game/PackCard";
import { PokemonCard } from "../../components/game/PokemonCard";
import { useState, useEffect } from "react";
import { Pokemon } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ShopPage() {
    const { money, spendMoney, addPokemon } = useGameStore();
    const [mounted, setMounted] = useState(false);
    const [opening, setOpening] = useState(false);
    const [openedPokemon, setOpenedPokemon] = useState<Pokemon[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBuy = async (packId: string, price: number) => {
        setError("");
        if (opening) return;

        // Check funds first
        if (money < price) {
            setError("Not enough money!");
            return;
        }

        setOpening(true);

        try {
            // Spend money
            const success = spendMoney(price);
            if (!success) {
                setOpening(false);
                return;
            }

            // Open pack (async)
            const newPokemon = await openPack(packId);

            // Artificial delay for suspense
            await new Promise(r => setTimeout(r, 2000));

            setOpenedPokemon(newPokemon);
            addPokemon(newPokemon);
        } catch (e) {
            console.error(e);
            setError("Failed to open pack. Please try again.");
        } finally {
            setOpening(false);
        }
    };

    const closeOverlay = () => {
        setOpenedPokemon(null);
    };

    if (!mounted) return null;

    return (
        <div className="relative pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Pack Shop
                </h1>
                <div className="md:hidden bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-sm">
                    💰 {money}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Pack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PACKS.map(pack => (
                    <PackCard
                        key={pack.id}
                        pack={pack}
                        canAfford={money >= pack.price}
                        onBuy={() => handleBuy(pack.id, pack.price)}
                    />
                ))}
            </div>

            {/* Opening Animation Overlay */}
            <AnimatePresence>
                {opening && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
                    >
                        {/* Shaking Pack */}
                        <motion.div
                            className="relative w-64 h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-[0_0_50px_rgba(59,130,246,0.5)] border-4 border-white/20 flex items-center justify-center"
                            animate={{
                                rotate: [-2, 2, -2, 2, 0],
                                scale: [1, 1.05, 1, 1.05, 1]
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        >
                            <div className="text-white text-6xl font-black italic opacity-50 select-none">Opener</div>
                            <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse" />
                        </motion.div>

                        <p className="text-white/80 mt-8 font-bold animate-pulse tracking-widest text-xl">OPENING...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Overlay */}
            <AnimatePresence>
                {openedPokemon && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 overflow-y-auto"
                    >
                        {/* Flash Effect on entry */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-white pointer-events-none z-50"
                        />

                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-12 text-center drop-shadow-sm uppercase italic tracking-tighter">
                            Pack Opened!
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full max-w-6xl mb-12 perspective-1000">
                            {openedPokemon.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, rotateY: 90, scale: 0.5 }}
                                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                    transition={{
                                        delay: i * 0.3,
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 10
                                    }}
                                    className="transform-style-3d"
                                >
                                    <PokemonCard pokemon={p} />
                                    {/* Particle Effects for Rarity */}
                                    {['LEGENDARY', 'EPIC'].includes(p.rarity) && (
                                        <div className="absolute inset-0 -z-10 bg-yellow-500/50 blur-2xl animate-pulse rounded-full" />
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <button
                            onClick={closeOverlay}
                            className="bg-white hover:bg-gray-100 text-black font-black py-4 px-12 rounded-full text-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                        >
                            CONTINUE
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
