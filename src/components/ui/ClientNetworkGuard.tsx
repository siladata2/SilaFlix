'use client';

import { useEffect } from 'react';

function installBrowserGuards() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (w.__silaflixGuardsInstalled) return;
  w.__silaflixGuardsInstalled = true;

  // 1. Make JSON.stringify resilient to circular DOM / React Fiber structures
  const origStringify = JSON.stringify;
  JSON.stringify = function (value: any, replacer?: any, space?: any) {
    try {
      return origStringify.call(this, value, replacer, space);
    } catch (err) {
      try {
        const seen = new WeakSet();
        return origStringify.call(
          this,
          value,
          function (this: any, key: string, val: any) {
            if (
              typeof key === 'string' &&
              (key.startsWith('__reactFiber') ||
                key.startsWith('__reactProps') ||
                key.startsWith('__reactContainer') ||
                key.startsWith('__reactEvents'))
            ) {
              return undefined;
            }
            if (typeof val === 'object' && val !== null) {
              if (seen.has(val)) return undefined;
              seen.add(val);
              if (typeof Node !== 'undefined' && val instanceof Node) {
                const el = val as HTMLElement;
                return {
                  nodeName: el.nodeName,
                  id: el.id || undefined,
                  className: typeof el.className === 'string' ? el.className : undefined,
                };
              }
            }
            return typeof replacer === 'function' ? replacer.call(this, key, val) : val;
          },
          space
        );
      } catch {
        return 'null';
      }
    }
  };

  // 2. Guard HTMLElement.prototype.focus so Next.js InnerScrollAndFocusHandler never crashes
  if (typeof HTMLElement !== 'undefined' && HTMLElement.prototype?.focus) {
    const origFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (options?: FocusOptions) {
      try {
        return origFocus.call(this, options);
      } catch {
        // Ignore focus errors on non-focusable or detached nodes
      }
    };
  }
}

if (typeof window !== 'undefined') {
  installBrowserGuards();
}

export function ClientNetworkGuard() {
  useEffect(() => {
    installBrowserGuards();

    const origError = console.error;
    console.error = (...args: any[]) => {
      try {
        const first = typeof args[0] === 'string' ? args[0] : String(args[0]?.message || '');
        const second = typeof args[1] === 'string' ? args[1] : String(args[1]?.message || '');
        if (
          first.includes('Failed to fetch RSC payload') ||
          first.includes('Failed to fetch') ||
          second.includes('Failed to fetch') ||
          first.includes('Invalid Refresh Token') ||
          first.includes('Converting circular structure to JSON')
        ) {
          return;
        }
      } catch {
        // Ignore string conversion errors
      }
      origError.apply(console, args);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || '');
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed') ||
        msg.includes('AbortError') ||
        msg.includes('Converting circular structure to JSON')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      console.error = origError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
