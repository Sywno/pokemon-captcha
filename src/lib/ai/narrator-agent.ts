// ============================================================
// Narrator Agent — Entry point (delegates to orchestrator)
// ============================================================

import { BattleTurnContext, NarratorResult } from "./narrator-types";
import { orchestrate } from "./orchestrator";

/**
 * Narrates a battle turn using the multi-agent orchestrator.
 * Master Orchestrator → Battle Analyst → Narrator → Voice Actor
 */
export async function narrateTurn(
    context: BattleTurnContext,
    personalityId: string = "sportscaster"
): Promise<NarratorResult> {
    return orchestrate(context, personalityId);
}
