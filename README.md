# Kept — Family Memory for Alexa+
> **AI finds it. Kept personalizes it.**  
> *The personal layer that connects you and your family to Alexa. Protects family allergies, matches reading levels, and prevents wasted spend before checkout.*

**Live demo:** https://kept-alexa-mcp.vercel.app  
**Demo video:** https://www.loom.com/share/7e933e9ad5fa4970bd28d728f738a466  
*The companion UI simulates the Alexa+ voice agent; it is grounded by the real, self-hosted MCP server (Streamable HTTP, `2025-11-25` spec) exposed at `/api/mcp`.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
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

1. **Family Meal & Allergy Shield:** When you ask for dinner ideas, Kept blocks tree-nut allergens for Leo and matches cooking steps to your actual Ninja air fryer before Alexa speaks.
2. **Age-Grounded Curiosity Shield:** When Nidhi asks "Why do stars explode?", Kept intercepts college-level astrophysics jargon and grounds explanations to her 3rd-grade reading level.
3. **Duplicate Spend & Cable Guard:** Checks your TV ports and spare cables already in drawers so you never waste money on redundant HDMI cables or adapters.
