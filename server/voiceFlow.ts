export function normalizeVoiceTranscript(rawTranscript: string): string {
  const transcript = rawTranscript.replace(/\s+/g, " ").trim();
  if (transcript.length < 25) {
    throw new Error("The voice note could not be transcribed into a sufficiently detailed request. Please record again or add text before submitting.");
  }
  return transcript;
}

export function isOwnedVoicePreviewUrl(audioUrl: string, userId: number): boolean {
  return audioUrl.startsWith(`/app-storage/civicnexus/voice-preview/${userId}/`);
}

export function storageKeyFromAudioUrl(audioUrl: string): string {
  const prefix = "/app-storage/";
  if (!audioUrl.startsWith(prefix)) throw new Error("The stored voice-note URL is invalid.");
  return audioUrl.slice(prefix.length);
}
