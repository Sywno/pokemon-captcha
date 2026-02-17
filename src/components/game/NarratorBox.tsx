// ============================================================
// NarratorBox — Battle commentary panel with TTS controls
// ============================================================

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Loader2, Volume2, VolumeX } from "lucide-react";
import { PERSONALITIES } from "@/lib/ai/narrator-types";

interface NarratorBoxProps {
    commentary: string;
    isNarrating: boolean;
    isSpeaking: boolean;
    isMuted: boolean;
    error: string | null;
    personalityId: string;
    onToggleMute: () => void;
}

export function NarratorBox({
    commentary,
    isNarrating,
    isSpeaking,
    isMuted,
    error,
    personalityId,
    onToggleMute,
}: NarratorBoxProps) {
    const personality = PERSONALITIES[personalityId] || PERSONALITIES.sportscaster;

    // Don't render if nothing to show
    if (!commentary && !isNarrating && !error) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mt-4 relative"
            >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl blur-md opacity-30 animate-pulse" />

                {/* Main panel */}
                <div className="relative bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/40 rounded-2xl p-4 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{personality.emoji}</span>
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                            {personality.name}
                        </span>

                        {/* Speaking wave animation */}
                        {isSpeaking && (
                            <motion.div
                                className="flex items-center gap-[2px] ml-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.span
                                        key={i}
                                        className="w-[3px] bg-green-400 rounded-full"
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            {/* Mute/Unmute button */}
                            <button
                                onClick={onToggleMute}
                                className={`p-1 rounded-lg transition-all duration-200 ${isMuted
                                        ? "text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                                        : "text-green-400/60 hover:text-green-400 hover:bg-green-400/10"
                                    }`}
                                title={isMuted ? "Activer la voix" : "Couper la voix"}
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            {/* Loading / idle indicator */}
                            {isNarrating ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader2 size={14} className="text-purple-400" />
                                </motion.div>
                            ) : (
                                <MessageCircle size={14} className="text-purple-400/60" />
                            )}
                        </div>
                    </div>

                    {/* Commentary text */}
                    {error ? (
                        <p className="text-red-400 text-sm font-mono">⚠️ {error}</p>
                    ) : isNarrating ? (
                        <div className="flex items-center gap-2">
                            <motion.div
                                className="flex gap-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.span
                                        key={i}
                                        className="w-2 h-2 bg-purple-400 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                        }}
                                    />
                                ))}
                            </motion.div>
                            <span className="text-purple-300/60 text-sm italic">
                                réfléchit...
                            </span>
                        </div>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-white text-base font-medium leading-relaxed"
                        >
                            {commentary}
                        </motion.p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
