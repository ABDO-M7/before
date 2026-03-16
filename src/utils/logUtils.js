// Utility helpers for logging and redaction

const DEFAULT_SENSITIVE_KEYS = [
  "password",
  "pass",
  "pwd",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "auth",
  "otp",
  "ssn",
  "card_number",
  "card",
  "cvv",
  "cvc",
  "secret",
  "api_key",
];

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Deep clone with redaction for keys matched in the blacklist
export function redactDeep(value, blacklist = DEFAULT_SENSITIVE_KEYS) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  try {
    if (Array.isArray(value)) {
      return value.map((item) => redactDeep(item, blacklist));
    }

    if (isObject(value)) {
      const out = {};
      Object.keys(value).forEach((k) => {
        const lower = k.toLowerCase();
        if (blacklist.includes(lower) || blacklist.some((b) => lower.includes(b))) {
          out[k] = "***REDACTED***";
        } else {
          out[k] = redactDeep(value[k], blacklist);
        }
      });
      return out;
    }

    // Fallback: attempt to stringify then parse
    return value;
  } catch (e) {
    return "***REDACTED***";
  }
}

// Redact Authorization header value if present
export function redactHeaders(headers = {}) {
  const out = {};
  try {
    Object.entries(headers).forEach(([k, v]) => {
      const lower = k.toLowerCase();
      if (lower === "authorization" || lower === "auth" || lower.includes("token")) {
        out[k] = "***REDACTED***";
      } else {
        out[k] = v;
      }
    });
  } catch (e) {
    return {};
  }
  return out;
}

export default {
  redactDeep,
  redactHeaders,
};
