'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WebContainer } from '@webcontainer/api';
import type { Terminal as XTerm } from '@xterm/xterm';
import { LessonFile } from '@/lib/lessons/types';
import { templateFiles } from '@/lib/lessons/template';
import { filesToFileSystemTree } from '@/lib/webcontainer/utils';

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
      if (!terminal || hasBooted.current) return;

      async function boot() {
        if (!terminal) return;

        hasBooted.current = true;
        setState('booting');
        terminal.writeln('Booting WebContainer...');

        try {
          const wc = await WebContainer.boot();
          instanceRef.current = wc;

          terminal.writeln('Mounting files...');
          await wc.mount(templateFiles);

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

          await installProcess.exit;
          terminal.writeln('\r\n✓ Dependencies installed');

          setState('ready');
          terminal.writeln('\r\n=== Ready! ===');
          terminal.writeln('Type commands or click "Run Check" to validate the architecture.\r\n');

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

      async function updateFiles() {
        const wc = instanceRef.current!;
        const lessonTree = filesToFileSystemTree(files);

        try {
          await wc.mount(lessonTree);
          if (terminal) {
            terminal.writeln('\r\n📝 Lesson files updated');
          }
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
