# Kept — Alexa+ Commerce & Returns Guardian
> **Buy what belongs. Keep what you buy.**  
> *Before an AI agent recommends a purchase, Kept checks whether the evidence supports it for your household—and tells it when not to guess.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](packages/policy-guard/LICENSE)
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25%20Streamable%20HTTP-cyan.svg)](packages/kept-mcp)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Nova%20Multimodal%20Vision-blue.svg)](packages/kept-mcp/src/bedrock.ts)
[![Tests: Vitest](https://img.shields.io/badge/Tests-20%20Unit%20%2B%2015%20E2E%20Passed%20(100%25)-brightgreen.svg)](packages/policy-guard/tests)

---

## Target Tracks

| Prize Category | Target Amount | How Kept Qualifies |
| :--- | :--- | :--- |
| **Alexa+ Track (1st Place)** | **$25,000 Cash** + $15k AWS Credits | Self-hosted Model Context Protocol (MCP) server running over Streamable HTTP (`2025-11-25` spec) with 8 registered tools, single-screen companion interface, multi-item household ledger drawer, and cryptographic HMAC-SHA256 authorization boundaries. |
| **AWS Builder Mini-Challenge** | **$5,000 Cash** | Integration with **Amazon Bedrock (Nova Lite/Pro)** via `@aws-sdk/client-bedrock-runtime` Converse API for multimodal unboxing damage inspection and missing accessory verification. |
| **Developer Friction Log** | **+10% Score Bonus** | Deep, protocol-level feedback report on MCP Streamable HTTP, Bedrock Nova latency, and approval state boundaries documented in [`docs/FRICTION_LOG.md`](docs/FRICTION_LOG.md). |

---

## The Three Capabilities

1. **Verify Before Buying (Core Capability):** Checks compatibility against relevant household inventory (`Breville BES870XL`, `LG 27UP850-W`) and documented manufacturer specifications—flagging mismatches andseller restocking fee policies before checkout, and verifying compatible alternatives.
2. **Refuse Unsupported Decisions:** Identifies missing or conflicting specification evidence (such as third-party "universal" listings that omit millimeter dimensions) instead of guessing compatibility, pausing the order and preparing a seller verification question.
3. **Resolve What Goes Wrong:** Uses Amazon Bedrock Nova vision to inspect delivered item condition, checks for missing accessories in the photo, consolidates eligible items into a single Whole Foods drop-off, and requires explicit customer approval via an HMAC-SHA256 signed plan token.
