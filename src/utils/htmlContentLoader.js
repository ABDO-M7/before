import fs from 'fs';
import path from 'path';

/**
 * Loads HTML content from a file or API
 * 
 * @param {string} pageIdentifier - The page identifier (e.g., 'test')
 * @param {string} apiEndpoint - Optional custom API endpoint
 * @returns {Promise<string>} - The HTML content
 */
export async function loadHTMLContent(pageIdentifier, apiEndpoint = null) {
  // Try to fetch from API first
  if (apiEndpoint || process.env.NEXT_PUBLIC_API_URL) {
    try {
      const endpoint = apiEndpoint || 
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}dynamic-content?page=${pageIdentifier}`;
      
      const response = await fetch(endpoint, {
        next: { revalidate: 60 } // Revalidate every minute
      });
      
      if (response.ok) {
        const data = await response.json();
        // API might return HTML directly or in a data field
        const html = data?.html || data?.content || data?.data?.html || data?.data?.content;
        
        if (typeof html === 'string' && html.trim()) {
          return html;
        }
      }
    } catch (error) {
      console.log('API fetch failed, trying local file:', error.message);
    }
  }

  // Fallback to local content.html file
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', pageIdentifier, 'content.html');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } else {
      throw new Error(`Content file not found at: ${filePath}`);
    }
  } catch (error) {
    console.error('Error loading HTML content:', error);
    throw error;
  }
}
