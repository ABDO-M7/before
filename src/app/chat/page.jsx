"use client";
import Layout from "@/components/Layout/Layout"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// ✅ Lazy load Chat Messages component for better code splitting
const Messages = dynamic(
  () => import("@/components/PagesComponent/Chat/Messages"),
  {
    loading: () => <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading chat...</div>,
    ssr: false, // Chat is client-side only
  }
)

const ChatPage = () => {
    return (
        <Layout>
            <Suspense fallback={<div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading chat...</div>}>
                <Messages />
            </Suspense>
        </Layout>
    )
}

export default ChatPage