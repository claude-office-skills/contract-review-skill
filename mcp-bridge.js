#!/usr/bin/env node
/**
 * MCP Bridge - Connects Claude Desktop to remote MCP Server
 * 
 * This script acts as a stdio-to-HTTP bridge, forwarding MCP requests
 * from Claude Desktop to the remote Cloudflare Worker.
 */

const REMOTE_URL = 'https://contract-review-skill.YOUR_SUBDOMAIN.workers.dev/mcp';

let buffer = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  
  // Try to parse complete JSON objects
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const request = JSON.parse(line);
      
      // Forward to remote server
      const response = await fetch(REMOTE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      
      // Write response to stdout (must be newline-delimited)
      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (error) {
      // Return error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message || 'Bridge error'
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  process.stderr.write(`Bridge error: ${error.message}\n`);
});
