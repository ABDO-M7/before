/**
 * ✅ Image Utility Functions
 * Helper functions for image optimization, blur placeholders, and responsive images
 */

/**
 * Generates a blur placeholder data URL for images
 * Creates a tiny 10x10 pixel image as a base64 data URL
 * @returns {string} Base64 data URL for blur placeholder
 */
export function generateBlurPlaceholder() {
  // Tiny 1x1 transparent pixel as base64
  // This is a minimal placeholder that Next.js can use for blur effect
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Creates a blur data URL from an image URL
 * Note: In production, you should generate blur data URLs server-side
 * @param {string} imageUrl - The image URL
 * @returns {Promise<string>} Blur data URL
 */
export async function getBlurDataURL(imageUrl) {
  // For client-side, return the minimal placeholder
  // In production, generate blur data URLs server-side using sharp or similar
  return generateBlurPlaceholder();
}

/**
 * Gets responsive image sizes for different breakpoints
 * @param {string} type - Image type ('card', 'hero', 'thumbnail', 'gallery')
 * @returns {object} Object with sizes and srcSet configuration
 */
export function getResponsiveImageSizes(type = 'card') {
  const sizes = {
    card: {
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
      srcSet: [220, 440, 660], // Widths for product cards
    },
    hero: {
      sizes: '100vw',
      srcSet: [640, 750, 828, 1080, 1200, 1920],
    },
    thumbnail: {
      sizes: '(max-width: 640px) 50vw, 200px',
      srcSet: [100, 200, 300],
    },
    gallery: {
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      srcSet: [400, 800, 1200],
    },
  };

  return sizes[type] || sizes.card;
}

/**
 * Validates if an image URL is valid
 * @param {string} url - Image URL to validate
 * @returns {boolean} True if URL is valid
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:')) return true; // Data URLs are valid
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('/')) return true; // Relative URLs are valid
  return false;
}

/**
 * Gets the optimal image format based on browser support
 * @returns {string} Preferred image format ('avif', 'webp', or 'jpg')
 */
export function getOptimalImageFormat() {
  if (typeof window === 'undefined') return 'webp'; // Server-side default
  
  // Check for AVIF support
  const avifSupported = document.createElement('canvas')
    .toDataURL('image/avif')
    .indexOf('data:image/avif') === 0;
  
  if (avifSupported) return 'avif';
  
  // Check for WebP support
  const webpSupported = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;
  
  if (webpSupported) return 'webp';
  
  return 'jpg'; // Fallback
}
