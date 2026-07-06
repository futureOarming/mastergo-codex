---
name: mastergo-design-system
description: Inspect and manage MasterGo components, component libraries, variables, and semantic design tokens in the active document. Use when the user asks about a MasterGo design system, team library, local component, component set, variant, token, variable collection, mode, alias, or syncing design-system assets.
---

# MasterGo Design System / 设计系统

Use together with `mastergo-use`. Read the current source of truth before creating or mutating components and variables.

与 `mastergo-use` 配合使用。创建或修改组件、变量之前，先读取当前真实数据。

## Libraries and components / 组件库与组件

1. Call `get_guidelines` with component-generation and page-generation scopes before creating components; use component-import and variable-import scopes when consuming an existing library.
2. Call `get_library_list` before choosing a subscribed team library. If more than one plausible library exists, ask the user to choose.
3. Call `get_component_info` for the selected library or the current file and use the persisted snapshot as the naming authority.
4. To create a component or component set, inspect the selected node with `get_selection_node` after the rules are loaded.
5. Call `agent_create_component` only after the rules and selection are loaded.
6. Refresh with `get_component_info`; when replacing existing design content is requested, use the returned real component data rather than a guessed name.

## Variables and tokens / 变量与令牌

Always use this sequence:

1. Call `get_guidelines` with the variable-generation scope.
2. Call `get_variables` with the absolute project root and read the saved variable snapshot.
3. Submit base variables with literal values through `update_variables`.
4. Call `get_variables` again to obtain the new real IDs.
5. Submit semantic variables that reference those IDs.
6. Call `get_variables` once more and verify collection, mode, type, value/reference, and name.

Never mix new literal-value variables and new references in the same batch. Never use `update_variables` to delete.

## Destructive actions / 危险操作

Deleting a variable requires `agent_remove_variable`, a freshly loaded snapshot, a stable variable ID whenever possible, and explicit confirmation from the user. The tool has no confirmation-text field, so retain that confirmation in the conversation. Deleting or replacing component-backed canvas content follows the same confirmation rules from `mastergo-use`.

## Invariants / 不变量

- Do not invent library IDs, component names, component properties, icon names, variable names, modes, or aliases.
- Preserve published/external assets as read-only unless the official tool explicitly supports the requested action.
- Re-read after every mutation and report returned document, page, component, and variable IDs.
- For page generation using a design system, hand off to `mastergo-generate-design` after snapshots are current.
