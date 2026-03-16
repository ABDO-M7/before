"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import {
  getIsLoggedIn,
  userSignUpData,
  loadUpdateData,
  logoutSuccess,
} from "@/redux/reuducer/authSlice";
import Api from "@/api/AxiosInterceptors";
import { AUTH_BY_TOKEN } from "@/utils/api";

// TODO: Remove this debug popup after testing
const DEBUG_TOKEN_AUTH = false;

function TokenAuthHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const userData = useSelector(userSignUpData);
  const processingRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token || processingRef.current) return;

    if (DEBUG_TOKEN_AUTH) {
      setDebugInfo({ status: "detected", token, message: "Token detected in URL. Authenticating..." });
    }

    const handleTokenAuth = async () => {
      processingRef.current = true;

      try {
        const response = await Api.post(AUTH_BY_TOKEN, { token });
        const data = response.data;

        if (data.error) {
          console.error("Token auth failed:", data.message);
          if (DEBUG_TOKEN_AUTH) {
            setDebugInfo({ status: "error", token, message: `Auth failed: ${data.message}` });
          }
          cleanTokenFromUrl();
          return;
        }

        const newUserId = data?.data?.id;
        const currentUserId = userData?.id;

        if (isLoggedIn && currentUserId === newUserId) {
          if (DEBUG_TOKEN_AUTH) {
            setDebugInfo({ status: "skipped", token, message: `Same user already logged in (ID: ${newUserId})` });
          }
        } else if (isLoggedIn && currentUserId !== newUserId) {
          logoutSuccess();
          loadUpdateData(data);
          if (DEBUG_TOKEN_AUTH) {
            setDebugInfo({ status: "switched", token, message: `Switched from user ${currentUserId} → ${newUserId}` });
          }
        } else {
          loadUpdateData(data);
          if (DEBUG_TOKEN_AUTH) {
            setDebugInfo({ status: "success", token, message: `Logged in as user ID: ${newUserId} (${data?.data?.name || data?.data?.email || ""})` });
          }
        }

        cleanTokenFromUrl();
      } catch (error) {
        console.error("Token auth error:", error);
        if (DEBUG_TOKEN_AUTH) {
          setDebugInfo({ status: "error", token, message: `Request error: ${error?.response?.data?.message || error.message}` });
        }
        cleanTokenFromUrl();
      } finally {
        processingRef.current = false;
      }
    };

    const cleanTokenFromUrl = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("token");
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(newUrl);
    };

    handleTokenAuth();
  }, [token]);

  if (!DEBUG_TOKEN_AUTH || !debugInfo) return null;

  const bgColor = {
    detected: "#2196F3",
    success: "#4CAF50",
    switched: "#FF9800",
    skipped: "#9E9E9E",
    error: "#F44336",
  }[debugInfo.status] || "#333";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 99999,
        background: bgColor,
        color: "#fff",
        padding: "16px 20px",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        maxWidth: 400,
        fontSize: 14,
        fontFamily: "monospace",
        lineHeight: 1.6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>🔑 Token Auth Debug</strong>
        <button
          onClick={() => setDebugInfo(null)}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      <div>Status: <strong>{debugInfo.status.toUpperCase()}</strong></div>
      <div style={{ wordBreak: "break-all" }}>Token: {debugInfo.token?.substring(0, 20)}...</div>
      <div>{debugInfo.message}</div>
    </div>
  );
}

export default function TokenAuthHandler() {
  return (
    <Suspense fallback={null}>
      <TokenAuthHandlerInner />
    </Suspense>
  );
}
