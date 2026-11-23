#!/usr/bin/env node
import process from "node:process";
import { startBridge } from "../src/server.js";

const VERSION = "0.2.1";

function usage() {
  console.log(`Data Edit v${VERSION}

Usage:
  dataedit start [--port 43172]
  dataedit --version
  dataedit --help
`);
}

function readSecret(promptText) {
  return new Promise((resolve, reject) => {
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
          resolve(value.trim());
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

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    usage();
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION);
    return;
  }
  if (args[0] !== "start") {
    usage();
    process.exitCode = 1;
    return;
  }

  let port = 43172;
  const portIndex = args.indexOf("--port");
  if (portIndex >= 0) {
    port = Number(args[portIndex + 1]);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      throw new Error("Port must be an integer between 1024 and 65535.");
    }
  }

  const apiKey = await readSecret("Roblox Open Cloud API Key (input hidden): ");
  if (apiKey.length < 20 || /\s/.test(apiKey)) throw new Error("The API key looks invalid.");

  const result = await startBridge({ apiKey, port });
  console.log("\nData Edit local connector is running.");
  console.log(`Listening: http://${result.host}:${result.port}`);
  console.log("Health:    http://127.0.0.1:" + result.port + "/health");
  console.log("\nPaste these values into Data Edit > Settings > Local:");
  console.log(`Bridge URL: http://127.0.0.1:${result.port}/v1/opencloud`);
  console.log(`Pairing token: ${result.pairingToken}`);
  console.log("\nThe API key and pairing token are held in memory only.");
  console.log("Keep this terminal open while using Local Mode. Press Ctrl+C to stop.\n");

  const shutdown = () => {
    result.server.close(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Data Edit:", error.message);
  process.exitCode = 1;
});
