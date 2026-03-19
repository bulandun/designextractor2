'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CanonicalDesignSchema, ObservedNode, SemanticSection } from '../../src/pipeline/types';
import { PageCanvas } from './PageCanvas';
import { renderSection } from './sections';
import { resolveCurrentBreakpoint, resolvePreviewTokens } from './token-resolver';

type PreviewRendererProps = {
  schema: CanonicalDesignSchema;
  mode: 'structural' | 'styled';
};

const SEMANTIC_UPGRADE_THRESHOLD = 0.76;

function toSectionFallback(region: ObservedNode, idx: number): SemanticSection {
  return {
    id: `structural_${idx + 1}`,
    role: region.type || 'region',
    node_ids: [region.id],
    confidence: region.confidence,
  };
}

export function PreviewRenderer({ schema, mode }: PreviewRendererProps) {
  const [viewportWidth, setViewportWidth] = useState(1280);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const tokens = useMemo(() => resolvePreviewTokens(schema), [schema]);
  const breakpoint = resolveCurrentBreakpoint(schema, viewportWidth);

  const eligibleSemanticSections = schema.semantics.sections.filter((section) => section.confidence >= SEMANTIC_UPGRADE_THRESHOLD);
  const structuralRegions = schema.observation.regions;

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
        {mode === 'structural' ? 'Structural preview' : 'Styled preview'} • Active breakpoint: <strong>{breakpoint}</strong> • Semantic upgrades:{' '}
        {eligibleSemanticSections.length}/{schema.semantics.sections.length}
      </div>

      <div
        style={{
          maxWidth: tokens.container.maxWidth,
          margin: '0 auto',
          padding: tokens.container.pagePadding,
          background: tokens.colors.background,
        }}
      >
        {mode === 'structural' ? (
          <PageCanvas schema={schema} />
        ) : (
          <div style={{ display: 'grid', gap: tokens.spacing.md }}>
            {structuralRegions.length > 0
              ? structuralRegions.map((region, index) => {
                  const semantic = eligibleSemanticSections.find((section) => section.node_ids.includes(region.id));
                  if (semantic) {
                    return <div key={`${semantic.id}-${index}`}>{renderSection({ schema, section: semantic, tokens, breakpoint, index })}</div>;
                  }
                  return null;
                })
              : schema.semantics.sections.map((section, index) => {
                  const maybeSemantic = section.confidence >= SEMANTIC_UPGRADE_THRESHOLD
                    ? section
                    : toSectionFallback(
                        {
                          id: `fallback_${index}`,
                          type: section.role,
                          bbox: { x: 0, y: index * 120, width: 800, height: 110, unit: 'px' },
                          confidence: section.confidence,
                        },
                        index,
                      );

                  return <div key={`${maybeSemantic.id}-${index}`}>{renderSection({ schema, section: maybeSemantic, tokens, breakpoint, index })}</div>;
                })}
          </div>
        )}
      </div>
    </section>
  );
}
