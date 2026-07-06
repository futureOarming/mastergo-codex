---
name: mastergo-use
description: Safely inspect and edit the active MasterGo document through the MasterGo MCP tools. Use whenever the user mentions MasterGo, a MasterGo canvas or selection, asks to read nodes or screenshots, or requests any create, update, replace, sync, or delete operation in the currently open MasterGo file. Load this skill before other MasterGo workflow skills.
---

# MasterGo Use / MasterGo 基础操作

Use the official MasterGo MCP tool schemas as the source of truth. This integration operates only on the active document; it does not expose arbitrary JavaScript execution or cloud file management.

以官方 MasterGo MCP 工具 schema 为准。本集成只操作当前打开的文件，不执行任意 JavaScript，也不管理云端文件。

## Transport modes / 连接模式

This plugin supports two canvas transports:

- `official`: MasterGo's official Vibe MCP. This remains the full-featured and preferred transport.
- `community`: the bundled `MasterGo Codex Bridge` community plugin plus local bridge server. Use this when the account does not expose official MCP.
- `auto` (default): try the official tool first. Fall back to community mode only for a connection-level failure such as `no online mg canvas`, missing endpoint, or unavailable official MCP. `NoSelection` is not a connection failure; ask the user to select a node or use a supplied ID.

Do not mix transport IDs in one mutation. Once a task starts writing through one transport, validate through that same transport.

Community-mode tool mapping:

- Connection: `community_status`
- Selection: `community_get_selection`
- Screenshot: `community_get_screenshot`
- Isolated frame creation: `community_create_frame`
- Component creation from the current selection: `community_create_component_from_selection`

Community mode is currently an MVP subset. If the requested operation has no community tool, explain the gap and do not silently route a destructive or structurally different operation.

## Start every task / 每次任务的起点

1. Make the relevant MasterGo tools available if they are deferred.
2. Call `get_guidelines` as the first MasterGo tool in the conversation, using the scopes relevant to the task. Follow the returned rules over this skill if they differ. Use `get_version` only when the user asks for version information.
3. Let the first document operation verify the canvas connection. In `auto` mode, a connection-level official failure should be followed by `community_status`. If community mode is connected, continue with its mapped tool. Otherwise tell the user either to enable **MasterGo MCP** (official mode, default endpoint `http://127.0.0.1:50678`) or run **MasterGo Codex Bridge** and enter the pairing code returned by `community_status`. The community bridge URL is fixed at `http://127.0.0.1:50778` and should not be edited.
4. Use the current workspace root as an absolute `projectDir` whenever a tool persists `.mastergo` snapshots or generated code.

## Route the operation / 工具路由

- Inspect the current target with `get_selection_node`; pass an explicit node ID when the user supplied one.
- Use `get_screenshot` for visual evidence, not as a substitute for structured node data.
- Use `agent_update_node` for local text, style, or layout edits.
- Use `agent_replace_node` for image/source replacement or replacing a subtree.
- Use `design_page` for creating a page. Do not begin a page-design request with `submit_page_to_canvas`.
- Use `agent_sync_design` only for explicitly requested full replacement from an existing local HTML/code file.
- Use `agent_remove_node` and `agent_remove_variable` only for explicit deletions.
- Use the specialized generation, design-to-code, or design-system skill for those workflows.

## Read before write / 先读后写

Before changing existing content, call `get_selection_node` and record the returned document, page, root, and target node IDs. Use those exact IDs in later calls. Never guess an ID, component name, variable name, or library name.

修改现有内容前先调用 `get_selection_node`，保存返回的文件、页面、根节点与目标节点 ID；后续调用使用这些真实 ID，禁止猜测。

## Mutation and approval rules / 写入与审批

- Execute ordinary create and update operations without an extra confirmation.
- Require fresh, explicit user confirmation before deleting a node, deleting a variable, or fully overwriting an existing canvas root with `agent_sync_design`.
- For `agent_sync_design`, copy the user's confirmation text verbatim into its confirmation fields. The remove tools have no confirmation field; retain the confirmation in the conversation and call them only after it is obtained. A request to “send” or “generate” a design is not permission for full overwrite.
- Never convert a vague cleanup request into deletion. Ask only when the destructive target or intent is unclear.
- Make one logical change at a time when practical. If a response says `accepted`, wait for the canvas operation to settle before validating.

## Validate every write / 每次写入后验证

1. Re-read the affected root or target with `get_selection_node`.
2. Capture `get_screenshot` when the change is visual.
3. Compare the result with the request and correct mismatches incrementally.
4. Return the affected document/page/node IDs supplied by the tools. If a tool omits an ID, say so rather than inventing one.

Treat a successful tool response as transport success; the re-read and screenshot are the acceptance check.
