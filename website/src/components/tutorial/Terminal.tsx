'use client';

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  onTerminalReady?: (terminal: XTerm) => void;
}

export function Terminal({ onTerminalReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!terminalRef.current) return;

      const terminal = new XTerm({
        convertEol: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(terminalRef.current);

      // Fit after a small delay to ensure layout is complete
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Terminal fit failed:', e);
        }
      }, 100);

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Notify parent that terminal is ready
      console.log('Terminal mounted, calling onTerminalReady');
      onTerminalReady?.(terminal);

      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Terminal resize failed:', e);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [onTerminalReady]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}
