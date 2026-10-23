# Kept — The Personal Household Care Layer for Alexa+
> **AI finds it. Kept personalizes it.**  
> *The gentle layer of household memory for Alexa+ that protects family allergies, knows your real appliances, and prevents wasted spend before checkout.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](packages/policy-guard/LICENSE)
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25%20Streamable%20HTTP-cyan.svg)](packages/kept-mcp)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Nova%20Multimodal%20Vision-blue.svg)](packages/kept-mcp/src/bedrock.ts)
[![Tests: Vitest](https://img.shields.io/badge/Tests-20%20Unit%20%2B%2015%20E2E%20Passed%20(100%25)-brightgreen.svg)](packages/policy-guard/tests)

---

## Target Tracks

| Prize Category | Target Amount | How Kept Qualifies |
| :--- | :--- | :--- |
| **Alexa+ Track (1st Place)** | **$25,000 Cash** + $15k AWS Credits | Self-hosted Model Context Protocol (MCP) server running over Streamable HTTP (`2025-11-25` spec) with 8 registered tools, single-screen companion interface, continuous household memory ledger, and cryptographic HMAC-SHA256 authorization boundaries. |
| **AWS Builder Mini-Challenge** | **$5,000 Cash** | Integration with **Amazon Bedrock (Nova Lite/Pro)** via `@aws-sdk/client-bedrock-runtime` Converse API for multimodal unboxing damage inspection and missing accessory verification. |
| **Developer Friction Log** | **+10% Score Bonus** | Deep, protocol-level feedback report on MCP Streamable HTTP, Bedrock Nova latency, and approval state boundaries documented in [`docs/FRICTION_LOG.md`](docs/FRICTION_LOG.md). |

---

## The Three Everyday Capabilities

1. **Family Meal & Allergy Shield:** When you ask for dinner ideas, Kept blocks tree-nut allergens and matches cooking steps to your actual Ninja air fryer before Alexa speaks.
2. **Automatic Supply & Filter Match:** Matches the exact True HEPA filter for your bedroom air purifier without asking you to memorize cryptic model codes or guess CADR ratings.
3. **Duplicate Spend & Cable Guard:** Checks your TV ports and spare cables already in drawers so you never waste money on redundant HDMI switches or power cords.
