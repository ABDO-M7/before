/**
 * ✅ Custom Image Loader for Next.js
 * Bypasses Next.js image optimization for external images
 * This fixes 404 errors when Next.js can't fetch images from API
 * 
 * This loader returns image URLs as-is, bypassing Next.js optimization
 * which can't access images from the API server.
 */

export default function imageLoader({ src, width, quality }) {
    // Return the image URL as-is (no Next.js optimization)
    // This bypasses the Next.js image optimization server which was causing 404 errors
    // Images will load directly from the API server
    
    // If image is already a full URL (external), return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // For relative paths (should already be normalized by normalizeImageUrl)
    // Return as-is - browser will resolve relative to current domain
    return src;
  }
  