# Phase 11 — React web app: sample-only core flow

Branch: `phase-11-web-app` from `dev` @ `4bdbbb1`. Date: 2026-09-30.

Spec authority: `docs/FRONTEND_SPECIFICATION.md` (§3 already amended to the
approved `docs/UI_UX_DESIGN_DIRECTION.md` tokens; master-plan Phase 11/12
split applied). Keep API contracts, capability gates, privacy rules, and
evidence requirements exactly as specified.

## Scope

1. **Design foundation first:** CSS custom properties (paper/ink/clay tokens,
   8 px rhythm, 12 px radius), self-hosted Fraunces (headings) + Source Sans 3
   (everything else) with graceful fallbacks, shared components — Button,
   Notice (source/incomplete/error), Card, EvidenceQuote (with
   `Offer · Page N` margin label), StateChip — then all screens reuse them.
2. **Five views + shell:** Home, SampleChooser (5 manifest cards + same-origin
   previews), ExtractionPending, Review (12 groups / 33 components, three-layer
   provenance, correction editor per `NormalizedValue.kind`, expiry warning,
   fields-first mobile + full-screen page panel with focus restoration),
   AnalysisPending, Findings (categories in API order, mismatch evidence pairs,
   official citation block, coverage/limitations top for partial). Tiny
   history-API router (no router dependency). One `h1` per view; focus moved on
   view change; restrained live region for async completion.
3. **Client state:** single in-memory React state (capabilities, samples,
   issued extraction + proof, corrections keyed
   `documentId:fieldKey:instanceId`, report). No storage/URLs/analytics; Blob
   URLs revoked; refresh returns home with explanation.
4. **API plumbing:** typed client for capabilities/samples/extractions/analyses;
   error envelope mapping per spec §6. Express serves `web/dist` + SPA fallback
   (`/api/*`, `/health`, `/samples/*` reserved first).
5. **Five production samples:** extend the server manifest with TC-001
   (consistent pair), TC-012 (worker-charge question — live source-backed
   concern path), TC-013 (missing notice terms), TC-014 (single contract,
   unreadable salary page → partial/abstention); PDFs copied from the corpus
   fixtures into `fixtures/samples/` (sample PDFs only, no truth files).
6. **E2E stack:** `api/scripts/e2e-server.ts` — `buildApp` + inline fake Gemini
   serving deterministic per-sample extractions (from the corpus `extracted.json`
   shapes), short proof TTL for expiry testing, port 3011. Playwright + axe in
   `web/e2e/`.

## Tests

- RTL: capability gating (no upload CTA; `/start` gate copy), correction delta
  shape, evidence quality labels, partial banner, citation block, error panel.
- Playwright: five-sample journey (choose → extract → review → continue →
  findings, asserting truthful per-case outcomes), partial result (TC-014),
  expiry recovery (short TTL), axe smoke on home/review/findings, keyboard
  pass on review.
- Regression: existing api/web suites, lint, typecheck, builds.

## Non-goals

Personal upload UI (gate stays closed), Urdu, image input, animations,
highlight-locating preview, report export. Phase 12 keeps refinement + full
WCAG pass.
