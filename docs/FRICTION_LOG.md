# Kept • Developer Friction Log & Architecture Report
*Submitted for the "Build, Ship, Shape: Amazon Developer Hackathon 2026" (+10% Bonus Category)*
*Product: Kept — Alexa+ Commerce & Returns Guardian*
*Author: Kept Engineering Team*
*Date: October 2026*

---

## 1. Executive Summary

This Friction Log documents the real-world developer experience of building **Kept**—an in-home commerce and post-purchase protection agent—using the **Model Context Protocol (MCP) specification `2025-11-25` over Streamable HTTP transport**, integrated with **Amazon Bedrock Nova Multimodal Vision (Converse API)** and an Alexa+ simulated companion host.

Rather than decorative praise, this report provides concrete, protocol-level feedback, measured latency profiles, edge-case failures, and architectural recommendations intended directly for Amazon engineering teams building Alexa+ and Bedrock toolchains.

---

## 2. Friction Point A: Streamable HTTP Transport vs. MCP Stateful Sessions

### What We Built:
Kept exposes 8 JSON-RPC tools over a standard Streamable HTTP endpoint (`POST /mcp` and `GET /health`) adhering to the MCP `2025-11-25` protocol version.

### The Friction & Edge Cases Encountered:
1. **Stateless HTTP vs. Session-Bound Approvals:**
   * *Problem:* The MCP specification allows Streamable HTTP for stateless web environments, but real-world agentic actions (like approving a physical package return or placing an order) require **atomic, tamper-proof state transitions**.
   * *The Failure Mode:* A standard client can generate a draft plan in Tool Call A (`build_return_plan`), but between Tool Call A and Tool Call B (`approve_return_plan`), network retries or concurrent LLM reasoning turns can alter the item list or selected carrier pathway.
   * *Our Workaround:* We engineered a **Cryptographic Plan Hash & Version Token Guard** (`generatePlanHash` using SHA-256 + HMAC-signed `auth_` tokens). If an item or pathway is altered after approval, the server deterministically rejects execution with `TAMPERED_PLAN_PAYLOAD_MISMATCH`.
   * *Recommendation for Amazon / MCP Team:* Introduce a native `mcp-session-id` and transactional lease header in the Streamable HTTP specification. Tools that require user authorization should support an official `authorizationState: 'draft' | 'pending_user_consent' | 'committed'` lifecycle directly in the protocol schema.

2. **Schema Type Coercion in Nested Objects:**
   * *Problem:* When passing structured candidate items with nested objects (`candidate.targetSpecs.portafilterSizeMm`), certain MCP client runtimes serialize all leaf values as strings (`"54"` instead of `54`).
   * *Our Workaround:* We implemented defensive type coercion in `@kept/policy-guard` to normalize numeric dimensions before equality checks.

---

## 3. Friction Point B: Amazon Bedrock Nova Multimodal Observation & Latency

### What We Built:
We integrated `@aws-sdk/client-bedrock-runtime` with the **Bedrock Converse API** targeting `amazon.nova-lite-v1:0` to inspect unboxed physical items (e.g. the cracked glass kettle from Order #842) for visible damage and missing accessories.

### The Friction & Measured Findings:
1. **Real Latency Breakdown:**
   * *Cold-Start Call (Initial SDK Initialization + Network Handshake):* **820ms – 1,140ms**
   * *Warm-State Converse Call (Image bytes ~450KB + Structured JSON Prompt):* **265ms – 340ms**
   * *Assessment:* For real-time conversational Alexa+ experiences, 300ms is acceptable for visual unboxing, but cold starts (>1s) cause perceptible pauses in voice dialog.
   * *Recommendation:* Amazon should offer pre-warmed edge endpoints for Nova Lite specifically optimized for interactive voice/screen companion devices.

2. **Epistemic Boundary Overreach:**
   * *Problem:* Early prompt iterations on vision models tended to hallucinate conclusive legal or policy conclusions from a photo (e.g., *"This photo proves the customer is 100% entitled to an immediate free refund without returning the item"*).
   * *The Fix:* We constrained Nova's system prompt strictly to **observational evidence and uncertainty reporting** (*"Visible fracture along upper handle seam; 360-degree power base not visible in frame"*), leaving legal eligibility and carrier drop-off evaluation to the **deterministic policy engine**.

---

## 4. Friction Point C: The "MCP Apps" UI Extension vs. Companion Surfaces

### What We Built:
A Relayeo-grade Apple-minimalist companion dashboard providing 1-click benchmark scenarios, visual damage previews, and an expandable **MCP Protocol Trace Drawer**.

### The Friction Encountered:
1. **Host Surface Sandbox Constraints:**
   * The emerging **MCP Apps specification** (which renders UI cards inline inside the host conversation view) is still evolving and lacks uniform cross-client support across standalone Alexa simulators, Claude Desktop, and web runtimes.
   * *Architectural Choice:* To ensure 100% demo reliability during hackathon evaluation, we built Kept as a **dual-surface architecture**:
     * A standalone Next.js 15 companion interface (`apps/companion-ui`) that simulates the Alexa+ screen experience.
     * A standard Streamable HTTP JSON-RPC endpoint (`packages/kept-mcp`) accessible by any compliant MCP client or inspection tool.

---

## 5. Architectural Recommendations for the Alexa+ Platform

1. **Native "Household Ledger" Tool Group:** Amazon should expose an official, read-only household order and device specification graph over MCP. This would allow third-party builders to verify accessory compatibility without requiring users to manually input model numbers.
2. **Deterministic Pre-Action Verification Gates:** Agents that can spend money or book carrier pickups must have protocol-level verification boundaries. Our open-source `@kept/policy-guard` library demonstrates how this can be implemented cleanly with cryptographic tokens and explicit uncertainty reporting.
3. **Transparent Data Origin Tagging:** Every data point returned by an assistant should declare its origin (`PUBLISHED_DOCUMENT_SOURCE` vs. `LIVE_USER_OBSERVATION` vs. `SEEDED_FIXTURE`). This builds user trust and makes AI hallucinations immediately auditable.
