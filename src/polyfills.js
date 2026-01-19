// Minimal runtime polyfills for browser bundles that expect Node globals
// Keep lightweight: only provide what typical libs check for.
(function () {
  try {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined;

    if (typeof globalThis.process === 'undefined') {
      globalThis.process = { env: {} };
    }
    if (typeof globalThis.process.env === 'undefined') {
      globalThis.process.env = {};
    }
    // Common checks
    if (typeof globalThis.process.env.NODE_ENV === 'undefined') {
      globalThis.process.env.NODE_ENV = (env && (env.MODE || env.NODE_ENV)) || 'development';
    }
    if (typeof globalThis.process.versions === 'undefined') {
      globalThis.process.versions = {};
    }

    // Some libraries look for a Node-style global
    if (typeof globalThis.global === 'undefined') {
      globalThis.global = globalThis;
    }
  } catch (e) {
    // ignore
  }
})();
