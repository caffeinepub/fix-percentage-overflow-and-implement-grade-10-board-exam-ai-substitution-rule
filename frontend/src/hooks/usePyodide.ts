import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<any>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  globals: {
    get: (name: string) => any;
  };
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

export function usePyodide() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      if (pyodideInstance) {
        setIsLoading(false);
        return;
      }

      if (pyodideLoadingPromise) {
        try {
          await pyodideLoadingPromise;
          setIsLoading(false);
        } catch (err) {
          setError('Failed to load Python runtime');
        }
        return;
      }

      try {
        // Load Pyodide script if not already loaded
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide script'));
            document.head.appendChild(script);
          });
        }

        pyodideLoadingPromise = window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        pyodideInstance = await pyodideLoadingPromise;
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize Python runtime. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadPyodide();
  }, []);

  const runPython = useCallback(async (code: string): Promise<string> => {
    if (!pyodideInstance) {
      throw new Error('Python runtime not initialized');
    }

    try {
      // Capture stdout
      await pyodideInstance.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run the user's code
      await pyodideInstance.runPythonAsync(code);

      // Get the output
      const stdout = await pyodideInstance.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodideInstance.runPythonAsync('sys.stderr.getvalue()');

      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      return output || 'Code executed successfully (no output)';
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, []);

  return {
    runPython,
    isLoading,
    error,
  };
}
