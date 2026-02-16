"use client";

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface PokemonPlaceholderProps {
    id: number;
}

export function PokemonPlaceholder({ id }: PokemonPlaceholderProps) {
    return (
        <div className="relative aspect-[2.5/3.5] rounded-xl p-2 shadow-inner bg-gray-200 border-4 border-gray-300 flex flex-col items-center justify-center opacity-70">
            <div className="absolute top-2 left-2 text-xs font-bold text-gray-400">
                #{String(id).padStart(3, '0')}
            </div>

            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <Lock className="text-gray-400 w-8 h-8" />
            </div>

            <div className="w-24 h-4 bg-gray-300 rounded mt-2"></div>
            <div className="flex gap-1 mt-2">
                <div className="w-8 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-8 h-3 bg-gray-300 rounded-full"></div>
            </div>
        </div>
    );
}
