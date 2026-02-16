import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty, options = {}) {
  if (!dirty) return '';

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(dirty, config);
}

export function sanitizeText(text) {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
  });
}

export function sanitizeComment(comment) {
  return sanitizeHtml(comment, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'code'],
    ALLOWED_ATTR: ['href'],
  });
}

export function SafeHtml({ html, className = '', sanitizeOptions = {} }) {
  const clean = sanitizeHtml(html, sanitizeOptions);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
