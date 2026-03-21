import { logoutSuccess } from "../redux/reuducer/authSlice";
import { store } from "@/redux/store";
import { t } from "@/utils/translate";
import axios from "axios";
// sweetalert2 lazy-loaded only on 401 error (~50KB saved from initial bundle)
import { redactDeep, redactHeaders } from "@/utils/logUtils";

const Api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`,
});


let isUnauthorizedToastShown = false;
const isClientMonitoringEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_CLIENT_MONITORING === "true";

Api.interceptors.request.use(function (config) {
  // Add metadata for timing
  try {
    config.metadata = { startTime: Date.now() };
  } catch (e) {}
  let token = undefined;
  let langCode = undefined;
  if (typeof window !== "undefined") {
    const state = store.getState();
    token = state?.UserSignup?.data?.token;
    langCode = state?.CurrentLanguage?.language?.code;
  }

  if (token) config.headers.authorization = `Bearer ${token}`;
  if (langCode) config.headers["Content-Language"] = langCode;

  // --- API request logging (dev only) ---
  const shouldLogApi = (typeof process !== "undefined") && (process.env.NODE_ENV === "development");
  try {
    if (shouldLogApi) {
    // Build full URL including baseURL and params
    const buildFullUrl = (cfg) => {
      try {
        const base = cfg.baseURL || "";
        const urlObj = new URL(cfg.url, base);
        if (cfg.params && typeof cfg.params === "object") {
          Object.entries(cfg.params).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (Array.isArray(v)) v.forEach((item) => urlObj.searchParams.append(k, item));
            else urlObj.searchParams.append(k, v);
          });
        }
        return urlObj.toString();
      } catch (e) {
        return (cfg.baseURL || "") + (cfg.url || "");
      }
    };

    const formatBody = (data) => {
      if (!data) return "";
      try {
        if (typeof data === "string") return data;
        if (typeof FormData !== "undefined" && data instanceof FormData) {
          const obj = {};
          for (const pair of data.entries()) obj[pair[0]] = pair[1];
          return JSON.stringify(obj);
        }
        return JSON.stringify(data);
      } catch (e) {
        return String(data);
      }
    };

    const fullUrl = buildFullUrl(config);
    // Only log method + full URL for quiet, safe dev logging
    if (shouldLogApi) console.log(`[API Request] ${((config.method || "get").toUpperCase())} ${fullUrl}`);
    }
  } catch (err) {
    // Non-fatal logging error
    console.log("[API Request]", config?.method, config?.url, config?.params);
  }

  return config;
});

// Add a response interceptor
Api.interceptors.response.use(
  function (response) {
    // ✅ Track API performance
    if (response.config?.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      const url = (response.config?.baseURL || '') + (response.config?.url || '');
      
      if (isClientMonitoringEnabled && typeof window !== 'undefined') {
        import('@/utils/analyticsDashboard').then(({ analyticsDashboard }) => {
          analyticsDashboard.trackAPICall(url, duration, response.status);
        }).catch(() => {});
      }
      
      if (isClientMonitoringEnabled && duration > 1000 && typeof window !== 'undefined') {
        import('@/utils/rumTracking').then(({ rumTracker }) => {
          rumTracker.trackPerformanceMetric(
            `api_${response.config.url}`,
            duration,
            'ms'
          );
        }).catch(() => {});
      }

      // Log in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow API call: ${response.config.url} took ${duration}ms`);
      }
    }

    // NOTE: response logging can be verbose. It's intentionally disabled to keep console output short.
    // If you need response-level logs temporarily, uncomment the block below.
    /*
    try {
      const shouldLogApi = (typeof process !== "undefined") && (process.env.NODE_ENV === "development");
      if (shouldLogApi) {
        const method = (response.config?.method || "get").toUpperCase();
        const url = (response.config?.baseURL || "") + (response.config?.url || "");
        const duration = response.config?.metadata ? Date.now() - response.config.metadata.startTime : undefined;
        const status = response.status;
        const redactedResponse = redactDeep(response.data);
        console.log(`[API Response] ${status} ${method} ${url} ${duration ? duration + "ms" : ""} response: ${JSON.stringify(redactedResponse)}`);
      }
    } catch (e) {
      // ignore
    }
    */
    return response;
  },
  function (error) {
    // ✅ Track API errors
    if (isClientMonitoringEnabled && typeof window !== 'undefined') {
      import('@/utils/errorTracker').then(({ errorTracker }) => {
        const url = (error?.config?.baseURL || '') + (error?.config?.url || '');
        const status = error?.response?.status;
        const validError = error && typeof error === 'object' && Object.keys(error).length > 0 
          ? error 
          : { message: 'Unknown network error', code: 'UNKNOWN_ERROR' };
        
        if (status) {
          errorTracker.trackAPIError(url, status, validError, {
            method: error?.config?.method,
            duration: error?.config?.metadata?.startTime 
              ? Date.now() - error.config.metadata.startTime 
              : undefined,
          });
        } else {
          errorTracker.trackNetworkError(url, validError, {
            method: error?.config?.method,
          });
        }
      }).catch(() => {});
    }

    // NOTE: error response logging is disabled to avoid leaking large payloads. Uncomment below to enable temporarily.
    /*
    try {
      const shouldLogApi = (typeof process !== "undefined") && (process.env.NODE_ENV === "development");
      if (shouldLogApi) {
        const cfg = error.config || {};
        const method = (cfg.method || "get").toUpperCase();
        const url = (cfg.baseURL || "") + (cfg.url || "");
        const duration = cfg?.metadata ? Date.now() - cfg.metadata.startTime : undefined;
        const status = error.response?.status;
        const redactedResponse = error.response ? redactDeep(error.response.data) : null;
        console.log(`[API Error] ${status || "ERR"} ${method} ${url} ${duration ? duration + "ms" : ""} response: ${JSON.stringify(redactedResponse)}`);
      }
    } catch (e) {}
    */
    if (error.response && error.response.status === 401) {
      // Call the logout function if the status code is 401
      logoutSuccess();
      if (!isUnauthorizedToastShown) {
        import('sweetalert2').then(({ default: Swal }) => {
          Swal.fire({
            icon: "error",
            title: t("oops"),
            text: t("userDeactivatedByAdmin"),
            allowOutsideClick: false,
            customClass: {
              confirmButton: "Swal-confirm-buttons",
            },
          });
        });
        isUnauthorizedToastShown = true;
        // Reset the flag after a certain period
        setTimeout(() => {
          isUnauthorizedToastShown = false;
        }, 3000); // 3 seconds delay before allowing another toast
      }
    }
    return Promise.reject(error);
  }
);

export default Api;
