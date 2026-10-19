import http from 'http';
import { MCP_TOOL_DEFINITIONS, handleMcpToolCall } from './mcp-tools.js';

const PORT = parseInt(process.env.MCP_PORT || '3001', 10);

export function createMcpHttpServer() {
  const server = http.createServer(async (req, res) => {
    // Enable CORS for companion UI and local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, HEAD'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-mcp-version'
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // Health check endpoint
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'HEALTHY',
          protocolVersion: '2025-11-25',
          transport: 'Streamable HTTP (JSON-RPC 2.0)',
          service: 'DropGuard Alexa+ MCP Server',
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Direct tools list inspection endpoint
    if (url.pathname === '/api/tools' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tools: MCP_TOOL_DEFINITIONS }));
      return;
    }

    // Standard MCP JSON-RPC Streamable HTTP endpoint
    if (url.pathname === '/mcp' || url.pathname === '/api/mcp') {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const jsonRpc = JSON.parse(body);
          const { id, method, params } = jsonRpc;

          // MCP Protocol Handler
          if (method === 'initialize') {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'x-mcp-version': '2025-11-25',
            });
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id,
                result: {
                  protocolVersion: '2025-11-25',
                  capabilities: {
                    tools: {
                      listChanged: false,
                    },
                  },
                  serverInfo: {
                    name: 'dropguard-alexa-mcp',
                    version: '1.0.0',
                    description:
                      'DropGuard Alexa+ Commerce & Ownership MCP Server with AWS Bedrock Nova Vision',
                  },
                },
              })
            );
            return;
          }

          if (method === 'tools/list') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id,
                result: {
                  tools: MCP_TOOL_DEFINITIONS,
                },
              })
            );
            return;
          }

          if (method === 'tools/call') {
            const toolName = params?.name;
            const toolArgs = params?.arguments || {};

            const toolResult = await handleMcpToolCall(toolName, toolArgs);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id,
                result: toolResult,
              })
            );
            return;
          }

          // Unhandled JSON-RPC method
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Method not found: ${method}`,
              },
            })
          );
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error: Invalid JSON payload',
                details: err?.message,
              },
            })
          );
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  return server;
}

// Only start standalone listener when explicitly instructed or executed directly as the dropguard-mcp script
const isDirectExecution =
  process.env.AUTORUN_MCP_SERVER === 'true' ||
  (typeof process.argv[1] === 'string' &&
    process.argv[1].includes('dropguard-mcp') &&
    (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));

if (isDirectExecution) {
  const server = createMcpHttpServer();
  server.listen(PORT, () => {
    console.log(`[DropGuard MCP Server] Running on http://localhost:${PORT}`);
    console.log(`[DropGuard MCP Server] Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`[DropGuard MCP Server] Protocol Specification: 2025-11-25`);
  });
}

