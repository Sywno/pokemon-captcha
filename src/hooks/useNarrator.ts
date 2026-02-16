// ============================================================
// useNarrator — React hook for battle narration
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";
import type { BattleTurnContext } from "@/lib/ai/narrator-types";

interface UseNarratorReturn {
    commentary: string;
    isNarrating: boolean;
    error: string | null;
    narrateTurn: (context: BattleTurnContext) => Promise<void>;
    clearCommentary: () => void;
}

export function useNarrator(personalityId: string = "sportscaster"): UseNarratorReturn {
    const [commentary, setCommentary] = useState<string>("");
    const [isNarrating, setIsNarrating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const narrateTurn = useCallback(
        async (context: BattleTurnContext) => {
            // Cancel previous request if still running
            if (abortRef.current) {
                abortRef.current.abort();
            }

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
                setCommentary(data.commentary || "...");
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                const message = err instanceof Error ? err.message : "Erreur de narration";
                setError(message);
                setCommentary("");
            } finally {
                setIsNarrating(false);
            }
        },
        [personalityId]
    );

    const clearCommentary = useCallback(() => {
        setCommentary("");
        setError(null);
    }, []);

    return { commentary, isNarrating, error, narrateTurn, clearCommentary };
}
