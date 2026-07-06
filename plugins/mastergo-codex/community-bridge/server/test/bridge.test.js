import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { CommunityBridge, createBridgeHttpServer } from "../bridge.js";

test("pairs, queues and resolves a command", async () => {
  const bridge = new CommunityBridge({ pairingCode: "123456", timeoutMs: 1_000 });
  const sessionId = bridge.connect("123456");
  const pending = bridge.request("ping", { value: 1 });
  const [command] = bridge.poll(sessionId);
  assert.equal(command.type, "ping");
  assert.deepEqual(command.payload, { value: 1 });
  bridge.resolve(sessionId, command.requestId, { ok: true });
  assert.deepEqual(await pending, { ok: true });
});

test("rejects an invalid pairing code", () => {
  const bridge = new CommunityBridge({ pairingCode: "123456" });
  assert.throws(() => bridge.connect("654321"), /配对码/);
});

test("exposes localhost status and pairing code for the canvas plugin", async (t) => {
  const bridge = new CommunityBridge({ pairingCode: "123456" });
  const server = createBridgeHttpServer(bridge);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/status`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    bridgeUrl: `http://127.0.0.1:${address.port}`,
    connected: false,
    pairingCode: "123456",
    sessionCount: 0,
    transport: "community"
  });
});
