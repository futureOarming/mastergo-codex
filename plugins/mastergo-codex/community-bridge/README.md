# MasterGo Community Bridge

This bridge adds a community-plugin transport for users who do not have MasterGo's official Vibe MCP feature.

## Architecture

1. Codex starts the local `mastergo-community` MCP server.
2. The server exposes a localhost command queue on port `50778`.
3. The user runs `MasterGo Codex Bridge` inside the active MasterGo file. The plugin discovers the localhost URL and six-digit code, then remembers the session on this device.
4. The MasterGo plugin polls for commands, executes allow-listed operations with the `mg` Plugin API, and returns results.

## Development install

In MasterGo desktop, open **Plugins → Developer mode → Create/Add plugin** and import:

`community-bridge/mastergo-plugin/manifest.json`

Then restart Codex after reinstalling this Codex plugin. Run `MasterGo Codex Bridge`; it should display the current pairing code and connect automatically. Use `community_status` and `community_get_selection` to verify the connection.

The bridge address is always `http://127.0.0.1:50778`. Every user sees the same address string, but `127.0.0.1` points to that user's own computer, so users do not share a bridge instance. The address field is disabled to prevent accidental edits.

The pairing code belongs to the local bridge process. It changes when that process restarts, but the MasterGo plugin refreshes it automatically. Manual re-pairing is only needed when localhost discovery is blocked.

## Current community-mode tools

- `community_status`
- `community_get_selection`
- `community_get_screenshot`
- `community_create_frame`
- `community_create_component_from_selection`

The official MCP remains the full-featured transport. Community mode is an MVP compatibility path and will grow behind the same safety rules.

Run `npm install && npm run build` in `community-bridge/server` after changing the bridge source. Codex launches the bundled `dist/index.js`, so runtime installation does not depend on `node_modules`.

## Browser security note

MasterGo plugin UI runs in a sandboxed iframe. Some environments may block HTTP localhost requests from an HTTPS canvas. The current community transport intentionally supports only the fixed localhost endpoint; a future HTTPS/WSS relay should be introduced as an explicit transport mode instead of making the normal address field editable.
