# Connect Roamies to Orion

Roamies can expose its existing desktop capabilities to Orion through a stateless Model Context Protocol (MCP) endpoint. Orion remains the coordinating brain and model router; Roamies remains the desktop-side executor for screen awareness, app/window inspection, browser navigation, desktop interaction, reminders and local memory.

## What is included

- The sidecar starts an authenticated MCP endpoint at `http://127.0.0.1:18789/mcp`.
- A random 256-bit bearer token is created once and stored using Roamies' existing OS secure-secret store (macOS Keychain, Windows DPAPI, Linux Secret Service). It is never written to normal settings or logs.
- Orion can discover the same tool schemas Roamies uses internally and call those tools through the existing execution path.
- Tool calls are serialized because the desktop tools share screen/window state.
- Existing Roamies permissions and action prompts remain authoritative. A remote MCP connection does not switch on file edits, commands or desktop actions by itself.
- The endpoint binds to loopback only. It rejects browser-origin requests, requires bearer authentication, has a request-size limit, and does not expose a public/LAN listener.

## Pairing Orion

1. Start Roamies and open its tray/menu-bar menu.
2. Choose **Connect Orion…**. Roamies reveals the local endpoint and one-time-to-copy bearer credential in its panel. Treat the token like a password.
3. If Orion runs on another device (for example, an Android phone), make the loopback endpoint reachable only through a trusted HTTPS mesh/reverse proxy such as Tailscale Serve. Do not port-forward 18789, expose the plain HTTP listener to a LAN, or use a public unauthenticated tunnel.
4. In Orion, open **Settings → Integrations → Remote MCP**, configure the HTTPS proxy URL ending in `/mcp`, enter the bearer token, pair the endpoint, and discover tools.
5. Test with a read-only request first: ask Orion to inspect the frontmost desktop window. Check Roamies' panel and confirm the request is visible.

For Orion running on the same computer, use the loopback URL directly. For remote access, the HTTPS proxy's hostname and certificate must be trusted by Android; the MCP bearer token remains required as a second layer.

## Capabilities

Orion can use the exposed Roamies tools for:
- Desktop context: screenshots, open windows, frontmost window text and controls
- Browser and web work: fetch URLs, open sites, inspect and interact with pages
- Desktop workflows: interact with supported apps, subject to Roamies' own permissions and confirmation prompts
- Personal continuity: reminders/commitments, saved facts and task lists
- Local files and commands: only under the existing Roamies file/command settings and path/command policy

This allows Orion's selected model to plan the work while Roamies performs the desktop-specific operations. The tool result is returned to Orion so it can continue the same objective and report the actual outcome.

## Social accounts and online actions

Roamies can interact with websites and desktop apps using the signed-in session already available to the user, where the platform and operating-system permissions allow it. This does **not** grant access to saved passwords, cookies, private browser databases or hidden account tokens. It does not bypass authentication, MFA, CAPTCHAs, platform restrictions or rate limits.

Reading, drafting and navigation can be delegated. Sending messages, publishing posts, purchases, transfers, deletion, account changes and other consequential actions continue to use Roamies' existing confirmation flow. Orion must report only what the tool result verifies; a drafted message is not a sent message.

## Troubleshooting

- **Bridge unavailable:** check Roamies diagnostics and confirm the OS secure-secret store is available/unlocked.
- **401:** copy the current token again from **Connect Orion…** and update Orion's encrypted MCP credential.
- **TLS/connection error from Android:** check that the HTTPS mesh/reverse proxy is online and that its certificate is trusted. Do not solve this by exposing the plain HTTP port.
- **No desktop interaction tools:** check platform support and grant Roamies the required OS accessibility/screen permissions. Some features are unavailable on Linux/Wayland.
- **Actions do not run:** check Roamies' Allow File Edits & Commands setting and the specific confirmation prompt.

The bridge is a desktop capability adapter, not a cloud agent service. It runs only while Roamies is running; the computer must be awake and connected for Orion to use it.
