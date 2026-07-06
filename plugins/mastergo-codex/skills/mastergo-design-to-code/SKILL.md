---
name: mastergo-design-to-code
description: Inspect a MasterGo selection and turn it into verified frontend code, or compare local code with the active design. Use when the user asks to export code, implement a selected MasterGo frame, obtain HTML, restore a design in React/Vue/native web code, or review design-to-code differences.
---

# MasterGo Design to Code / 设计转代码

Use together with `mastergo-use`. Preserve the selected design's structure and visual evidence while adapting the exported result to the user's codebase.

与 `mastergo-use` 配合使用。在适配用户代码库时，保留所选设计的结构信息和视觉证据。

## Export workflow / 导出流程

1. Call `get_guidelines` as the session entry, using the default page-generation scope unless another active MasterGo workflow needs additional scopes.
2. Call `get_selection_node` first and keep the document, page, root, target, and `data-node-id` information.
3. Call `get_screenshot` for the same target before implementing it.
4. Call `get_frontend_code` only when the user explicitly requests code/export/implementation. Default to HTML unless the user requests another supported output.
5. Pass the absolute repository root as `projectDir` and preserve the paths returned by the tool.
6. Adapt the exported HTML/CSS to the existing framework and project conventions without discarding the node mapping needed for comparison.
7. Render or test the local implementation when the workspace provides a runnable app, then compare it with the MasterGo screenshot.

## Refinement and diff / 修正与差异

- When the user says the existing export is inaccurate, modify the already generated local files. Do not call `get_frontend_code` again and overwrite the user's refinements.
- Refresh visual context with `get_screenshot` and use `get_design_diff` against the stored baseline when node-level changes matter.
- Treat the screenshot and browser render as complementary: node data explains structure; pixels expose spacing, typography, clipping, and asset mismatches.
- Keep generated assets inside the user's project and report every created or modified path.

## Boundaries / 边界

- Do not write back to MasterGo unless the user also requests a canvas change.
- Do not invent unavailable fonts, components, or assets; use clear fallbacks and disclose them.
- Do not use `agent_sync_design` merely to finish a code export. Full canvas overwrite is a separate destructive action requiring explicit confirmation.
- Finish with the target node IDs, local paths, verification performed, and any remaining fidelity limitation.
