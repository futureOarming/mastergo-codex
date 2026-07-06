mg.showUI(__html__, { width: 360, height: 520 });

const STORAGE_KEY = "mastergo-codex-bridge-settings-v1";

async function loadBridgeSettings() {
  const settings = await mg.clientStorage.getAsync(STORAGE_KEY);
  mg.ui.postMessage({ settings: settings || {}, type: "bridge-settings" });
}

function rgba(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
    a: 1
  };
}

function serializeNode(node, depth) {
  const value = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible
  };
  for (const key of ["x", "y", "width", "height", "opacity"]) {
    if (typeof node[key] === "number") value[key] = node[key];
  }
  if (node.type === "TEXT") value.characters = node.characters;
  if (depth > 0 && Array.isArray(node.children)) {
    value.children = node.children.map((child) => serializeNode(child, depth - 1));
  }
  return value;
}

async function execute(command) {
  const page = mg.document.currentPage;
  const payload = command.payload || {};
  if (command.type === "get-selection") {
    return {
      documentId: String(mg.documentId),
      pageId: page.id,
      pageName: page.name,
      selection: page.selection.map((node) => serializeNode(node, payload.depth || 3))
    };
  }
  if (command.type === "get-screenshot") {
    const node = payload.nodeId ? mg.getNodeById(payload.nodeId) : page.selection[0];
    if (!node || typeof node.exportAsync !== "function") throw new Error("请选择可导出的图层，或提供有效 nodeId");
    const bytes = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: payload.scale || 1 } });
    return { bytes: Array.from(bytes), mimeType: "image/png" };
  }
  if (command.type === "create-frame") {
    const frame = mg.createFrame();
    frame.name = payload.name;
    frame.resize(payload.width, payload.height);
    frame.fills = [{ type: "SOLID", color: rgba(payload.fill) }];
    frame.x = typeof payload.x === "number" ? payload.x : mg.viewport.center.x - payload.width / 2;
    frame.y = typeof payload.y === "number" ? payload.y : mg.viewport.center.y - payload.height / 2;
    page.selection = [frame];
    mg.viewport.scrollAndZoomIntoView([frame]);
    mg.commitUndo();
    return { documentId: String(mg.documentId), pageId: page.id, node: serializeNode(frame, 1) };
  }
  if (command.type === "create-component-from-selection") {
    const selection = [...page.selection];
    if (selection.length === 0) throw new Error("请先选择一个或多个图层");
    const component = mg.createComponent(selection);
    component.name = payload.name;
    page.selection = [component];
    mg.viewport.scrollAndZoomIntoView([component]);
    mg.commitUndo();
    return { documentId: String(mg.documentId), pageId: page.id, node: serializeNode(component, 2) };
  }
  throw new Error(`不支持的命令: ${command.type}`);
}

mg.ui.onmessage = async (message) => {
  if (!message) return;
  if (message.type === "bridge-ready") {
    await loadBridgeSettings();
    return;
  }
  if (message.type === "bridge-save-settings") {
    await mg.clientStorage.setAsync(STORAGE_KEY, message.settings || {});
    return;
  }
  if (message.type !== "bridge-command") return;
  try {
    const result = await execute(message.command);
    mg.ui.postMessage({ requestId: message.command.requestId, result, type: "bridge-result" });
  } catch (error) {
    mg.ui.postMessage({ requestId: message.command.requestId, error: error instanceof Error ? error.message : String(error), type: "bridge-result" });
  }
};
