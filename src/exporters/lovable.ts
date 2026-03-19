import { CanonicalDesignSchema } from '../pipeline/types';

export function exportLovable(canonical: CanonicalDesignSchema): Record<string, unknown> {
  return {
    format: 'lovable.design-schema.v1',
    meta: {
      sourceName: canonical.meta.source_name,
      generatedAt: canonical.meta.generated_at,
      confidence: canonical.meta.confidence_summary.overall,
    },
    layout: canonical.observation.regions.map((region) => ({
      id: region.id,
      kind: region.type,
      bbox: region.bbox,
      text: region.raw_text,
      confidence: region.confidence,
    })),
    semanticSections: canonical.semantics.sections,
    tokens: canonical.designSystem,
    responsive: canonical.responsive,
  };
}
