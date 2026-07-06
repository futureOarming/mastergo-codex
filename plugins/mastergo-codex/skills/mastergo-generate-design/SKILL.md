---
name: mastergo-generate-design
description: Generate, submit, and visually verify complete pages or substantial sections in the active MasterGo file. Use when the user asks to design, create, build, or send a page, screen, dashboard, landing page, or multi-section layout to MasterGo, including work that should use local components, subscribed libraries, or variables.
---

# MasterGo Generate Design / 页面生成

Use together with `mastergo-use`. Build one page at a time through MasterGo's governed HTML/DSL workflow.

与 `mastergo-use` 配合使用。通过 MasterGo 受控的 HTML/DSL 工作流逐页生成。

## Workflow / 工作流

1. Call `get_guidelines` with the page-generation scope before composing any payload. Treat the returned rules as mandatory and fresher than this skill.
2. If the request should follow an existing design system:
   - Call `get_library_list` and resolve an ambiguous library with the user.
   - Call `get_component_info` for the selected source.
   - Call `get_variables` with the absolute project root.
   - Use only component, icon, property, and variable names present in those snapshots.
3. Call `design_page` first for every page-level request. Let its returned instructions drive preparation and submission.
4. Submit exactly one page per generation cycle. For multiple pages, repeat the full cycle separately.
5. After submission, re-read the created root and capture a screenshot. Fix visible or structural mismatches incrementally.

## Payload rules / 生成约束

- Follow the exact syntax returned by `get_guidelines`; do not rely on generic browser HTML assumptions.
- Send only the required root fragment. Do not add document wrappers, scripts, remote stylesheets, or unsupported controls.
- Prefer the discovered MasterGo components and variables when requested. Do not fabricate design-system names.
- Preserve explicit pixel dimensions and complete flex relationships required by the returned rules.
- Use ordinary page generation for “send/sync this new design to MasterGo.” Reserve `agent_sync_design` for full overwrite from an already existing local code file.
- Do not use arbitrary JavaScript as a design payload.

## Visual acceptance / 视觉验收

The first successful submission is a draft. Verify hierarchy, spacing, text wrapping, contrast, alignment, component usage, and image placement with structured data plus a screenshot. Continue until the result matches the request, then report the returned document/page/root node IDs.
