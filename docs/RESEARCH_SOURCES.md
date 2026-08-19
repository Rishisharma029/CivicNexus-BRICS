# National Context Data Sources

## World Bank Indicators API

The World Bank’s official Indicators API provides programmatic access to nearly 16,000 time-series indicators across more than 45 databases and does not require an API key. CivicNexus uses its V2 JSON endpoint pattern as the read-only baseline source for population and selected infrastructure indicators. The production system records the source URL, indicator code, data period, retrieval time, and value alongside each imported observation.

Source: [World Bank — About the Indicators API Documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation)

## Infrastructure Indicator Families

The World Bank infrastructure topic lists indicator families that include freshwater withdrawals, electric-power consumption, fixed broadband subscriptions, mobile cellular subscriptions, rail route length, secure servers, and private-participation investment in energy, transport, water and sanitation, and ICT. CivicNexus uses this catalogue to distinguish a demographic baseline, an infrastructure-access or resilience context record, and an investment or public-plan record; each source remains explicitly attributable and does not prove an individual citizen claim.

Source: [World Bank Open Data — Infrastructure](https://data.worldbank.org/topic/infrastructure)

## Aggregation Guardrail

World Development Indicators aggregation guidance warns that missing observations are not imputed and that custom aggregates may be approximations. CivicNexus therefore ignores absent values, exposes data period and source provenance, and treats its national-context score as decision support rather than an official national ranking.

Source: [World Bank DataBank — World Development Indicators](https://databank.worldbank.org/source/world-development-indicators)
