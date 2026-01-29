#!/usr/bin/env node
/**
 * MCP Bridge - Connects Claude Desktop to remote MCP Server
 */

import { createInterface } from 'readline';

const REMOTE_URL = 'https://contract-review-skill.YOUR_SUBDOMAIN.workers.dev/mcp';

const rl = createInterface({
  input: process.stdin,
  terminal: false
});

for await (const line of rl) {
  if (!line.trim()) continue;
  
  try {
    const request = JSON.parse(line);
    
    const response = await fetch(REMOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const result = await response.json();
    console.log(JSON.stringify(result));
    
  } catch (error) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: String(error) }
    }));
  }
}
