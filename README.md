# Design Extractor MVP

This MVP ingests a **website URL** and produces a **canonical schema JSON** as the single source of truth for downstream builders.

## What is implemented

### 1) Canonical schema definition
- Canonical schema contract: `src/schemas/canonical.schema.json`
- Layer schemas:
  - `src/schemas/observed-layout.schema.json`
  - `src/schemas/semantic-layout.schema.json`
  - `src/schemas/design-system.schema.json`
  - `src/schemas/builder-export.schema.json`

### 2) Repo structure
- `src/ingest/*` → input ingestion (URL/image/pdf)
- `src/pipeline/*` → observation → semantics → design abstraction → export
- `src/exporters/*` → builder target emitters
- `app/api/build-schema/route.ts` → API endpoint
- `app/preview/*` → structural + styled previews
- `src/examples/sample-output/*` → example canonical outputs

### 3) Observation pipeline
- URL ingestion (`src/ingest/web.ts`):
  - fetch HTML
  - extract DOM block hints (header/nav/main/section/article/aside/footer/div)
  - optional screenshot capture to `tmp/captures/*`
- Observation (`src/pipeline/observe.ts`):
  - generates `observation.regions` from DOM hints
  - generates text nodes, image boxes, typography guesses, colors, alignment, spacing estimates, confidence

### 4) Semantic mapping layer
- `src/pipeline/interpret.ts`
  - infers semantic roles:
    - masthead, nav, hero, intro, CTA, article-card, article-grid, sidebar, footer, ad-banner, editorial-feature
  - attaches per-section confidence and alternatives
  - emits reading order + relationships

### 5) Structural preview renderer
- `app/preview/PreviewRenderer.tsx`
  - **Structural mode**: always renders wireframes from `observation.regions`
  - **Styled mode**: upgrades to semantic sections only if confidence is high (`>= 0.76`)
  - low-confidence sections remain structural (no fake hero rendering)

### 6) Export target (MVP)
- Lovable exporter only (configured in `src/config.ts`)
- `src/exporters/lovable.ts` emits layout, semantics, tokens, and responsive rules in Lovable format

### 7) UI preview modes
- JSON mode
- Structural Preview
- Styled Preview
- Split View

Implemented in `app/page.tsx`.

## Local usage

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

POST API:
```bash
curl -X POST http://localhost:3000/api/build-schema \
  -H 'content-type: application/json' \
  -d '{"inputType":"web","inputPathOrUrl":"http://localhost:3000"}'
```

## Working example output
- `src/examples/sample-output/canonical-localhost.json`

## Local build result
- Verified with:
  - `npm run typecheck`
  - `npm run build`
