'use client'
import React from 'react'
import toast from "@/utils/toast"

const BlogCopyUrl = ({ currentUrl, tCopySuccess, children }) => {
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl)
            toast.success(tCopySuccess || "Copied to clipboard")
        } catch (error) {
            console.error("Error copying to clipboard:", error)
        }
    }

    return (
        <div onClick={handleCopyUrl} style={{ cursor: 'pointer' }}>
            {children}
        </div>
    )
}

export default BlogCopyUrl
