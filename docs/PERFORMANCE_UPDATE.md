# Citizen Submission Performance Update

The original submission path waited for Google Gemini classification, two six-language translation passes, priority rebuilding, and an owner-notification result. That made a valid civic report appear stalled even though the slow work was unrelated to saving the report.

The request route now persists the validated signal first and returns `analysisState: pending` immediately. The protected request trace provides an explicit **Run AI analysis** action; for voice notes, that action also starts server-side transcription. This keeps a citizen’s reporting step responsive while preserving the same analysis, translation, deduplication, policy scoring, and audit behaviour when enrichment is requested.

The automated suite includes a timing-focused test that holds the notification promise open and confirms that `recordCitizenSignal` still resolves within 100 milliseconds. The final validation run passed TypeScript checks and all 14 Vitest assertions.
