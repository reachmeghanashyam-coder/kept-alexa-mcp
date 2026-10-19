import { NextResponse } from 'next/server';
import { handleMcpToolCall, MCP_TOOL_DEFINITIONS } from '@kept/mcp-server';

export async function GET() {
  return NextResponse.json({
    status: 'HEALTHY',
    protocolVersion: '2025-11-25',
    service: 'Kept Alexa+ Simulated Companion API',
    tools: MCP_TOOL_DEFINITIONS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, arguments: args, method, params, id = 'req_ui_1' } = body;

    // Handle standard JSON-RPC format
    if (method) {
      if (method === 'initialize') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-11-25',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'kept-alexa-mcp', version: '1.0.0' },
          },
        });
      }
      if (method === 'tools/list') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { tools: MCP_TOOL_DEFINITIONS },
        });
      }
      if (method === 'tools/call') {
        const result = await handleMcpToolCall(params?.name, params?.arguments);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result,
        });
      }
    }

    // Direct tool call format: { name, arguments }
    if (name) {
      const toolResult = await handleMcpToolCall(name, args);
      return NextResponse.json(toolResult);
    }

    return NextResponse.json({ error: 'Invalid MCP request format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal MCP Execution Error', details: error?.message },
      { status: 500 }
    );
  }
}
