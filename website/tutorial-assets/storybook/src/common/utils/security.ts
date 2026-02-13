/**
 * Security utilities for input sanitization and XSS protection
 */

// HTML entities that need escaping
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (match) => htmlEntities[match] || match);
}

/**
 * Sanitize user input to remove potentially harmful content
 */
export function sanitizeInput(input: string, options?: {
  allowedTags?: string[];
  maxLength?: number;
  stripScripts?: boolean;
}): string {
  const {
    maxLength = 10000,
    stripScripts = true,
  } = options || {};

  let sanitized = input;

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove script tags and content
  if (stripScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
    sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocol
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Validate and sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string, allowedHosts?: string[]): string {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Check for javascript: or data: protocols
    if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
      return '/';
    }

    // If allowedHosts is specified, validate the host
    if (allowedHosts && allowedHosts.length > 0) {
      if (!allowedHosts.includes(parsed.hostname)) {
        console.warn(`Blocked navigation to unauthorized host: ${parsed.hostname}`);
        return '/';
      }
    }

    // For relative URLs, return as-is
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // For absolute URLs, validate they're from allowed origins
    if (parsed.origin === window.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }

    return url;
  } catch (error) {
    // Invalid URL, return safe default
    return '/';
  }
}

/**
 * Create a Content Security Policy header value
 */
export function createCSP(options?: {
  reportUri?: string;
  nonce?: string;
}): string {
  const { reportUri, nonce } = options || {};
  
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Needed for Tailwind
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://api.example.com'], // Add your API domains
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  if (reportUri) {
    directives['report-uri'] = [reportUri];
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Rate limiting helper for API calls
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    // Cleanup old keys periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    
    return true;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
  
  reset(key: string) {
    this.attempts.delete(key);
  }
}

/**
 * Validate email format to prevent injection
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length < 255;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data (client-side, for comparison only)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate file upload for security
 */
export function validateFileUpload(file: File, options?: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  } = options || {};

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { valid: true };
}