import assert from 'node:assert/strict';
import { createOrionBridge } from '../orion-bridge.mjs';
import { z } from 'zod';

const calls = [];
const secrets = {
  value: null,
  async get() { return this.value; },
  async set(_name, value) { this.value = value; },
};
const tools = [
  { name: 'read_window', description: 'Read the current desktop window.', parameters: z.object({ target: z.string().optional() }), execute: async (args) => { calls.push(args); return 'Window contents'; } },
];

const bridge = await createOrionBridge({ tools, secrets, port: 0 });
try {
  assert.match(bridge.endpoint, /^http:\/\/127\.0\.0\.1:\d+\/mcp$/);
  const { token } = await bridge.credentials();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(secrets.value, token);

  const unauth = await fetch(bridge.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) });
  assert.equal(unauth.status, 401, 'unauthenticated requests are rejected');

  const origin = await fetch(bridge.endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) });
  assert.equal(origin.status, 403, 'browser-origin requests are rejected');

  const post = async (id, method, params = {}) => {
    const r = await fetch(bridge.endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
    assert.equal(r.status, 200);
    return r.json();
  };
  const init = await post(2, 'initialize');
  assert.equal(init.result.protocolVersion, '2025-03-26');
  assert.equal(init.result.serverInfo.name, 'roamies-orion-bridge');

  const list = await post(3, 'tools/list');
  assert.equal(list.result.tools[0].name, 'read_window');
  assert.equal(list.result.tools[0].inputSchema.type, 'object');

  const call = await post(4, 'tools/call', { name: 'read_window', arguments: { target: 'front' } });
  assert.equal(call.result.content[0].text, 'Window contents');
  assert.deepEqual(calls, [{ target: 'front' }]);

  const missing = await post(5, 'tools/call', { name: 'not_a_tool', arguments: {} });
  assert.equal(missing.error.code, -32602);

  const health = await fetch(bridge.endpoint.replace('/mcp', '/health'));
  assert.deepEqual(await health.json(), { ok: true, service: 'roamies-orion-bridge' });
} finally {
  await bridge.close();
}

await assert.rejects(
  createOrionBridge({ tools, secrets, host: '0.0.0.0', port: 0 }),
  /loopback only/
);
console.log('Orion bridge tests: passed');
