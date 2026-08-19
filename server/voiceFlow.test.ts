import { describe, expect, it } from "vitest";
import { isOwnedVoicePreviewUrl, normalizeVoiceTranscript, storageKeyFromAudioUrl } from "./voiceFlow";

describe("voice-report workflow safeguards", () => {
  it("normalizes a reviewable transcription and rejects an insufficient transcript", () => {
    expect(normalizeVoiceTranscript("  Road access is blocked after repeated flooding near the health clinic.  ")).toBe("Road access is blocked after repeated flooding near the health clinic.");
    expect(() => normalizeVoiceTranscript("Too short")).toThrow("sufficiently detailed");
  });

  it("only accepts a preview recording owned by the submitting user", () => {
    const audioUrl = "/app-storage/civicnexus/voice-preview/42/recording_ab12.webm";
    expect(isOwnedVoicePreviewUrl(audioUrl, 42)).toBe(true);
    expect(isOwnedVoicePreviewUrl(audioUrl, 7)).toBe(false);
    expect(storageKeyFromAudioUrl(audioUrl)).toBe("civicnexus/voice-preview/42/recording_ab12.webm");
  });
});
