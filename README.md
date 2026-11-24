# Data Edit — Local Bridge

Local Node.js connector for the **Data Edit** Roblox Studio plugin. It runs on the user's own computer and forwards only the supported DataStore Open Cloud requests to Roblox.

**Repository:** https://github.com/Zarr000/DataEdit-Local-Bridge

---

## Requirements

- Node.js 20 or newer.
- Windows, macOS, or Linux.
- A Roblox Open Cloud API Key scoped to the intended experience and required DataStore permissions.

Create and manage the API Key in Roblox Creator Dashboard → Credentials → API Keys.

**Keep your API Key private.**

---

## Installation

### Method 1 — Install directly from GitHub (Recommended)

Run these commands in PowerShell or Terminal:

```powershell
npm install -g github:Zarr000/DataEdit-Local-Bridge
```

Verify installation:

```powershell
dataedit --help
```

Start the bridge:

```powershell
dataedit start
```

### Method 2 — Install from downloaded ZIP

1. Open the repository:

   https://github.com/Zarr000/DataEdit-Local-Bridge

2. Click **Code → Download ZIP**.
3. Extract the downloaded ZIP.
4. Open PowerShell or Terminal inside the extracted folder containing `package.json`.
5. Run:

```powershell
npm install -g .
```

6. Start Data Edit Local Bridge:

```powershell
dataedit start
```

---

## Connecting to Roblox Studio

After starting the bridge:

1. Run `dataedit start` in an interactive terminal.
2. Enter your Roblox Open Cloud API Key when prompted. Input is hidden while typing.
3. The connector starts listening on `127.0.0.1`.
4. A temporary pairing token will be displayed in your terminal.
5. Open Roblox Studio.
6. Open the **Data Edit** plugin.
7. Navigate to **Settings → Local Connection**.
8. Enter your Universe ID.
9. Enter your DataStore scope.
10. Enter the Bridge URL and pairing token.
11. Connect.

### Default Bridge URL

```text
http://127.0.0.1:43172/v1/opencloud
```

The pairing token changes every time the connector starts.

Always use the latest token displayed in your terminal.

**Keep the bridge process running while using Local Mode.**

---

## Available Commands

Start the bridge:

```powershell
dataedit start
```

Start on a custom port:

```powershell
dataedit start --port 43173
```

Display help:

```powershell
dataedit --help
```

Display version:

```powershell
dataedit --version
```

Stop the bridge:

Press `Ctrl+C` in the terminal.

---

## Security

Data Edit Local Bridge is designed to keep Roblox Open Cloud credentials on the user's own computer.

Security characteristics:

- The service binds to `127.0.0.1` only.
- The service must not be exposed on `0.0.0.0`.
- Do not forward the bridge port to the public internet.
- The Roblox API Key is entered in the local terminal.
- API Key input is hidden while typing.
- The API Key is held in process memory only.
- The plugin receives a temporary pairing token, not the Roblox API Key.
- The pairing token is required for connector requests and changes on every restart.
- Do not share API Keys or pairing tokens.
- Never commit credentials or logs containing secrets.
- Local Mode avoids sending the API Key through the Exp Works hosted backend.

Local Mode does not protect credentials against other software that already has access to the same computer or process.

**Always test write and delete operations using a separate test experience first.**

---

## Troubleshooting

### EADDRINUSE

The default port is already being used by another application.

Try a different port:

```powershell
dataedit start --port 43173
```

Update the Bridge URL in the plugin to the URL printed by the connector.

### Plugin cannot connect

Check the following:

- The bridge terminal is still running.
- The URL uses `127.0.0.1`.
- The port matches the running bridge.
- You entered the latest pairing token.
- Roblox Studio has permission to make HTTP requests to localhost.

### Roblox returns 401 Unauthorized

Possible causes:

- The API Key is invalid.
- The API Key has expired.
- The API Key was revoked.

Check your credentials in Roblox Creator Dashboard.

### Roblox returns 403 Forbidden

Possible causes:

- The API Key does not have the required permissions.
- The API Key is not scoped to the correct experience.
- The requested DataStore operation is not permitted.

Review your Open Cloud API Key permissions.

### Universe ID error

Make sure the Universe ID belongs to the experience whose DataStore you want to access.

### Node is not recognized

Install Node.js 20 or newer.

After installation, restart PowerShell or Terminal and check:

```powershell
node --version
npm --version
```

---

## Development

There are no third-party npm runtime dependencies.

Check JavaScript syntax:

```powershell
npm run check
```

Start directly from the source:

```powershell
npm start
```

---

## npm Registry

The executable command is:

```powershell
dataedit
```

The package metadata name is currently:

```text
dataedit-local-bridge
```

The package has not been published to the npm registry.

Until publication, install directly from GitHub:

```powershell
npm install -g github:Zarr000/DataEdit-Local-Bridge
```

---

## License

MIT License.

See the `LICENSE` file for details.

---

**Data Edit**

Developed by **Exp Works**.
