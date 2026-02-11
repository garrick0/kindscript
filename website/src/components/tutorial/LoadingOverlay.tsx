'use client';

interface LoadingOverlayProps {
  state: 'idle' | 'booting' | 'installing' | 'ready' | 'error';
}

export function LoadingOverlay({ state }: LoadingOverlayProps) {
  if (state === 'ready' || state === 'idle') return null;

  const messages = {
    booting: {
      icon: '⚡',
      title: 'Booting WebContainer',
      subtitle: 'Starting the browser-based Node.js environment...',
    },
    installing: {
      icon: '📦',
      title: 'Installing Dependencies',
      subtitle: 'Running npm install (this may take 30-60 seconds on first load)...',
    },
    error: {
      icon: '❌',
      title: 'Error',
      subtitle: 'WebContainer failed to start. Check the terminal for details.',
    },
  };

  const message = messages[state as keyof typeof messages];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{message.icon}</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>{message.title}</h2>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>{message.subtitle}</p>
        {state !== 'error' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                animation: 'pulse 1.5s ease-in-out 0.3s infinite',
              }}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#3b82f6',
                animation: 'pulse 1.5s ease-in-out 0.6s infinite',
              }}
            />
          </div>
        )}
        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
