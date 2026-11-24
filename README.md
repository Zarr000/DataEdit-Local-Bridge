# Data Edit — Local Connector

Local Node.js connector for the **Data Edit** Roblox Studio plugin. It runs on the user's own computer and forwards only the supported DataStore Open Cloud requests to Roblox.

## Requirements

- Node.js 20 or newer.
- Windows, macOS, or Linux.
- A Roblox Open Cloud API Key scoped to the intended experience and required DataStore permissions.

Create and manage the API Key in Roblox Creator Dashboard → Credentials → API Keys. Keep the key private.

## Install from GitHub

Create a GitHub repository named `dataedit` and upload the contents of this project to its repository root (so `package.json`, `bin/`, and `src/` are at the root).

Replace `YOUR_GITHUB_USERNAME` with the repository owner's GitHub username:

```powershell
npm install -g github:Zarr000/dataedit
dataedit --help
dataedit start
```

## Install from a downloaded ZIP

1. Download and extract this repository ZIP.
2. Open PowerShell or Terminal in the extracted folder containing `package.json`.
3. Run:

```powershell
npm install -g .
dataedit start
```

## Pair with the Data Edit plugin

1. Run `dataedit start` in an interactive terminal.
2. Enter the Roblox Open Cloud API Key when prompted. Input is hidden while typing.
3. The connector listens only on `127.0.0.1` and prints a temporary pairing token.
4. In Data Edit → Settings → Local, enter the Universe ID, DataStore scope, Bridge URL, and pairing token.
5. Keep the terminal open while using Local Mode.

Default URL:

```text
http://127.0.0.1:43172/v1/opencloud
```

The token changes every time the connector starts. Paste the latest token into the plugin.

## Commands

```powershell
dataedit start
 dataedit start --port 43173
dataedit --help
dataedit --version
```

To stop the connector, press `Ctrl+C` in its terminal.

## Security

- The service binds to `127.0.0.1` only. Do not expose it on `0.0.0.0` or forward its port to the internet.
- The Roblox API Key is entered in the local terminal and held in process memory only.
- The plugin receives a temporary pairing token, not the Roblox API Key.
- The pairing token is required for connector requests and changes on every restart.
- Do not share API Keys or pairing tokens, and do not commit credentials or logs containing secrets.
- Local Mode avoids sending the API Key through a hosted third-party backend; it does not protect against other software already running with access to the same computer or process.
- Test write and delete operations using a separate test experience first.

## Troubleshooting

### `EADDRINUSE`

The default port is already in use. Run `dataedit start --port 43173` and update the Bridge URL in the plugin to the URL printed by the connector.

### Plugin cannot connect

Check that the connector terminal is still running, the URL uses `127.0.0.1`, the port matches, and the latest pairing token was pasted.

### Roblox returns 401 or 403

Check that the API Key is active, scoped to the correct experience, and has the necessary DataStore permissions. Verify the Universe ID too.

### Node is not found

Install Node.js 20 or newer, restart the terminal, then run `node --version`.

## Development checks

There are no third-party npm runtime dependencies. Run:

```powershell
npm run check
```

## npm publication note

The executable command is **`dataedit`**. The npm package metadata currently uses **`dataedit-local-bridge`** because npm package names are globally unique and availability of the shorter `dataedit` name has not been confirmed. If this package is later published under its current metadata name, install it with:

```powershell
npm install -g dataedit-local-bridge
dataedit start
```

This package has not been published to npm. The GitHub installation command above is the intended installation path for now.
