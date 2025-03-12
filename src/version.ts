/** @internal - This file is auto-generated */
export const VERSION = process.env.NODE_ENV === 'development'
  ? require('../package.json').version  // Development: read from package.json
  : (typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.8.1');  // Production: replaced at build time sau fallback la versiunea curentă

// Declarăm variabila globală pentru TypeScript
declare global {
  const __VERSION__: string | undefined;
}
