# MasterGo for Codex

通过官方 Vibe MCP 或社区画布桥接，把 Codex 连接到当前打开的 MasterGo 文件。

Connect Codex to the active MasterGo document through either MasterGo's official Vibe MCP or the bundled community canvas bridge.

> Community integration / 社区集成：本项目不是 MasterGo 官方发行的 Codex 插件。

## 插件介绍 / About

**MasterGo for Codex** 是一款面向设计与研发协作的社区集成插件，让 Codex 能够在当前打开的 MasterGo 文件中理解设计、创建页面、修改画布，并把设计结果转化为可落地的前端代码。

插件支持双连接模式：优先使用 MasterGo 官方 Vibe MCP 获得完整能力；当账号暂未开放官方 MCP 时，也可以通过内置的社区画布桥接完成选区读取、截图、画板创建和组件创建。所有写入都遵循“先读取、后修改、再验证”的流程，删除节点、删除变量和全量覆盖画布等高风险操作必须得到明确确认。

**MasterGo for Codex** is a community integration for design-to-development collaboration. It lets Codex understand the active MasterGo document, create and refine canvas content, and turn selected designs into implementation-ready frontend code. It prefers MasterGo's official Vibe MCP for full capabilities and includes a community bridge for essential canvas workflows when official MCP access is unavailable.

## 能力 / Capabilities

- 读取当前选区、节点结构与截图
- 生成页面并写入当前画布
- 修改文字、样式、布局和图片
- 管理组件、团队库、变量与语义令牌
- 导出前端代码并比较设计差异
- 对删除和全量覆盖执行明确确认

## 要求 / Requirements

- macOS and Codex desktop
- Node.js 18 or newer
- MasterGo desktop with the target file open
- Either MasterGo MCP enabled, or the bundled `MasterGo Codex Bridge` community plugin running

The default local endpoint is `http://127.0.0.1:50678`. This plugin pins `@mastergo/vibe-mcp@1.0.18` for reproducible behavior.

## 双模式 / Dual mode

- `auto`（默认）：优先官方 MCP；官方画布连接不可用时检查社区桥接。
- `official`：使用 MasterGo 官方 Vibe MCP，完整能力路径。
- `community`：使用随仓库提供的 MasterGo 社区插件与本地桥接服务，不要求账号开放官方 MCP。

社区模式开发安装：

1. 在 MasterGo 客户端打开 **插件 → 开发者模式 → 创建/添加插件**。
2. 导入 `community-bridge/mastergo-plugin/manifest.json`。
3. 运行 **MasterGo Codex Bridge**；插件会通过固定本机地址 `http://127.0.0.1:50778` 自动读取六位配对码，并在当前设备保存连接。每位用户看到的地址相同，但实际连接的是各自电脑上的桥接进程。
4. 如果自动发现被阻止，再调用 `community_status`，手工填写返回的配对码；桥接地址已锁定，无需修改。

社区模式当前覆盖连接、选区读取、节点截图、独立画板创建、从选区创建组件。其余能力继续使用官方模式，后续会逐步补齐。

## 安装 / Install

From a terminal, register the public marketplace and install the plugin:

```bash
codex plugin marketplace add futureOarming/mastergo-codex
codex plugin add mastergo-codex@mastergo-codex
```

Then start a **new Codex thread** so the new skills and MCP tools are loaded.

If MasterGo selected another local port, launch Codex from a shell with an override:

```bash
MASTERGO_SERVER_URL=http://127.0.0.1:50679 open -a Codex
```

Alternatively, change the endpoint shown by MasterGo before starting a new Codex thread.

## 示例 / Starter prompts

- `读取我当前在 MasterGo 里选中的设计，并总结图层结构。`
- `在当前 MasterGo 文件里设计一个深色数据仪表盘。`
- `把我选中的 MasterGo 画板转换成现有项目里的前端代码。`

## 安全模型 / Safety model

Ordinary create and update calls execute directly. Node deletion, variable deletion, and full local-code overwrite require fresh, explicit user confirmation. The plugin exposes the official structured MCP tools and does not provide arbitrary JavaScript execution.

普通创建和修改会直接执行；删除节点、删除变量、使用本地代码全量覆盖画布时，必须取得用户本次明确确认。插件不开放任意 JavaScript 执行。

## 本地更新 / Local development updates

After editing the plugin, update its cachebuster, read the marketplace name, and reinstall:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py \
  ./plugins/mastergo-codex
python3 ~/.codex/skills/.system/plugin-creator/scripts/read_marketplace_name.py \
  --marketplace-path ./.agents/plugins/marketplace.json
codex plugin add mastergo-codex@mastergo-codex
```

Open a new thread after reinstalling.

## Troubleshooting / 故障排查

- **Cannot connect (official):** start MasterGo, open a design file, and confirm MasterGo MCP is connected.
- **Cannot connect (community):** run MasterGo Codex Bridge and check the pairing code shown in its window. It normally reconnects automatically; if not, call `community_status` and enter the returned pairing code manually. The bridge address is fixed at `http://127.0.0.1:50778`.
- **Wrong port:** use `MASTERGO_SERVER_URL` with the port shown by MasterGo.
- **No selection:** select a frame or layer, or supply a node ID supported by the requested tool.
- **Read-only document:** switch to a document where the current user has edit permission.
- **Accepted but not visible yet:** wait for the canvas operation to finish, then re-read the target and capture another screenshot.
