import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createMcpHttpServer } from '../src/server.js';
import { BENCHMARK_CANDIDATES } from '@kept/policy-guard';

describe('Milestone 2 Acceptance: MCP Streamable HTTP Protocol & Tools', () => {
  let server: http.Server;
  let serverUrl: string;

  beforeAll(async () => {
    server = createMcpHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          serverUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function postJsonRpc(method: string, params?: any) {
    const res = await fetch(`${serverUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req_test_1',
        method,
        params,
      }),
    });
    return res.json();
  }

  // 1. Protocol initialize check
  it('Protocol Test: /mcp initialize returns protocolVersion 2025-11-25 and tool capabilities', async () => {
    const response = await postJsonRpc('initialize');
    expect(response.result.protocolVersion).toBe('2025-11-25');
    expect(response.result.serverInfo.name).toBe('kept-alexa-mcp');
    expect(response.result.capabilities.tools).toBeDefined();
  });

  // 2. tools/list check
  it('Protocol Test: tools/list exposes all required tools with complete schemas', async () => {
    const response = await postJsonRpc('tools/list');
    const tools = response.result.tools;
    expect(tools.length).toBeGreaterThanOrEqual(8);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain('get_household_inventory');
    expect(toolNames).toContain('check_purchase_compatibility');
    expect(toolNames).toContain('analyze_item_condition');
    expect(toolNames).toContain('evaluate_return_pathways');
    expect(toolNames).toContain('build_return_plan');
    expect(toolNames).toContain('approve_return_plan');
    expect(toolNames).toContain('execute_return_plan');
    expect(toolNames).toContain('reset_demo_state');
  });

  // 3. check_purchase_compatibility tool call
  it('Tool Call Test: check_purchase_compatibility identifies 58mm portafilter mismatch', async () => {
    const response = await postJsonRpc('tools/call', {
      name: 'check_purchase_compatibility',
      arguments: {
        candidate: BENCHMARK_CANDIDATES.incompatiblePortafilter,
      },
    });

    const parsed = JSON.parse(response.result.content[0].text);
    expect(parsed.status).toBe('INCOMPATIBLE');
    expect(parsed.mismatchedAttributes.length).toBe(2);
    expect(parsed.sellerRiskWarning).toContain('15% restocking fee');
  });

  // 4. Bedrock Nova analyze_item_condition tool call
  it('Tool Call Test: analyze_item_condition inspects unboxed kettle and notes handle crack and missing base', async () => {
    const response = await postJsonRpc('tools/call', {
      name: 'analyze_item_condition',
      arguments: {
        itemId: 'item_trial_kettle_03',
      },
    });

    const parsed = JSON.parse(response.result.content[0].text);
    expect(parsed.itemId).toBe('item_trial_kettle_03');
    expect(parsed.inspection.detectedDamage).toContain('handle crack');
    expect(parsed.inspection.missingPartsNoted).toContain('360-Degree Swivel Power Base');
    expect(parsed.updatedItem.visualEvidence).toBeDefined();
  });

  // 5. Complete approval & execution flow over MCP
  it('End-to-End MCP Workflow: build_return_plan -> approve_return_plan -> execute_return_plan', async () => {
    // A. Build plan
    const buildRes = await postJsonRpc('tools/call', {
      name: 'build_return_plan',
      arguments: {
        itemIds: ['item_trial_kettle_03', 'item_trial_sweater_04'],
        userActions: {
          item_trial_kettle_03: 'REPLACEMENT_FOR_DAMAGE',
          item_trial_sweater_04: 'RETURN_FOR_REFUND',
        },
      },
    });

    const draftPlan = JSON.parse(buildRes.result.content[0].text);
    expect(draftPlan.approvalStatus).toBe('DRAFT_PENDING_APPROVAL');
    expect(draftPlan.planHash).toBeDefined();

    // B. Approve plan
    const approveRes = await postJsonRpc('tools/call', {
      name: 'approve_return_plan',
      arguments: {
        planId: draftPlan.planId,
        userConfirmed: true,
      },
    });

    const approvedPlan = JSON.parse(approveRes.result.content[0].text);
    expect(approvedPlan.approvalStatus).toBe('APPROVED');
    expect(approvedPlan.authorizationToken).toBeDefined();

    // C. Execute plan with valid token
    const executeRes = await postJsonRpc('tools/call', {
      name: 'execute_return_plan',
      arguments: {
        planId: draftPlan.planId,
        authorizationToken: approvedPlan.authorizationToken,
      },
    });

    const execResult = JSON.parse(executeRes.result.content[0].text);
    expect(execResult.status).toBe('EXECUTED_SUCCESSFULLY');
    expect(execResult.plan.approvalStatus).toBe('EXECUTED');
  });

  // 6. Independent Official MCP Client SDK Integration Test
  it('Official SDK Integration: @modelcontextprotocol/sdk Client initializes, discovers all 8 tools, and executes tool call over StreamableHTTP', async () => {
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');

    const transport = new StreamableHTTPClientTransport(new URL(`${serverUrl}/mcp`));
    const client = new Client(
      { name: 'official-sdk-verifier', version: '1.0.0' },
      { capabilities: {} }
    );

    try {
      await client.connect(transport);

      // Verify tool discovery through official SDK
      const toolsResult = await client.listTools();
      expect(toolsResult.tools.length).toBeGreaterThanOrEqual(8);

      const toolNames = toolsResult.tools.map((t) => t.name);
      expect(toolNames).toContain('get_household_inventory');
      expect(toolNames).toContain('check_purchase_compatibility');
      expect(toolNames).toContain('analyze_item_condition');
      expect(toolNames).toContain('evaluate_return_pathways');
      expect(toolNames).toContain('build_return_plan');
      expect(toolNames).toContain('approve_return_plan');
      expect(toolNames).toContain('execute_return_plan');
      expect(toolNames).toContain('reset_demo_state');

      // Verify tool execution through official SDK
      const callResult = (await client.callTool({
        name: 'check_purchase_compatibility',
        arguments: {
          candidate: BENCHMARK_CANDIDATES.incompatiblePortafilter,
        },
      })) as any;

      expect(callResult.content).toBeDefined();
      expect(callResult.content[0].type).toBe('text');
      const parsed = JSON.parse(callResult.content[0].text);
      expect(parsed.status).toBe('INCOMPATIBLE');
      expect(parsed.mismatchedAttributes.length).toBe(2);
    } finally {
      await client.close();
    }
  });
});
