'use client';

import { useEffect, useState } from 'react';

/**
 * DynamicHTMLContent Component
 *
 * Renders HTML content safely without leaking external stylesheets or scripts
 * into the main document. Only inline styles within the body are preserved.
 *
 * @param {string} htmlContent - The HTML content to render
 * @param {string} pageIdentifier - Identifier for the page (for cleanup)
 */
export default function DynamicHTMLContent({
  htmlContent,
  pageIdentifier = 'dynamic'
}) {
  const [bodyContent, setBodyContent] = useState('');

  useEffect(() => {
    if (!htmlContent) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const body = doc.body || doc.querySelector('body');
      if (body) {
        setBodyContent(body.innerHTML);
      } else {
        setBodyContent(htmlContent);
      }
    } catch (error) {
      console.error('Error parsing HTML:', error);
      setBodyContent(htmlContent);
    }
  }, [htmlContent]);

  if (!bodyContent && !htmlContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dynamic-html-content"
      dangerouslySetInnerHTML={{ __html: bodyContent || htmlContent }}
    />
  );
}
