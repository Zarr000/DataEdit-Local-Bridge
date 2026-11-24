const VERSION_URL = "https://raw.githubusercontent.com/Zarr000/DataEdit-Local-Bridge/main/package.json";
const GITHUB_INSTALL_SPEC = "github:Zarr000/DataEdit-Local-Bridge#main";

function parseVersion(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().replace(/^v/i, "").match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : null,
  };
}

function comparePrerelease(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (left === right) continue;

    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) return Number(left) < Number(right) ? -1 : 1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return left < right ? -1 : 1;
  }
  return 0;
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  if (!left || !right) throw new Error("Both versions must use valid semantic versioning (for example 0.3.0).");

  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
  }
  return comparePrerelease(left.prerelease, right.prerelease);
}

export async function checkForUpdate(currentVersion, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 3000;

  const response = await fetchImpl(VERSION_URL, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github.raw+json, application/json, text/plain",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Version check failed (HTTP ${response.status}).`);
  }

  const remotePackage = await response.json();
  const latestVersion = remotePackage?.version;

  if (!parseVersion(latestVersion)) {
    throw new Error("GitHub package.json does not contain a valid version.");
  }

  return {
    currentVersion,
    latestVersion,
    updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
  };
}

export async function notifyIfUpdateAvailable(currentVersion, output = console.log) {
  try {
    const status = await checkForUpdate(currentVersion);
    if (status.updateAvailable) {
      output("\nNew Version Available!");
      output(`Current version: ${status.currentVersion}`);
      output(`Latest version:  ${status.latestVersion}`);
      output("Run `dataedit update` to install the update.\n");
    }
    return status;
  } catch {
    // Updates are advisory. The bridge must continue to work if GitHub is offline.
    return null;
  }
}

export function runUpdate() {
  const args = [
    "install",
    "--global",
    "--force",
    "--prefer-online",
    "--allow-git=all",
    GITHUB_INSTALL_SPEC,
  ];
  const isWindows = process.platform === "win32";
  const command = isWindows ? "npm.cmd" : "npm";

  return {
    command,
    args,
    options: {
      stdio: "inherit",
      shell: isWindows,
      windowsHide: true,
    },
  };
}
