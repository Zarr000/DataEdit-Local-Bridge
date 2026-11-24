import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { forwardToRoblox } from "./opencloud-proxy.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = JSON.parse(readFileSync(resolve(PACKAGE_ROOT, "package.json"), "utf8")).version;

const HOST = "127.0.0.1";
const MAX_REQUEST_BYTES = 1024 * 1024;

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("Request body must be valid JSON.")); }
    });
    req.on("error", reject);
  });
}

function tokenMatches(header, token) {
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7), "utf8");
  const expected = Buffer.from(token, "utf8");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export async function startBridge({ apiKey, port = 43172 }) {
  if (typeof apiKey !== "string") {
    throw new Error("The API key was not received as text. Restart Data Edit and enter the key again.");
  }
  apiKey = apiKey.trim();
  if (apiKey.length < 20 || apiKey.length > 4096 || /\s/.test(apiKey)) {
    throw new Error("The API key input is malformed. Paste only the complete Roblox Open Cloud key, without spaces or extra text.");
  }

  const pairingToken = crypto.randomBytes(32).toString("hex");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${HOST}:${port}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { ok: true, service: "Data Edit", version: VERSION });
    }

    if (req.method !== "POST" || url.pathname !== "/v1/opencloud") {
      return json(res, 404, { message: "Route not found." });
    }

    if (!tokenMatches(req.headers.authorization, pairingToken)) {
      return json(res, 401, { message: "Invalid local pairing token." });
    }

    let payload;
    try {
      payload = await readJson(req);
    } catch (error) {
      return json(res, 400, { message: error.message });
    }

    try {
      const result = await forwardToRoblox({
        apiKey,
        universeId: payload?.universeId,
        method: payload?.method,
        path: payload?.path,
        query: payload?.query,
        body: payload?.body,
        timeoutMs: 25000
      });
      return json(res, 200, result);
    } catch (error) {
      const timeout = error?.name === "TimeoutError";
      return json(res, 400, {
        message: timeout ? "Roblox Open Cloud request timed out. Try again." : String(error?.message || "Unexpected Data Edit local connector error.")
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });

  return { server, pairingToken, host: HOST, port };
}
