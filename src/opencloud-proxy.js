const API_BASE = "https://apis.roblox.com/cloud/v2/";
const MAX_BODY_BYTES = 1024 * 1024;

function decodeSegment(segment) {
  try { return decodeURIComponent(segment); }
  catch { return null; }
}

export function validatePathAndMethod(methodValue, path) {
  const method = String(methodValue || "").toUpperCase();
  if (typeof path !== "string" || path.length > 2048 || path.startsWith("/") || path.includes("?") || path.includes("#")) return false;
  const parts = path.split("/");
  if (parts.some((part) => {
    const decoded = decodeSegment(part);
    return !part || decoded === null || [".", ".."].includes(decoded)
      || decoded.includes("/") || decoded.includes("\\")
      || /[\u0000-\u001f]/.test(decoded);
  })) return false;
  if (!parts.every((part) => /^[A-Za-z0-9._~%+@-]+$/.test(part))) return false;
  if (path === "data-stores") return method === "GET";
  if (/^data-stores\/[^/]+$/.test(path)) return method === "DELETE";
  if (/^data-stores\/[^/]+\/scopes\/[^/]+\/entries$/.test(path)) return method === "GET" || method === "POST";
  if (/^data-stores\/[^/]+\/scopes\/[^/]+\/entries\/[^/]+$/.test(path)) return method === "GET" || method === "PATCH" || method === "DELETE";
  return false;
}

function validateQuery(method, path, query) {
  if (query == null) return {};
  if (typeof query !== "object" || Array.isArray(query)) throw new Error("query must be an object.");
  const isStoreList = path === "data-stores";
  const isEntryList = /\/entries$/.test(path) && method === "GET";
  const isEntryCreate = /\/entries$/.test(path) && method === "POST";
  const allowed = isStoreList || isEntryList
    ? new Set(["maxPageSize", "pageToken", ...(isEntryList ? ["filter"] : [])])
    : isEntryCreate ? new Set(["id"]) : new Set();
  const output = {};
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.has(key)) throw new Error(`Unsupported query parameter: ${key}`);
    const text = String(value);
    const max = key === "pageToken" ? 4096 : key === "filter" ? 1024 : 100;
    if (text.length > max) throw new Error(`Query parameter ${key} is too long.`);
    output[key] = text;
  }
  return output;
}

export async function forwardToRoblox({ apiKey, universeId, method, path, query, body, timeoutMs = 25000 }) {
  if (typeof apiKey !== "string" || apiKey.length < 20 || apiKey.length > 512 || /\s/.test(apiKey)) {
    throw new Error("The Open Cloud API key is missing or invalid.");
  }
  const universe = String(universeId ?? "");
  if (!/^\d{1,24}$/.test(universe) || /^0+$/.test(universe)) {
    throw new Error("Universe ID must be a positive whole number.");
  }
  const normalizedMethod = String(method || "").toUpperCase();
  if (!["GET", "POST", "PATCH", "DELETE"].includes(normalizedMethod)) throw new Error("Unsupported HTTP method.");
  if (!validatePathAndMethod(normalizedMethod, path)) throw new Error("The requested DataStore API operation is not allowed.");
  if (body != null && typeof body !== "string") throw new Error("Upstream body must be a JSON string.");
  if (typeof body === "string" && Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new Error("Upstream body is too large.");

  const safeQuery = validateQuery(normalizedMethod, path, query);
  const url = new URL(`universes/${universe}/${path}`, API_BASE);
  for (const [key, value] of Object.entries(safeQuery)) url.searchParams.set(key, value);

  const headers = { "x-api-key": apiKey };
  if (body != null) headers["Content-Type"] = "application/json";
  const response = await fetch(url, {
    method: normalizedMethod,
    headers,
    body: ["GET", "DELETE"].includes(normalizedMethod) ? undefined : body ?? undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const upstreamBody = await response.text();
  return {
    success: response.ok,
    upstreamStatus: response.status,
    upstreamBody
  };
}
