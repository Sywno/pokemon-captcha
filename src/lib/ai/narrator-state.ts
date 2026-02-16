// ============================================================
// Narrator State — LangGraph Annotation (SERVER-ONLY)
// ============================================================

import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import type { BattleTurnContext } from "./narrator-types";

export const NarratorStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (prev, next) => [...prev, ...next],
        default: () => [],
    }),
    battleContext: Annotation<BattleTurnContext | null>({
        reducer: (_prev, next) => next,
        default: () => null,
    }),
    personalityId: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => "sportscaster",
    }),
    commentary: Annotation<string>({
        reducer: (_prev, next) => next,
        default: () => "",
    }),
});

export type NarratorState = typeof NarratorStateAnnotation.State;
