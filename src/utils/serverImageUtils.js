/**
 * ✅ Server-Safe Image Utilities
 * These functions mimic the logic in utils/index.jsx but are safe to run in Server Components (no "use client").
 */

export const serverNormalizeImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl.replace(/([^:]\/)\/+/g, '$1');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  if (!cleanApiUrl) {
    return imageUrl;
  }

  let cleanImagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const baseEndsWithPublic = /\/public$/i.test(cleanApiUrl);
  if (baseEndsWithPublic && /^\/public(\/|$)/i.test(cleanImagePath)) {
    cleanImagePath = cleanImagePath.replace(/^\/public/i, '');
  }

  return `${cleanApiUrl}${cleanImagePath}`.replace(/([^:]\/)\/+/g, '$1');
};

export const serverGetCompressedImage = (item, size = 'small', fallbackImage = null) => {
  if (typeof item === 'string') {
    return item || fallbackImage;
  }

  if (item && typeof item === 'object') {
    const compressed = item?.compressed;
    if (compressed && typeof compressed === 'object' && !Array.isArray(compressed)) {
      const compressedPath = compressed[size];
      if (compressedPath && compressedPath !== '' && compressedPath !== null && compressedPath !== undefined) {
        return compressedPath;
      }
      if (compressed.small) return compressed.small;
      if (compressed.medium) return compressed.medium;
      if (compressed.large) return compressed.large;
    }
    if (item.image) return item.image;
  }
  return fallbackImage || null;
};

/**
 * ✅ Mimics Next.js internal image loader for preloading.
 * URL format: /_next/image?url=[ENCODED_URL]&w=[WIDTH]&q=[QUALITY]
 */
export const serverGetOptimizedImageUrl = (url, width = 640, quality = 75) => {
  if (!url) return null;
  const normalized = serverNormalizeImageUrl(url);
  // Ensure we don't double proxy if it's already a relative path or local
  if (normalized.startsWith('/_next/image')) return normalized;
  
  const encodedUrl = encodeURIComponent(normalized);
  return `/_next/image?url=${encodedUrl}&w=${width}&q=${quality}`;
};
