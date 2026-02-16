import { Pokemon } from "@/types";
import { X, Zap, Shield, Heart, Wind, Swords } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PokemonDetailModalProps {
    pokemon: Pokemon;
    onClose: () => void;
}

import { TYPE_COLORS } from "@/lib/constants";

export function PokemonDetailModal({ pokemon, onClose }: PokemonDetailModalProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 p-1 rounded-full text-white transition-colors">
                    <X size={20} />
                </button>

                {/* Header Background based on type */}
                <div className={cn("h-32 w-full relative", TYPE_COLORS[pokemon.types[0]] || "bg-gray-500")}>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                        <div className="relative w-full h-full">
                            <Image src={pokemon.sprite} alt={pokemon.name} fill className="object-contain" unoptimized />
                        </div>
                    </div>
                    <div className="absolute top-4 left-4 text-white font-bold opacity-80 text-xl">
                        #{String(pokemon.id).padStart(3, '0')}
                    </div>
                </div>

                <div className="pt-20 pb-8 px-6 text-center">
                    <h2 className="text-3xl font-black uppercase text-gray-800 mb-2">{pokemon.name}</h2>

                    <div className="flex justify-center gap-2 mb-6">
                        {pokemon.types.map(t => (
                            <span key={t} className={cn("px-3 py-1 text-xs font-bold text-white uppercase rounded-full", TYPE_COLORS[t])}>
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-6 text-sm">
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl">
                            <Heart className="text-red-500 mb-1" size={16} />
                            <span className="font-bold text-gray-700">{pokemon.stats.hp}</span>
                            <span className="text-[10px] text-gray-400">HP</span>
                        </div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl">
                            <Swords className="text-orange-500 mb-1" size={16} /> {/* Using Swords as icon import might be needed */}
                            <span className="font-bold text-gray-700">{pokemon.stats.attack}</span>
                            <span className="text-[10px] text-gray-400">ATK</span>
                        </div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl">
                            <Shield className="text-blue-500 mb-1" size={16} />
                            <span className="font-bold text-gray-700">{pokemon.stats.defense}</span>
                            <span className="text-[10px] text-gray-400">DEF</span>
                        </div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl">
                            <Wind className="text-teal-500 mb-1" size={16} />
                            <span className="font-bold text-gray-700">{pokemon.stats.speed}</span>
                            <span className="text-[10px] text-gray-400">SPD</span>
                        </div>
                    </div>

                    <div className="text-left">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" /> Moves ({pokemon.moves?.length || 0})
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-2 max-h-40 overflow-y-auto space-y-2">
                            {pokemon.moves && pokemon.moves.length > 0 ? (
                                pokemon.moves.map((move, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <div>
                                            <div className="font-bold text-sm capitalize">{move.name}</div>
                                            <div className={cn("text-[10px] uppercase font-bold text-gray-500")}>
                                                {move.type}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-sm text-gray-700">PWR {move.power || "-"}</div>
                                            <div className="text-[10px] text-gray-400">ACC {move.accuracy || 100}%</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-2">No moves data available</div>
                            )}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
} 
