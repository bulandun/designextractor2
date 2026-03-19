'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CanonicalDesignSchema } from '../../src/pipeline/types';
import { renderSection } from './sections';
import { resolveCurrentBreakpoint, resolvePreviewTokens } from './token-resolver';

type PreviewRendererProps = {
  schema: CanonicalDesignSchema;
};

export function PreviewRenderer({ schema }: PreviewRendererProps) {
  const [viewportWidth, setViewportWidth] = useState(1280);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const tokens = useMemo(() => resolvePreviewTokens(schema), [schema]);
  const breakpoint = resolveCurrentBreakpoint(schema, viewportWidth);

  const sections = schema.semantics.sections.length
    ? schema.semantics.sections
    : [{ id: 'fallback-hero', role: 'hero', node_ids: [], confidence: 0 }];

  return (
    <section
      aria-label="Website preview"
      style={{
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.radius.lg,
        background: tokens.colors.background,
        color: tokens.colors.text,
        fontSize: tokens.typeScale.body,
        boxShadow: tokens.shadow.sm,
        padding: tokens.spacing.md,
      }}
    >
      <div style={{ marginBottom: tokens.spacing.sm, color: tokens.colors.mutedText, fontSize: 14 }}>
        Previewing canonical schema • Active breakpoint: <strong>{breakpoint}</strong>
      </div>

      <div
        style={{
          maxWidth: tokens.container.maxWidth,
          margin: '0 auto',
          padding: tokens.container.pagePadding,
          display: 'grid',
          gap: tokens.spacing.md,
          background: tokens.colors.background,
        }}
      >
        {sections.map((section, index) => (
          <div key={`${section.id}-${index}`}>{renderSection({ schema, section, tokens, breakpoint, index })}</div>
        ))}
      </div>
    </section>
  );
}
