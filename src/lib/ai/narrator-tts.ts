// ============================================================
// Narrator TTS Tool — ElevenLabs Text-to-Speech
// Realistic male French voice for battle commentary
// ============================================================

// ElevenLabs voice IDs for male narration
// "pNInz6obpgDQGcFmaJgB" = Adam (deep, narrative)
// "ErXwobaYiN019PkySvjV" = Antoni (warm, clear)
// "VR6AewLTigWG4xSOukaG" = Arnold (deep, confident)
// "TxGEqnHWrfWFTfGW9XjX" = Josh (deep, narrative)
const DEFAULT_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"; // Josh — deep male narrator voice

/** Strip emojis and markdown before sending to TTS */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
        .replace(/[\u{2600}-\u{26FF}]/gu, "")
        .replace(/[\u{2700}-\u{27BF}]/gu, "")
        .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
        .replace(/[\u{200D}]/gu, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Narrator TTS Tool — Converts commentary text to realistic speech audio.
 * Uses ElevenLabs API for high-quality male French voice.
 * Returns audio as a base64-encoded mp3 string.
 */
export async function speakCommentary(
    text: string,
): Promise<string | null> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.log("[TTS] No ELEVENLABS_API_KEY set, skipping TTS");
        return null;
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const cleanText = cleanTextForTTS(text);

    if (!cleanText) {
        console.log("[TTS] Empty text after cleaning, skipping");
        return null;
    }

    console.log("[TTS] Calling ElevenLabs API...");
    console.log("[TTS] Voice ID:", voiceId);
    console.log("[TTS] Text:", cleanText.substring(0, 100) + "...");

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.4,        // Lower = more expressive
                        similarity_boost: 0.8,  // Higher = closer to original voice
                        style: 0.6,             // Higher = more dramatic
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error("[TTS] ElevenLabs error:", response.status, errText);
            return null;
        }

        // Convert audio response to base64
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        console.log("[TTS] Audio generated successfully, size:", audioBuffer.byteLength, "bytes");

        return base64Audio;
    } catch (err) {
        console.error("[TTS] Error:", err);
        return null;
    }
}
