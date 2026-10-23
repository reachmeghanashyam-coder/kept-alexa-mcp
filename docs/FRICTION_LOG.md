# Kept — Alexa+ Developer Feedback & Friction Log

**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Track:** Alexa+ Track  
**Mini-Challenge:** AWS Builder Mini-Challenge  
**Project:** Kept — Household Commerce & Return Guardian  
**Environment:** TypeScript, Node.js 20, Next.js 15, `@modelcontextprotocol/sdk`, `@aws-sdk/client-bedrock-runtime` (`us-east-1`)

---

## Context

I built Kept as a prototype exploring how an Alexa+ experience could use household inventory, product compatibility checks, and return workflows to help people make better purchasing decisions.

The project uses an MCP server adhering to the `2025-11-25` Streamable HTTP specification, Amazon Bedrock's Converse API with Nova Lite (`amazon.nova-lite-v1:0`) for return image inspection, and a standalone Next.js interface to demonstrate the experience.

During development, I focused on three engineering challenges: preserving approval integrity across multi-step tool calls, keeping visual observations separate from deterministic policy decisions, and building a companion interface that provides a predictable evaluation experience.

This report documents what worked well, the specific friction points encountered during development, the workarounds implemented, and actionable suggestions for Amazon's developer platform teams.

---

## Tools and SDKs Used

1. **`@modelcontextprotocol/sdk` (v1.0+):** Used to expose 8 JSON-RPC tools over a Streamable HTTP endpoint (`POST /mcp`).
2. **`@aws-sdk/client-bedrock-runtime` (v3.x):** Used to call the Bedrock Converse API with Nova Lite in `us-east-1` for visual defect verification on unboxed returns.
3. **Next.js 15 / React 19:** Used to build the companion dashboard to trigger scenarios and inspect protocol traces during testing.

---

## Friction 1: Multi-step tool approvals across stateless Streamable HTTP requests

* **Task attempted:** Implement a two-step return batching flow where Tool Call A (`build_return_plan`) proposes an action plan, the user approves it, and Tool Call B (`approve_return_plan`) executes the plan.
* **Steps:** 
  1. Configure an MCP client to call `build_return_plan` with an item list over `POST /mcp`.
  2. Server responds with a proposed return plan object containing an expiration date and drop-off location.
  3. Client simulates user confirmation and calls `approve_return_plan`, passing the plan ID and parameters.
* **Expected:** A standard, protocol-guided way to ensure that the plan parameters submitted in Step 3 have not been altered or re-serialized with differing values between reasoning turns.
* **Observed:** Because Streamable HTTP can be operated statelessly without persistent memory between requests, relying solely on client-provided parameters in Step 3 created a risk where tool arguments could diverge from what was originally evaluated in Step 1.
* **Severity:** Medium — critical for commerce and return actions that touch payment or physical custody.
* **Workaround:** As an application design choice, I engineered an HMAC-SHA256 signature guard in `packages/kept-mcp`. The draft plan returns a signed digest of the exact items and carrier route. The execution tool rejects any request where the parameters do not match the cryptographic signature.
* **Suggested improvement:** Provide documentation and sample patterns in the Alexa+ / MCP developer guides showing recommended ways to manage transactional state and user consent across multi-turn tool calls when operating over Streamable HTTP.

---

## Friction 2: Handling latency and network overhead during visual inspection calls

* **Task attempted:** Send an image of a damaged return item (~400KB JPEG) to Amazon Bedrock Nova Lite using the Converse API during a live user interaction.
* **Steps:** 
  1. Initialize `BedrockRuntimeClient` configured for `us-east-1`.
  2. Invoke `ConverseCommand` passing image bytes and a structured JSON schema prompt.
  3. Log preliminary round-trip request timing across local test runs.
* **Expected:** Near-instantaneous response suitable for a real-time conversational voice turn (ideally under 500ms).
* **Observed:** During local testing, initial requests (which include SDK client initialization, credential loading, and the HTTPS TLS handshake) took approximately 1 second. Subsequent warm requests completed much faster (typically around 300ms), but the initial pause is noticeable during a voice interaction.
* **Severity:** Low to Medium — impacts conversational pacing if not masked by conversational fillers or UI loading states.
* **Workaround:** Added an explicit visual auditing spinner in the companion UI and kept client instances persistent to avoid re-initialization overhead.
* **Suggested improvement:** Document best practices for Alexa+ companion architectures on handling model invocation latency, such as recommended audio filler phrases ("Let me inspect that photo...") while Bedrock Converse processes the image.

---

## Friction 3: Keeping visual observations distinct from business policy logic

* **Task attempted:** Prompt Bedrock Nova Lite to inspect a photo of an electric kettle to determine whether it has visible cracks and whether the power base is present.
* **Steps:** 
  1. Sent the image with an early experimental prompt: *"Check if this item is eligible for an immediate return under standard store return policies."*
* **Expected:** The model checks whether the physical condition matches the return criteria.
* **Observed:** The vision model attempted to deduce commercial and legal policy conclusions (e.g. stating the customer should receive an immediate credit without returning the base), rather than strictly reporting what was physically visible in the pixels.
* **Severity:** Medium — generative models should not make authoritative business rule or policy decisions.
* **Workaround:** Refined the prompt boundary strictly to observational facts: *"Report only physical defects visible in the image and whether the circular power base is visible."* The actual return eligibility is then evaluated deterministically by the local TypeScript policy engine.
* **Suggested improvement:** Add a developer cookbook or prompt template in the AWS Bedrock documentation illustrating how to structure multimodal prompts for "Visual Evidence Extraction" vs. "Business Rule Enforcement."

---

## What Worked Well

* **Bedrock Converse API:** The Converse API interface is a major ergonomic improvement over older model-specific endpoints. Being able to pass text and base64 image blocks in a single structured message array made integrating Nova Lite very clean.
* **MCP Specification Clarity:** The `@modelcontextprotocol/sdk` TypeScript package made defining tool schemas with JSON Schema straightforward, and the tool definitions worked reliably across test scripts and the companion interface.
* **Local Development Speed:** Once the core schemas were in place, running an in-memory MCP server with hot-reloading allowed fast iteration without needing remote cloud redeployments for every code change.

---

## Conclusion & Future Outlook

I would build with Alexa+ and Bedrock again. Exploring how an assistant can use deterministic household specs to prevent buying the wrong parts, paired with vision models to verify physical unboxings, demonstrated a practical and helpful use case for generative AI in the home.

My main takeaway from building Kept is that combining multimodal AI with deterministic, rules-based policy verification creates an experience that users can actually trust with their household purchases.
