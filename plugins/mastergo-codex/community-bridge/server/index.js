#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CommunityBridge, createBridgeHttpServer } from "./bridge.js";

const port = Number(process.env.MASTERGO_COMMUNITY_PORT || 50_778);
const bridge = new CommunityBridge({ pairingCode: process.env.MASTERGO_COMMUNITY_TOKEN });
const httpServer = createBridgeHttpServer(bridge);

function text(value) {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
}

function registerTool(server, name, description, inputSchema, handler) {
  server.registerTool(name, { description, inputSchema }, async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      return { ...text(error instanceof Error ? error.message : String(error)), isError: true };
    }
  });
}

const server = new McpServer({ name: "mastergo-community", version: "0.1.0" });

registerTool(server, "community_status", "Get community bridge connection state and pairing instructions.", {}, async () => text(bridge.status(port)));

registerTool(
  server,
  "community_get_selection",
  "Read the current MasterGo selection through the community canvas plugin.",
  { depth: z.number().int().min(0).max(8).optional() },
  async ({ depth }) => text(await bridge.request("get-selection", { depth: depth ?? 3 }))
);

registerTool(
  server,
  "community_get_screenshot",
  "Export a selected or explicit MasterGo node as PNG through the community canvas plugin.",
  { nodeId: z.string().optional(), scale: z.number().min(0.25).max(4).optional() },
  async ({ nodeId, scale }) => {
    const result = await bridge.request("get-screenshot", { nodeId, scale: scale ?? 1 });
    if (!result?.data) throw new Error("画布未返回截图数据");
    return { content: [{ type: "image", data: result.data, mimeType: result.mimeType || "image/png" }] };
  }
);

registerTool(
  server,
  "community_create_frame",
  "Create an isolated frame in the active MasterGo document.",
  {
    fill: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#FFFFFF"),
    height: z.number().int().min(1).max(10_000),
    name: z.string().min(1).max(120),
    width: z.number().int().min(1).max(10_000),
    x: z.number().optional(),
    y: z.number().optional()
  },
  async (args) => text(await bridge.request("create-frame", args))
);

registerTool(
  server,
  "community_create_component_from_selection",
  "Convert the current selection into a local MasterGo component.",
  { name: z.string().min(1).max(120) },
  async (args) => text(await bridge.request("create-component-from-selection", args))
);

httpServer.listen(port, "127.0.0.1", async () => {
  console.error(`[mastergo-community] bridge=http://127.0.0.1:${port} pairing=${bridge.pairingCode}`);
  await server.connect(new StdioServerTransport());
});

function shutdown() {
  httpServer.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
