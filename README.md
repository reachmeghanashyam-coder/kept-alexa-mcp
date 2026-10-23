# Kept — Alexa+ Commerce & Returns Guardian
> **Kept: Every purchase has to earn a yes.**  
> *The verification layer for AI shopping — checking what your household needs, proving compatibility where evidence allows, and refusing to guess when it doesn't.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](packages/policy-guard/LICENSE)
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25%20Streamable%20HTTP-cyan.svg)](packages/kept-mcp)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Nova%20Multimodal%20Vision-blue.svg)](packages/kept-mcp/src/bedrock.ts)
[![Tests: Vitest](https://img.shields.io/badge/Tests-19%20Unit%20%2B%2015%20E2E%20Passed%20(100%25)-brightgreen.svg)](packages/policy-guard/tests)

---

## Target Tracks

| Prize Category | Target Amount | How Kept Qualifies |
| :--- | :--- | :--- |
| **Alexa+ Track (1st Place)** | **$25,000 Cash** + $15k AWS Credits | Self-hosted Model Context Protocol (MCP) server running over Streamable HTTP (`2025-11-25` spec) with 8 registered tools, single-screen companion interface, multi-item household ledger drawer, and cryptographic HMAC-SHA256 authorization boundaries. |
| **AWS Builder Mini-Challenge** | **$5,000 Cash** | Integration with **Amazon Bedrock (Nova Lite/Pro)** via `@aws-sdk/client-bedrock-runtime` Converse API for multimodal unboxing damage inspection and missing accessory verification. |
| **Developer Friction Log** | **+10% Score Bonus** | Deep, protocol-level feedback report on MCP Streamable HTTP, Bedrock Nova latency, and approval state boundaries documented in [`docs/FRICTION_LOG.md`](docs/FRICTION_LOG.md). |

---

## The Core Product Thesis

As AI agents like Alexa+ evolve to take autonomous actions and shop on behalf of households, they face a critical trust gap:
1. **Catalog Blindness:** Shopping platforms know the product catalog, but they don't know what equipment is already inside the customer's home.
2. **Hallucination Risk:** Without verified specifications, generative models guess compatibility, leading to costly mistakes and return restocking fees.
3. **Unbounded Autonomous Action:** Agents should never execute consequential physical or financial actions without explicit customer consent.

**Kept** addresses this with an end-to-end verification and safety layer:
- **Multi-Item Household Ledger:** Grounds shopping agents in a persistent, room-categorized ledger (Kitchen, Office, Wardrobe) backed by manufacturer documentation.
- **Known Incompatibility:** Checks proposed purchases against verified household equipment specs (e.g. stopping a 58 mm portafilter for a 54 mm Breville machine, warning of seller penalties, and offering a verified compatible match).
- **Missing Information:** Refuses to guess when critical dimensions are omitted by third-party sellers, pausing checkout and drafting an exact seller inquiry question.
- **Evidence-Based Resolution:** Uses Amazon Bedrock Nova vision to inspect delivered damages and prepares a consolidated Whole Foods return plan subject to cryptographic HMAC-SHA256 customer authorization.
- **Cryptographic Authorization Proof:** Provides verifiable proof tokens binding canonical plan state, expiration TTLs, and single-use replay nonces.
