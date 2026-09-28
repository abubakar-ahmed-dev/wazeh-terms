import { WEB_VERSION } from './lib/version';

/**
 * Phase 01 placeholder home. The real sample-only experience is specified in
 * docs/FRONTEND_SPECIFICATION.md and lands with Phase 11.
 */
export function App() {
  return (
    <main>
      <h1>WazehTerms</h1>
      <p>Understand the terms before you sign.</p>
      <p>Implementation scaffold (v{WEB_VERSION}); the review flow arrives in a later phase.</p>
    </main>
  );
}
