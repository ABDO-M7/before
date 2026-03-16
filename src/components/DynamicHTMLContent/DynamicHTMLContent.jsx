'use client';

import { useEffect, useState } from 'react';

/**
 * DynamicHTMLContent Component
 * 
 * Renders HTML content dynamically, including styles and scripts.
 * Designed to work with content that can change via API.
 * 
 * @param {string} htmlContent - The HTML content to render
 * @param {string} pageIdentifier - Identifier for the page (for cleanup)
 */
export default function DynamicHTMLContent({ 
  htmlContent,
  pageIdentifier = 'dynamic'
}) {
  const [styles, setStyles] = useState('');
  const [scripts, setScripts] = useState('');
  const [bodyContent, setBodyContent] = useState('');

  useEffect(() => {
    if (!htmlContent) return;

    try {
      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract styles from <head>
      const styleTags = doc.querySelectorAll('head style');
      const extractedStyles = Array.from(styleTags).map(tag => tag.innerHTML).join('\n');
      setStyles(extractedStyles);
      
      // Extract and inject external stylesheets
      const styleLinks = doc.querySelectorAll('head link[rel="stylesheet"]');
      styleLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) {
          // Check if link already exists
          const existingLink = document.querySelector(`link[href="${href}"]`);
          if (!existingLink) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = href;
            // Copy other attributes
            Array.from(link.attributes).forEach((attr) => {
              if (attr.name !== 'rel' && attr.name !== 'href') {
                newLink.setAttribute(attr.name, attr.value);
              }
            });
            document.head.appendChild(newLink);
          }
        }
      });
      
      // Extract scripts from <head> and <body>
      const scriptTags = doc.querySelectorAll('head script, body script');
      const extractedScripts = Array.from(scriptTags).map(script => script.outerHTML).join('\n');
      setScripts(extractedScripts);
      
      // Extract body content
      const body = doc.body || doc.querySelector('body');
      if (body) {
        setBodyContent(body.innerHTML);
      } else {
        // If no body tag, use the entire content
        setBodyContent(htmlContent);
      }
    } catch (error) {
      console.error('Error parsing HTML:', error);
      // Fallback: use content as-is
      setBodyContent(htmlContent);
    }
  }, [htmlContent]);

  // Inject styles into the document
  useEffect(() => {
    if (styles) {
      const styleElement = document.createElement('style');
      styleElement.id = `dynamic-styles-${pageIdentifier}`;
      styleElement.innerHTML = styles;
      
      // Remove old style if exists
      const oldStyle = document.getElementById(`dynamic-styles-${pageIdentifier}`);
      if (oldStyle) {
        oldStyle.remove();
      }
      
      document.head.appendChild(styleElement);

      // Cleanup function
      return () => {
        const styleToRemove = document.getElementById(`dynamic-styles-${pageIdentifier}`);
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, [styles, pageIdentifier]);

  // Execute scripts
  useEffect(() => {
    if (scripts) {
      const scriptContainer = document.createElement('div');
      scriptContainer.id = `dynamic-scripts-${pageIdentifier}`;
      scriptContainer.style.display = 'none';
      document.body.appendChild(scriptContainer);
      
      // Parse and execute scripts
      const parser = new DOMParser();
      const scriptDoc = parser.parseFromString(scripts, 'text/html');
      const scriptElements = scriptDoc.querySelectorAll('script');
      
      scriptElements.forEach((oldScript) => {
        const newScript = document.createElement('script');
        
        // Copy all attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Handle inline scripts
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        
        // Handle external scripts
        if (oldScript.src) {
          newScript.src = oldScript.src;
        }
        
        // Replace old script if exists (by src or id)
        const existingScript = oldScript.id 
          ? document.getElementById(oldScript.id)
          : document.querySelector(`script[src="${oldScript.src}"]`);
        
        if (existingScript) {
          existingScript.remove();
        }
        
        document.head.appendChild(newScript);
      });

      // Cleanup function
      return () => {
        const scriptsToRemove = document.getElementById(`dynamic-scripts-${pageIdentifier}`);
        if (scriptsToRemove) {
          scriptsToRemove.remove();
        }
      };
    }
  }, [scripts, pageIdentifier]);

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
