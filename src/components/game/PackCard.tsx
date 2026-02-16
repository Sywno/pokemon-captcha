"use client";

import { Pack } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PackCardProps {
    pack: Pack;
    canAfford: boolean;
    onBuy: () => void;
}

export function PackCard({ pack, canAfford, onBuy }: PackCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative flex flex-col items-center p-6 rounded-2xl border-4 transition-all overflow-hidden bg-white shadow-xl cursor-pointer group",
                canAfford ? "border-white hover:border-blue-400" : "border-gray-200 opacity-80 grayscale"
            )}
            onClick={() => canAfford && onBuy()}
        >
            {/* Background Decoration */}
            <div className={cn("absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20", pack.imageColor)}></div>

            {/* Visual Representation of a Pack */}
            <div className={cn(
                "w-32 h-44 rounded-lg shadow-2xl mb-6 flex items-center justify-center relative overflow-hidden transform transition-transform group-hover:scale-105 group-hover:rotate-3",
                pack.imageColor
            )}>
                {/* Pack Art Lines */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />

                <span className="text-white font-black text-2xl uppercase tracking-tighter drop-shadow-md z-10 text-center px-2">
                    {pack.name.split(' ')[1] || pack.name}
                </span>

                {/* Shine effect */}
                <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-1">{pack.name}</h3>
            <p className="text-sm text-gray-500 text-center mb-4 min-h-[40px]">{pack.description}</p>

            <button
                className={cn(
                    "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md w-full",
                    canAfford
                        ? "bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
            >
                {pack.price === 0 ? "FREE" : `$${pack.price}`}
            </button>

            {!canAfford && (
                <div className="absolute top-4 right-4 text-red-500 font-bold bg-white/80 px-2 py-1 rounded text-xs">
                    NSF Funds
                </div>
            )}
        </motion.div>
    );
}
