'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WebContainer } from '@webcontainer/api';
import type { Terminal as XTerm } from '@xterm/xterm';
import { LessonFile } from '@/lib/lessons/types';
import { templateFiles } from '@/lib/lessons/template';
import { filesToFileSystemTree } from '@/lib/webcontainer/utils';
import { getWebContainer, isWebContainerBooted, isDependenciesInstalled, markDependenciesInstalled } from '@/lib/webcontainer/singleton';

type LoadingState = 'idle' | 'booting' | 'installing' | 'ready' | 'error';

interface WebContainerProviderProps {
  files: LessonFile[];
  terminal: XTerm | null;
  onStateChange?: (state: LoadingState) => void;
}

export interface WebContainerHandle {
  writeFile: (path: string, contents: string) => Promise<void>;
  runCommand: (command: string, args: string[]) => Promise<void>;
}

export const WebContainerProvider = forwardRef<WebContainerHandle, WebContainerProviderProps>(
  ({ files, terminal, onStateChange }, ref) => {
    const instanceRef = useRef<WebContainer | null>(null);
    const [state, setState] = useState<LoadingState>('idle');
    const hasBooted = useRef(false);
    const writeQueueRef = useRef<Map<string, string>>(new Map());
    const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (state !== 'idle') {
        onStateChange?.(state);
      }
    }, [state, onStateChange]);

    const writeFile = useCallback(async (path: string, contents: string) => {
      if (!instanceRef.current || state !== 'ready') return;

      // Queue writes and debounce
      writeQueueRef.current.set(path, contents);

      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }

      writeTimeoutRef.current = setTimeout(async () => {
        const wc = instanceRef.current;
        if (!wc) return;

        for (const [filePath, fileContents] of writeQueueRef.current.entries()) {
          try {
            await wc.fs.writeFile(filePath, fileContents);
          } catch (error) {
            console.error(`Failed to write ${filePath}:`, error);
          }
        }
        writeQueueRef.current.clear();
      }, 300); // 300ms debounce
    }, [state]);

    const runCommand = useCallback(async (command: string, args: string[]) => {
      if (!instanceRef.current || !terminal || state !== 'ready') return;

      try {
        terminal.writeln(`$ ${command} ${args.join(' ')}`);
        const process = await instanceRef.current.spawn(command, args);

        process.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data);
            },
          })
        );

        const exitCode = await process.exit;
        if (exitCode === 0) {
          terminal.writeln('\r\n✓ Command completed successfully');
        } else {
          terminal.writeln(`\r\n✗ Command failed with exit code ${exitCode}`);
        }
      } catch (error) {
        terminal.writeln(`\r\n✗ Error: ${error}`);
      }
    }, [terminal, state]);

    useImperativeHandle(ref, () => ({
      writeFile,
      runCommand,
    }));

    useEffect(() => {
      // Wait for terminal to be available
      if (!terminal) {
        console.log('Waiting for terminal to load...');
        return; // Will retry when terminal becomes available
      }

      console.log('Terminal ready, starting WebContainer boot...');

      async function boot() {
        if (!terminal) {
          console.error('Terminal not available for boot');
          return;
        }

        // Check if already booted from a previous component mount
        const alreadyBooted = isWebContainerBooted();
        const _depsInstalled = isDependenciesInstalled();

        if (alreadyBooted && !instanceRef.current) {
          console.log('WebContainer already booted, reusing instance...');
          try {
            const wc = await getWebContainer();
            instanceRef.current = wc;

            // If dependencies already installed, go straight to ready
            // This prevents showing the loading overlay on subsequent lesson navigation
            setState('ready');
            terminal.writeln('✓ WebContainer ready (cached)');

            // Start shell for this terminal
            const shellProcess = await wc.spawn('jsh', {
              terminal: {
                cols: terminal.cols,
                rows: terminal.rows,
              },
            });

            shellProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  terminal.write(data);
                },
              })
            );

            const input = shellProcess.input.getWriter();
            terminal.onData((data) => {
              input.write(data);
            });

            console.log('Shell started for new lesson');
            return;
          } catch (error) {
            console.error('Failed to reuse WebContainer:', error);
            setState('error');
            return;
          }
        }

        // Prevent double-boot in the same component instance
        if (hasBooted.current) {
          return;
        }

        // Mark as booted BEFORE async operations to prevent double-boot
        hasBooted.current = true;

        // Check browser support
        if (typeof SharedArrayBuffer === 'undefined' || !crossOriginIsolated) {
          console.error('SharedArrayBuffer not available or not cross-origin isolated');
          setState('error');
          terminal.writeln('❌ WebContainer not supported in this browser');
          terminal.writeln('SharedArrayBuffer: ' + (typeof SharedArrayBuffer !== 'undefined' ? 'available' : 'not available'));
          terminal.writeln('Cross-origin isolated: ' + (crossOriginIsolated ? 'yes' : 'no'));
          return;
        }

        setState('booting');
        terminal.writeln('Booting WebContainer...');
        console.log('Browser support confirmed, calling WebContainer.boot()...');

        try {
          const wc = await getWebContainer();
          instanceRef.current = wc;
          console.log('WebContainer booted successfully');

          terminal.writeln('Mounting files...');
          await wc.mount(templateFiles);
          console.log('Template files mounted');

          // Skip npm install if dependencies already installed
          if (!isDependenciesInstalled()) {
            setState('installing');
            terminal.writeln('Installing dependencies...');
            terminal.writeln('This may take 30-60 seconds on first load...');

            const installProcess = await wc.spawn('npm', ['install']);
            installProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  terminal.write(data);
                },
              })
            );

            const exitCode = await installProcess.exit;
            if (exitCode !== 0) {
              terminal.writeln(`\r\n✗ npm install failed with exit code ${exitCode}`);
              setState('error');
              return;
            }

            terminal.writeln('\r\n✓ Dependencies installed');
            markDependenciesInstalled();
          } else {
            console.log('Dependencies already installed, skipping npm install');
            terminal.writeln('✓ Dependencies already installed');
          }

          setState('ready');
          terminal.writeln('\r\n=== Ready! ===');
          terminal.writeln('Type commands or click "Run Check" to validate the architecture.\r\n');
          console.log('WebContainer ready');

          // Start shell
          const shellProcess = await wc.spawn('jsh', {
            terminal: {
              cols: terminal.cols,
              rows: terminal.rows,
            },
          });

          shellProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                terminal.write(data);
              },
            })
          );

          const input = shellProcess.input.getWriter();
          terminal.onData((data) => {
            input.write(data);
          });

          console.log('Shell started');
        } catch (error) {
          setState('error');
          terminal.writeln(`\r\n❌ Error: ${error}`);
          console.error('WebContainer boot failed:', error);
        }
      }

      boot();
    }, [terminal]);

    // Update files when lesson changes
    useEffect(() => {
      if (!instanceRef.current || state !== 'ready') return;

      console.log('Updating lesson files...');

      async function updateFiles() {
        const wc = instanceRef.current!;
        const lessonTree = filesToFileSystemTree(files);

        try {
          await wc.mount(lessonTree);
          if (terminal) {
            terminal.writeln('\r\n📝 Lesson files updated');
          }
          console.log('Lesson files mounted successfully');
        } catch (error) {
          console.error('Failed to update files:', error);
        }
      }

      updateFiles();
    }, [files, state, terminal]);

    return null;
  }
);

WebContainerProvider.displayName = 'WebContainerProvider';
