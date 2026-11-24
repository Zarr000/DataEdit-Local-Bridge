# Data Edit — Local Bridge

Local Node.js connector for the **Data Edit** Roblox Studio plugin. It runs on your computer and forwards supported DataStore Open Cloud requests to Roblox.

**Repository:** https://github.com/Zarr000/DataEdit-Local-Bridge  
**CLI command:** `dataedit`  
**Current release:** 0.3.0

## Requirements

- Node.js 20 or newer.
- Windows, macOS, or Linux.
- A Roblox Open Cloud API Key scoped to the intended experience and the DataStore permissions required by the operations you use.
- Git installed if installing or updating directly from GitHub through npm.

Create and manage API Keys in [Roblox Creator Dashboard → Credentials](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab). Keep your key private.

## Install from GitHub

On npm versions that block Git dependencies by default, use `--allow-git=all`:

```powershell
npm install -g --allow-git=all github:Zarr000/DataEdit-Local-Bridge#main
```

Verify the install:

```powershell
dataedit --version
dataedit --help
```

## Install from a downloaded ZIP

1. Download the repository ZIP from GitHub.
2. Extract it.
3. Open PowerShell or Terminal in the extracted folder containing `package.json`.
4. Install the package globally:

```powershell
npm install -g .
```

5. Run `dataedit --version` to verify it.

## Start the bridge

```powershell
dataedit start
```

The CLI prompts for your Roblox Open Cloud API Key. Input is hidden while typing. The bridge then listens on `127.0.0.1` and prints a temporary pairing token.

In Roblox Studio, open **Data Edit → Settings → Local** and enter:

- Universe ID
- DataStore scope
- Bridge URL printed by the CLI
- Pairing token printed by the CLI

Default bridge URL:

```text
http://127.0.0.1:43172/v1/opencloud
```

Keep the terminal open while using Local Mode. Stop the bridge with `Ctrl+C`. The pairing token changes every time the bridge starts.

## Automatic update notifications

Every time `dataedit start` runs, the CLI checks the `main` branch's `package.json` on GitHub for a newer version.

If a newer version is available, the bridge still starts normally and prints a notification similar to:

```text
New Version Available!
Current version: 0.3.0
Latest version:  0.3.1
Use `dataedit update` to install the update.
```

The update check is advisory. If GitHub is offline, unreachable, or returns an invalid version, the bridge continues starting without an update notification.

The check compares the installed package version with the `version` field in the repository's `main/package.json`. The repository maintainer must increase that version for each published update.

## Update manually

Run:

```powershell
dataedit update
```

This command runs npm to reinstall the latest `main` branch from this repository. It includes `--allow-git=all` for npm versions that require explicit permission to install Git dependencies.

After it completes, verify the installed version:

```powershell
dataedit --version
```

If an update fails, read the npm error above. Common causes include no internet connection, Git not installed, GitHub unavailable, or npm global-install permissions.

### First-time migration to v0.3.0

The `dataedit update` command is available starting in v0.3.0. To install v0.3.0 over an older release for the first time, run:

```powershell
npm install -g --allow-git=all github:Zarr000/DataEdit-Local-Bridge#main
```

After that, future updates can use `dataedit update`.

## Commands

```powershell
dataedit start
dataedit start --port 43173
dataedit update
dataedit --version
dataedit --help
```

If you use a custom port, enter the matching URL in the plugin, for example:

```text
http://127.0.0.1:43173/v1/opencloud
```

## Security

- The bridge binds to `127.0.0.1` only. Do not expose it on `0.0.0.0` or forward its port to the public internet.
- The Roblox API Key is entered in the local terminal and held in process memory only.
- The plugin receives a temporary pairing token, not the Roblox API Key.
- The pairing token is required for connector requests and changes on every restart.
- Do not share API Keys or pairing tokens.
- Do not commit credentials, `.env` files, or logs containing secrets.
- Local Mode avoids sending the Roblox API Key through the hosted Exp Works backend. It does not protect against other software already running with access to the same computer or process.
- Test write and delete operations using a separate test experience first.

## Troubleshooting

### `EADDRINUSE`

The default port is already in use. Run `dataedit start --port 43173`, then update the Bridge URL in the plugin.

### npm reports `EALLOWGIT`

Use the explicit permission flag:

```powershell
npm install -g --allow-git=all github:Zarr000/DataEdit-Local-Bridge#main
```

The built-in `dataedit update` command includes this flag automatically.

### Plugin cannot connect

Check that:

- The bridge terminal is still running.
- The URL uses `127.0.0.1` and the correct port.
- The latest pairing token was pasted into the plugin.
- Roblox Studio allows the plugin's HTTP request to localhost.

### Roblox returns 401 or 403

Check that the API Key is active, belongs to the intended experience, and has the required DataStore permissions. Also verify the Universe ID.

### Node is not recognized

Install Node.js 20 or newer, restart PowerShell or Terminal, and run:

```powershell
node --version
npm --version
```

### Update notification does not appear

The checker only notifies when the remote `package.json` version is greater than the installed version. Make sure the maintainer has committed a version bump to the repository's `main` branch. If GitHub cannot be reached, the check is skipped without stopping the bridge.

## Development

The bridge has no third-party runtime npm dependencies.

Run syntax checks and tests:

```powershell
npm run check
```

## Maintainer release checklist

For every new Local Bridge release:

1. Update `version` in `package.json` using semantic versioning.
2. Keep `bin/cli.js` reading its version from `package.json` (do not hardcode a second version number).
3. Update the service version returned by `/health` in `src/server.js` to match.
4. Run `npm run check`.
5. Commit and push the changes to `main`.

Once the new `package.json` version is live on GitHub, users running `dataedit start` will be notified. They can update with `dataedit update`.

## License

MIT. See [LICENSE](./LICENSE).

Developed by **Exp Works**.
