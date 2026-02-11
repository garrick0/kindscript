'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BrowserCheckProps {
  children: React.ReactNode;
}

export function BrowserCheck({ children }: BrowserCheckProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    setIsDevelopmentMode(isDev);

    // Check for SharedArrayBuffer support (required for WebContainer)
    const supported = typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;

    if (!supported && isDev) {
      // In development mode, the headers might take a moment to apply
      // Wait and then reload
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setIsSupported(supported);
    }
  }, []);

  if (isSupported === null) {
    // Loading state or development mode waiting for headers
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
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          {isDevelopmentMode ? (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Development Mode - Loading Tutorial...</h2>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                WebContainers require cross-origin isolation headers. In development mode, these headers may take a
                moment to apply. The tutorial will load automatically in {countdown} seconds...
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Load Tutorial Now
              </button>
              <div style={{ marginTop: '1.5rem' }}>
                <Link href="/tutorial" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  ← Back to Lessons
                </Link>
              </div>
              <details style={{ marginTop: '2rem', textAlign: 'left', color: '#64748b' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Show Debug Info
                </summary>
                <pre
                  style={{
                    background: '#0f172a',
                    padding: '1rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(
                    {
                      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
                      crossOriginIsolated:
                        typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'undefined',
                      SharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined' ? 'available' : 'unavailable',
                      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </>
          ) : (
            <div>Checking browser compatibility...</div>
          )}
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
