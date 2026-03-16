import DynamicHTMLContent from '@/components/DynamicHTMLContent';
import { loadHTMLContent } from '@/utils/htmlContentLoader';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';

/**
 * Dynamic HTML Content Page
 * 
 * This page loads HTML content dynamically from:
 * 1. API endpoint: ${NEXT_PUBLIC_API_URL}${NEXT_PUBLIC_END_POINT}dynamic-content?page=test
 * 2. Fallback: src/app/test/content.html
 * 
 * To use this pattern for other pages:
 * 1. Create a folder: src/app/[your-page-name]/
 * 2. Create page.jsx with this same structure (change 'test' to your page name)
 * 3. Create content.html in the same folder (optional, if API is not available)
 * 4. The API should return: { html: "<html>...</html>" } or { content: "<html>...</html>" }
 */
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

export default async function TestPage() {
  let htmlContent = '';
  
  try {
    // Load HTML content from API or local file
    // Change 'test' to your page identifier for other pages
    htmlContent = await loadHTMLContent('test');
  } catch (error) {
    console.error('Error loading content:', error);
    // Fallback to empty content or error message
    htmlContent = '<div class="p-8 text-center"><h1 class="text-red-600">Error loading content</h1><p>' + error.message + '</p></div>';
  }

  return (
    <>
      <Header />
      <DynamicHTMLContent htmlContent={htmlContent} pageIdentifier="test" />
      <Footer />
    </>
  );
}
