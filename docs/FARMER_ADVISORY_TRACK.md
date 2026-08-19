# AI-Driven Farmer Advisory — Track Coverage

CivicNexus BRICS now includes a complete **AI-Driven Farmer Advisory** track, accessible from the public **Farmer advisory** entry point or directly at `/farmer`.

| Track requirement | CivicNexus implementation |
|---|---|
| Farmer reporting | Farmers can submit text or voice reports, select agriculture, and add crop/livestock, issue type, growth/production phase, farm scale, location, and urgency. |
| Multilingual access | The farmer-specific intake controls and persisted guidance support English, Hindi, Russian, Simplified Chinese, Portuguese, and Arabic. |
| AI advice | Google Gemini returns a structured advisory containing a summary, severity, low-risk actions, cautions, and an escalation path. Outputs are validated before persistence. |
| Safety | The model contract forbids chemical products, dosage, mixing, pesticide or veterinary treatment recommendations, diagnosis claims, and outcome guarantees. Each advisory directs appropriate escalation to a local extension officer, veterinarian, or agronomist. |
| Agricultural context | Administrator-controlled World Bank baseline indicators include agricultural-land share and agriculture value added. Records retain their source name, URL, period, and relevance weight. |
| Policy insight | Agricultural signals rebuild into transparent category priorities with citizen impact, cross-country alignment, national-context, and composite scores. The public map and policy board remain privacy-minimised. |
| Oversight | Farmer reports retain the same protected trace, exact status pipeline, role gates, and audit events as civic infrastructure signals. |

## Safe advisory workflow

```text
Farmer text or voice report → protected request saved → optional Gemini enrichment
                                              ↓
structured farm advisory + six-language translation + protected trace
                                              ↓
aggregated agriculture priority + attributable context + human oversight
```

The AI enrichment is explicitly optional and does not delay the farmer’s report. This keeps the judge-facing flow responsive while retaining meaningful Google AI functionality for classifying farm conditions and creating cautious, multilingual guidance.

## Demonstration scenario

1. Open `/farmer` and select **Report a farm concern**.
2. Choose agriculture, then enter a crop or livestock enterprise, issue type, farm scale, locality, and a short report in any of the six languages.
3. Save the report immediately, then open the protected trace.
4. Run the optional advisory enrichment to show low-risk actions, cautions, and professional escalation.
5. Open the policy board to show agriculture entering the shared BRICS priority layer alongside attributable agricultural context.
