import crypto from "node:crypto";
import http from "node:http";

const DEFAULT_TIMEOUT_MS = 30_000;

function jsonResponse(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export class CommunityBridge {
  constructor({ pairingCode, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.pairingCode = pairingCode || String(crypto.randomInt(100_000, 1_000_000));
    this.timeoutMs = timeoutMs;
    this.sessions = new Map();
    this.pending = new Map();
  }

  connect(code) {
    if (String(code) !== this.pairingCode) throw new Error("配对码不正确");
    this.pruneSessions();
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, { commands: [], lastSeenAt: Date.now() });
    return sessionId;
  }

  disconnect(sessionId) {
    this.sessions.delete(sessionId);
  }

  pruneSessions() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1_000;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastSeenAt < cutoff) this.sessions.delete(sessionId);
    }
  }

  getConnectedSession() {
    const sessions = [...this.sessions.entries()]
      .filter(([, session]) => Date.now() - session.lastSeenAt < 15_000)
      .sort((a, b) => b[1].lastSeenAt - a[1].lastSeenAt);
    return sessions[0] || null;
  }

  poll(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("会话不存在，请重新配对");
    session.lastSeenAt = Date.now();
    return session.commands.splice(0, session.commands.length);
  }

  resolve(sessionId, requestId, result, error) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("会话不存在");
    session.lastSeenAt = Date.now();
    const pending = this.pending.get(requestId);
    if (!pending || pending.sessionId !== sessionId) throw new Error("请求不存在或已超时");
    this.pending.delete(requestId);
    clearTimeout(pending.timer);
    if (error) pending.reject(new Error(String(error)));
    else pending.resolve(result);
  }

  async request(type, payload = {}) {
    const connected = this.getConnectedSession();
    if (!connected) {
      throw new Error("社区画布插件未连接。请在 MasterGo 中运行 MasterGo Codex Bridge，并输入配对码。");
    }
    const [sessionId, session] = connected;
    const requestId = crypto.randomUUID();
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`画布命令超时: ${type}`));
      }, this.timeoutMs);
      this.pending.set(requestId, { reject, resolve, sessionId, timer });
    });
    session.commands.push({ payload, requestId, type });
    return promise;
  }

  status(port) {
    this.pruneSessions();
    const connected = this.getConnectedSession();
    return {
      bridgeUrl: `http://127.0.0.1:${port}`,
      connected: Boolean(connected),
      pairingCode: this.pairingCode,
      sessionCount: this.sessions.size,
      transport: "community"
    };
  }
}

export function createBridgeHttpServer(bridge) {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") return jsonResponse(res, 204, {});
      const url = new URL(req.url || "/", "http://127.0.0.1");
      if (req.method === "GET" && url.pathname === "/health") {
        return jsonResponse(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/api/v1/status") {
        const address = req.socket.localAddress;
        if (address !== "127.0.0.1" && address !== "::1" && address !== "::ffff:127.0.0.1") {
          return jsonResponse(res, 403, { error: "仅允许从本机读取桥接状态" });
        }
        return jsonResponse(res, 200, bridge.status(req.socket.localPort));
      }
      if (req.method === "POST" && url.pathname === "/api/v1/connect") {
        const body = await readJson(req);
        return jsonResponse(res, 200, { sessionId: bridge.connect(body.pairingCode) });
      }
      if (req.method === "POST" && url.pathname === "/api/v1/disconnect") {
        const body = await readJson(req);
        bridge.disconnect(body.sessionId);
        return jsonResponse(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/api/v1/commands") {
        return jsonResponse(res, 200, { commands: bridge.poll(url.searchParams.get("sessionId")) });
      }
      if (req.method === "POST" && url.pathname === "/api/v1/results") {
        const body = await readJson(req);
        bridge.resolve(body.sessionId, body.requestId, body.result, body.error);
        return jsonResponse(res, 200, { ok: true });
      }
      return jsonResponse(res, 404, { error: "not_found" });
    } catch (error) {
      return jsonResponse(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  });
}
