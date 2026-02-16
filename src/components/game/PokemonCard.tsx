"use client";

import { Pokemon, Rarity } from "@/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

interface PokemonCardProps {
    pokemon: Pokemon;
    showCount?: number;
    onClick?: () => void;
    className?: string; // Allow override
}

// More vibrant colors
const RARITY_STYLES: Record<Rarity, string> = {
    COMMON: "from-gray-300 to-gray-400 border-gray-400",
    RARE: "from-blue-300 to-blue-500 border-blue-400",
    SUPER_RARE: "from-purple-300 to-purple-600 border-purple-500",
    EPIC: "from-pink-300 to-rose-600 border-pink-500",
    LEGENDARY: "from-yellow-300 to-amber-500 border-yellow-500",
};

import { TYPE_COLORS } from "@/lib/constants";

export function PokemonCard({ pokemon, showCount, onClick, className }: PokemonCardProps) {
    const isHolo = ['SUPER_RARE', 'EPIC', 'LEGENDARY'].includes(pokemon.rarity);

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative aspect-[2.5/3.5] rounded-xl p-2 cursor-pointer shadow-lg overflow-hidden border-[6px]",
                "bg-gradient-to-br", // Base gradient
                RARITY_STYLES[pokemon.rarity],
                className
            )}
            onClick={onClick}
        >
            {/* Holo Overlay */}
            {isHolo && (
                <div className="absolute inset-0 opacity-30 pointer-events-none card-holo z-10" />
            )}

            {/* Inner Card content */}
            <div className="relative h-full w-full bg-white/90 rounded-lg flex flex-col p-2 z-0">

                {/* Header */}
                <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs uppercase text-gray-700">{pokemon.name}</span>
                    <span className="font-mono text-xs text-red-600 font-bold">{pokemon.stats.hp} HP</span>
                </div>

                {/* Image Container */}
                <div className="relative flex-1 bg-white/50 rounded border border-gray-200 shadow-inner mb-2 flex items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/0 to-black/10 opacity-50" />
                    <motion.div
                        className="relative w-24 h-24"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                    >
                        <Image
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            fill
                            className="object-contain drop-shadow-md"
                            unoptimized
                        />
                    </motion.div>

                    {/* Level Badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded-full font-bold">
                        Lv.{pokemon.level}
                    </div>
                    {showCount && showCount > 1 && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 rounded-full font-bold shadow-sm">
                            x{showCount}
                        </div>
                    )}
                </div>

                {/* Type Badges */}
                <div className="flex gap-1 justify-center mb-2">
                    {pokemon.types.map(t => (
                        <span key={t} className={cn("text-[8px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm", TYPE_COLORS[t] || "bg-gray-500")}>
                            {t}
                        </span>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-1 text-[9px] text-gray-600 bg-gray-100 p-1 rounded border border-gray-200">
                    <div className="flex justify-between">
                        <span>ATK</span> <b className="text-gray-900">{pokemon.stats.attack}</b>
                    </div>
                    <div className="flex justify-between">
                        <span>DEF</span> <b className="text-gray-900">{pokemon.stats.defense}</b>
                    </div>
                    <div className="flex justify-between">
                        <span>SPD</span> <b className="text-gray-900">{pokemon.stats.speed}</b>
                    </div>
                </div>

                {/* Rarity Star */}
                <div className="absolute bottom-1 right-2">
                    {pokemon.rarity === 'LEGENDARY' && <span className="text-yellow-500 text-xs">⭐⭐⭐</span>}
                    {pokemon.rarity === 'EPIC' && <span className="text-pink-500 text-xs">⭐⭐</span>}
                    {pokemon.rarity === 'SUPER_RARE' && <span className="text-purple-500 text-xs">⭐</span>}
                </div>

            </div>
        </motion.div>
    );
}
