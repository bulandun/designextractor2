import { CanonicalDesignSchema } from '../pipeline/types';

export function exportReact(canonical: CanonicalDesignSchema): Record<string, unknown> {
  return {
    version: '0.1.0',
    componentTree: canonical.semantics.sections.map((section) => ({
      type: section.role,
      id: section.id,
      nodeIds: section.node_ids,
      confidence: section.confidence,
    })),
    tokens: {
      colors: canonical.designSystem.colorTokens,
      typography: canonical.designSystem.typeTokens,
      spacing: canonical.designSystem.spacingTokens,
    },
  };
}
