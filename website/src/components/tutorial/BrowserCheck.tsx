'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BrowserCheckProps {
  children: React.ReactNode;
}

export function BrowserCheck({ children }: BrowserCheckProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for SharedArrayBuffer support (required for WebContainer)
    const supported = typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;
    setIsSupported(supported);
  }, []);

  if (isSupported === null) {
    // Loading state
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#1e293b',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Checking browser compatibility...</div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    // Not supported - show fallback
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '3rem',
            maxWidth: '600px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>💻</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', textAlign: 'center', color: '#1e293b' }}>
            Desktop Browser Required
          </h1>
          <p style={{ fontSize: '1.125rem', lineHeight: '1.75', color: '#475569', marginBottom: '1.5rem' }}>
            The interactive tutorial uses <strong>WebContainers</strong> to run a full Node.js environment in your
            browser. This requires modern browser features that aren't available on all devices.
          </p>
          <div
            style={{
              background: '#f1f5f9',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <strong>Supported browsers:</strong>
            </p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', color: '#475569' }}>
              <li>Chrome/Edge 92+</li>
              <li>Firefox 95+</li>
              <li>Safari 15.2+</li>
            </ul>
          </div>
          <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '2rem' }}>
            Please try again from a desktop or laptop computer with a modern browser.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              href="/docs/tutorial-guide"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Read Static Tutorial
            </Link>
            <Link
              href="/tutorial"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#e5e7eb',
                color: '#1e293b',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ← Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
