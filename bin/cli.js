#!/usr/bin/env node
import process from "node:process";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { startBridge } from "../src/server.js";
import { notifyIfUpdateAvailable, runUpdate } from "../src/update.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = JSON.parse(readFileSync(resolve(PACKAGE_ROOT, "package.json"), "utf8"));
const VERSION = PACKAGE.version;

function usage() {
  console.log(`Data Edit Local Bridge v${VERSION}

Usage:
  dataedit start [--port 43172]
  dataedit update
  dataedit --version
  dataedit --help

Commands:
  start     Start the local connector
  update    Install the latest version from GitHub
  --version Show the installed version
  --help    Show this help message
`);
}

function readSecret(promptText) {
  return new Promise((resolveSecret, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal so the API key can be entered without echo."));
      return;
    }

    const stdin = process.stdin;
    let value = "";
    process.stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolveSecret(value.trim());
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else if (char >= " ") {
          value += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}

function update() {
  console.log(`Checking and installing the latest Data Edit Local Bridge from GitHub...`);
  const npm = runUpdate();
  const result = spawnSync(npm.command, npm.args, npm.options);

  if (result.error) {
    throw new Error(`Could not start npm: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`npm update failed with exit code ${result.status ?? "unknown"}. Check the npm output above and try again.`);
  }

  console.log("\nData Edit Local Bridge was updated successfully.");
  console.log("Run `dataedit --version` to verify the installed version.");
}

async function start(args) {
  let port = 43172;
  const portIndex = args.indexOf("--port");
  if (portIndex >= 0) {
    port = Number(args[portIndex + 1]);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      throw new Error("Port must be an integer between 1024 and 65535.");
    }
  }

  const apiKey = await readSecret("Roblox Open Cloud API Key (input hidden): ");
  if (apiKey.length < 20 || apiKey.length > 4096 || /\s/.test(apiKey)) {
    throw new Error("The API key looks invalid. Paste only the complete key value.");
  }

  const result = await startBridge({ apiKey, port });
  console.log(`\nData Edit Local Bridge v${VERSION} is running.`);
  console.log(`Listening: http://${result.host}:${result.port}`);
  console.log(`Health:    http://127.0.0.1:${result.port}/health`);
  console.log("\nPaste these values into Data Edit > Settings > Local:");
  console.log(`Bridge URL: http://127.0.0.1:${result.port}/v1/opencloud`);
  console.log(`Pairing token: ${result.pairingToken}`);
  console.log("\nThe API key and pairing token are held in memory only.");
  console.log("Keep this terminal open while using Local Mode. Press Ctrl+C to stop.\n");

  // This check is deliberately non-blocking and never prevents the bridge starting.
  void notifyIfUpdateAvailable(VERSION);

  const shutdown = () => {
    result.server.close(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    usage();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION);
    return;
  }

  if (command === "update") {
    update();
    return;
  }

  if (command === "start") {
    await start(args.slice(1));
    return;
  }

  usage();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error("Data Edit:", error.message);
  process.exitCode = 1;
});
