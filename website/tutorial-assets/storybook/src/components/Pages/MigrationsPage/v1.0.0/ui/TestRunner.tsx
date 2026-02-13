/**
 * TestRunner Component
 * 
 * Provides a UI interface for running Vitest tests and displaying real-time output.
 * Allows users to execute specific test files and see results directly in the browser.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  output: string[];
  duration?: number;
  testCount?: {
    passed: number;
    failed: number;
    total: number;
  };
}

interface TestRunnerProps {
  testFiles?: string[];
  className?: string;
}

export function TestRunner({ testFiles = [], className = '' }: TestRunnerProps) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'idle',
    output: []
  });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Default test files for ModuleExplorer
  const defaultTestFiles = [
    'src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.vitest.stories.test.tsx',
    'src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.addon.test.ts'
  ];

  const availableTests = testFiles.length > 0 ? testFiles : defaultTestFiles;

  useEffect(() => {
    // Auto-scroll to bottom of output
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [testResult.output]);

  const runTests = async () => {
    const filesToRun = selectedFiles.length > 0 ? selectedFiles : availableTests;
    
    setTestResult({
      status: 'running',
      output: [`🚀 Running tests: ${filesToRun.join(', ')}`, ''],
      testCount: undefined
    });

    try {
      const response = await fetch('http://localhost:3001/api/test/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testFiles: filesToRun,
          options: {
            reporter: 'verbose',
            run: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          lines.forEach(line => {
            if (line.trim()) {
              setTestResult(prev => ({
                ...prev,
                output: [...prev.output, line]
              }));
            }
          });
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
          setTestResult(prev => ({
            ...prev,
            output: [...prev.output, buffer]
          }));
        }
      }

      // Parse final results
      const finalOutput = testResult.output.join('\n');
      const testCountMatch = finalOutput.match(/Tests\s+(\d+)\s+passed.*?\((\d+)\)/);
      const durationMatch = finalOutput.match(/Duration\s+([\d.]+)s/);

      setTestResult(prev => ({
        ...prev,
        status: finalOutput.includes('failed') ? 'error' : 'success',
        testCount: testCountMatch ? {
          passed: parseInt(testCountMatch[1]),
          failed: 0,
          total: parseInt(testCountMatch[2])
        } : undefined,
        duration: durationMatch ? parseFloat(durationMatch[1]) : undefined
      }));

    } catch (error) {
      setTestResult(prev => ({
        ...prev,
        status: 'error',
        output: [...prev.output, '', '❌ Error running tests:', String(error)]
      }));
    }
  };

  const clearOutput = () => {
    setTestResult({
      status: 'idle',
      output: []
    });
  };

  const toggleFileSelection = (file: string) => {
    setSelectedFiles(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };

  const statusColors = {
    idle: 'text-gray-600',
    running: 'text-blue-600',
    success: 'text-green-600',
    error: 'text-red-600'
  };

  const statusIcons = {
    idle: '⚪',
    running: '🔄',
    success: '✅',
    error: '❌'
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Test Runner</span>
          <span className={`text-sm ${statusColors[testResult.status]}`}>
            {statusIcons[testResult.status]} {testResult.status.charAt(0).toUpperCase() + testResult.status.slice(1)}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={runTests}
            disabled={testResult.status === 'running'}
            variant={testResult.status === 'running' ? 'secondary' : 'default'}
            size="sm"
          >
            {testResult.status === 'running' ? 'Running...' : 'Run Tests'}
          </Button>
          <Button
            onClick={clearOutput}
            variant="outline"
            size="sm"
            disabled={testResult.output.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Test File Selection */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Files:</h4>
        <div className="space-y-2">
          {availableTests.map((file, index) => {
            const fileName = file.split('/').pop() || file;
            const isSelected = selectedFiles.length === 0 || selectedFiles.includes(file);
            
            return (
              <label key={index} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleFileSelection(file)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {fileName}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Test Results Summary */}
      {testResult.testCount && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-4">
              <span className="text-green-600">✅ {testResult.testCount.passed} passed</span>
              {testResult.testCount.failed > 0 && (
                <span className="text-red-600">❌ {testResult.testCount.failed} failed</span>
              )}
              <span className="text-gray-600">📊 {testResult.testCount.total} total</span>
            </div>
            {testResult.duration && (
              <span className="text-gray-500">⏱️ {testResult.duration}s</span>
            )}
          </div>
        </div>
      )}

      {/* Test Output */}
      <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto font-mono text-sm">
        <div ref={outputRef} className="space-y-1">
          {testResult.output.length === 0 ? (
            <div className="text-gray-500 italic">
              Click "Run Tests" to execute tests and see output here...
            </div>
          ) : (
            testResult.output.map((line, index) => (
              <div 
                key={index} 
                className={`${
                  line.includes('✓') ? 'text-green-400' :
                  line.includes('❌') || line.includes('Error') ? 'text-red-400' :
                  line.includes('PASS') || line.includes('passed') ? 'text-green-300' :
                  line.includes('FAIL') || line.includes('failed') ? 'text-red-300' :
                  line.includes('RUN') || line.includes('Running') ? 'text-blue-300' :
                  line.startsWith('[36m[MSW][0m') ? 'text-cyan-400' :
                  'text-gray-300'
                }`}
              >
                {line.replace(/\[36m\[MSW\]\[0m/g, '[MSW]').replace(/\[32m✓\[0m/g, '✓')}
              </div>
            ))
          )}
        </div>
        
        {testResult.status === 'running' && (
          <div className="flex items-center space-x-2 text-blue-400 mt-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <span>Tests running...</span>
          </div>
        )}
      </div>
    </div>
  );
}