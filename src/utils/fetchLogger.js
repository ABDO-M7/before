// Universal fetch logger: patches both `globalThis.fetch` and `window.fetch` (when present)
// to log requests' method, full URL (with query params), body (when available), and response status/duration.
// Safe to import on server and client; it will not throw if `fetch` is not present.

function formatBody(body) {
  if (!body) return "";
  try {
    if (typeof body === "string") return body;
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const obj = {};
      for (const [k, v] of body.entries()) obj[k] = v;
      return JSON.stringify(obj);
    }
    if (typeof body === "object") return JSON.stringify(body);
    return String(body);
  } catch (e) {
    return String(body);
  }
}

function buildFullUrl(input) {
  try {
    if (typeof input === "string") return input;
    if (input && input.url) return input.url;
    // Request info object
    if (input && input instanceof Object && input.href) return input.href;
    return String(input);
  } catch (e) {
    return String(input);
  }
}

import { redactDeep, redactHeaders } from "@/utils/logUtils";

function patchFetch(scope) {
  if (!scope || typeof scope.fetch !== "function" || scope.__fetchLogged) return;
  const originalFetch = scope.fetch.bind(scope);

  scope.fetch = async function (input, init) {
    const isEnabled = (typeof process !== "undefined") && (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_LOG_API_REQUESTS === "true");
    const start = Date.now();
    let url;
    try {
      url = buildFullUrl(input);
      if (isEnabled) {
        const method = (init && init.method) || (input && input.method) || "GET";
        // Only log method + full URL to keep console output concise
        console.log(`[fetch] ${method.toUpperCase()} ${url}`);
      }
    } catch (err) {
      console.log("[fetch] error building log", err);
    }

    const response = await originalFetch(input, init);
    // NOTE: response logging is intentionally omitted to avoid verbose console output.
    // If you need to log responses temporarily in dev, uncomment and adjust the code below.
    /*
    try {
      if (isEnabled) {
        const duration = Date.now() - start;
        const status = response.status;
        // clone response to avoid consuming body
        let clone = response.clone();
        let bodyText = "";
        try {
          bodyText = await clone.text();
        } catch (e) {
          bodyText = "";
        }
        let parsedResp = null;
        try { parsedResp = bodyText ? JSON.parse(bodyText) : null; } catch (e) { parsedResp = bodyText; }
        console.log(`[fetch] ${status} ${url} ${duration}ms response: ${JSON.stringify(redactDeep(parsedResp))}`);
      }
    } catch (e) { console.log("[fetch] error reading response for log", e); }
    */

    return response;
  };

  scope.__fetchLogged = true;
}

export function initFetchLogger() {
  try {
    if (typeof globalThis !== "undefined") patchFetch(globalThis);
    if (typeof window !== "undefined") patchFetch(window);
  } catch (e) {
    // ignore
  }
}

export default initFetchLogger;
