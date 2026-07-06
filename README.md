# MasterGo for Codex Marketplace

Public Codex marketplace for the community-maintained **MasterGo for Codex** plugin.

## Install

```bash
codex plugin marketplace add futureOarming/mastergo-codex
codex plugin add mastergo-codex@mastergo-codex
```

Start a new Codex thread after installation so the bundled skills and MCP tools are loaded.

To pin the marketplace to the first stable release:

```bash
codex plugin marketplace add futureOarming/mastergo-codex --ref v0.1.0
codex plugin add mastergo-codex@mastergo-codex
```

插件支持 MasterGo 官方 Vibe MCP，以及不具备官方 MCP 权限时可选用的社区画布桥接。详细功能、安装要求与安全模型请参阅 [`plugins/mastergo-codex/README.md`](plugins/mastergo-codex/README.md)。

> Community integration: this repository is not an official MasterGo distribution.
