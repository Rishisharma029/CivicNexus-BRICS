# Security Policy

## Supported Versions

The following versions of **CivicNexus BRICS** are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of CivicNexus BRICS seriously. If you discover a vulnerability or security issue, please follow these guidelines:

1. **Do not create a public issue.** Publicly disclosing vulnerabilities exposes the community and active deployments to risk.
2. Please report security issues privately to the project maintainers via GitHub Security Advisories or by contacting the team directly.
3. Include as much detail as possible:
   - A clear description of the vulnerability.
   - Steps to reproduce the issue (proof-of-concept script or reproduction steps).
   - Potential impact of the issue.
   - Any suggested mitigations or patches if available.

### What to Expect

- **Acknowledgment:** You will receive an acknowledgment of your report within 48 hours.
- **Assessment:** We will confirm the vulnerability and determine its severity.
- **Resolution:** A fix will be developed, tested, and released promptly.
- **Credit:** We will gladly acknowledge your responsible disclosure in our release notes.

## Security Practices in CivicNexus

CivicNexus BRICS implements strict architectural and runtime security measures:
- **Timing-Safe Token Authentication:** Webhook ingestion tokens (WhatsApp, Telegram, Gateway) are validated using `crypto.timingSafeEqual` to prevent side-channel timing attacks.
- **Role-Based Access Control (RBAC):** Strict boundaries separating `citizen`, `policymaker`, and `admin` scopes with type-safe tRPC middleware.
- **Schema Validation & Sanitization:** All inbound voice, text, and webhook payloads are validated against strict Zod schemas with bounded string lengths and finite coordinate boundaries.
- **Guardrails & Audit Logging:** Immutable append-only audit event logs tracking every signal submission, AI enrichment, policy brief refinement, and moderation action.
- **Data Protection:** No sensitive credentials or API keys are bundled into client-side assets.
