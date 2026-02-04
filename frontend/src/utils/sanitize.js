/**
 * Utility functions for sanitizing user-generated content
 * to prevent XSS (Cross-Site Scripting) attacks.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Removes potentially dangerous tags and attributes while preserving safe formatting.
 *
 * @param {string} dirty - The unsanitized HTML string
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML safe for rendering
 */
export function sanitizeHtml(dirty, options = {}) {
  if (!dirty) return '';

  const defaultOptions = {
    // Allow basic formatting tags
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    // Allow only safe protocols for links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text to prevent XSS.
 * Escapes HTML entities and removes scripts.
 * Use this for displaying user input that should be treated as plain text.
 *
 * @param {string} text - The unsanitized text
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],  // No HTML tags allowed
    ALLOWED_ATTR: [],  // No attributes allowed
  });
}

/**
 * Sanitize a comment or user-generated content.
 * Allows basic formatting but removes dangerous content.
 *
 * @param {string} comment - The unsanitized comment
 * @returns {string} - Sanitized comment
 */
export function sanitizeComment(comment) {
  return sanitizeHtml(comment, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'code'],
    ALLOWED_ATTR: ['href'],
  });
}

/**
 * Component for safely rendering sanitized HTML.
 * Use this when you need to render user-generated HTML content.
 *
 * Example usage:
 * <SafeHtml html={userGeneratedContent} />
 *
 * @param {Object} props - Component props
 * @param {string} props.html - The HTML to sanitize and render
 * @param {string} props.className - Optional CSS class
 * @param {Object} props.sanitizeOptions - Optional DOMPurify options
 */
export function SafeHtml({ html, className = '', sanitizeOptions = {} }) {
  const clean = sanitizeHtml(html, sanitizeOptions);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
