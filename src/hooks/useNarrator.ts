// ============================================================
// useNarrator — React hook for battle narration + TTS audio
// ============================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { BattleTurnContext } from "@/lib/ai/narrator-types";

interface UseNarratorReturn {
    commentary: string;
    isNarrating: boolean;
    isSpeaking: boolean;
    isMuted: boolean;
    error: string | null;
    narrateTurn: (context: BattleTurnContext) => Promise<void>;
    clearCommentary: () => void;
    toggleMute: () => void;
    stopSpeaking: () => void;
}

// ── Audio playback helpers ───────────────────────────────────

function playBase64Audio(
    base64: string,
    onEnd: () => void,
): HTMLAudioElement {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.onended = onEnd;
    audio.onerror = onEnd;
    audio.play().catch(() => onEnd());
    return audio;
}

// ── Hook ─────────────────────────────────────────────────────

export function useNarrator(personalityId: string = "sportscaster"): UseNarratorReturn {
    const [commentary, setCommentary] = useState<string>("");
    const [isNarrating, setIsNarrating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMutedRef = useRef(isMuted);

    // Keep ref in sync with state
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const stopSpeaking = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next) {
                // If muting, stop current audio
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                }
                setIsSpeaking(false);
            }
            return next;
        });
    }, []);

    const narrateTurn = useCallback(
        async (context: BattleTurnContext) => {
            // Cancel previous request if still running
            if (abortRef.current) {
                abortRef.current.abort();
            }
            stopSpeaking();

            const controller = new AbortController();
            abortRef.current = controller;

            setIsNarrating(true);
            setError(null);
            setCommentary("");

            try {
                const response = await fetch("/api/ai/narrate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        battleContext: context,
                        personalityId,
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                const text = data.commentary || "...";
                setCommentary(text);

                // Play audio if available and not muted
                if (data.audio && !isMutedRef.current) {
                    setIsSpeaking(true);
                    audioRef.current = playBase64Audio(data.audio, () => {
                        setIsSpeaking(false);
                        audioRef.current = null;
                    });
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                const message = err instanceof Error ? err.message : "Erreur de narration";
                setError(message);
                setCommentary("");
            } finally {
                setIsNarrating(false);
            }
        },
        [personalityId, stopSpeaking]
    );

    const clearCommentary = useCallback(() => {
        setCommentary("");
        setError(null);
        stopSpeaking();
    }, [stopSpeaking]);

    return {
        commentary,
        isNarrating,
        isSpeaking,
        isMuted,
        error,
        narrateTurn,
        clearCommentary,
        toggleMute,
        stopSpeaking,
    };
}
