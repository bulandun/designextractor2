import { CanonicalDesignSchema } from '../pipeline/types';

export function exportWebflow(canonical: CanonicalDesignSchema): Record<string, unknown> {
  return {
    version: '0.1.0',
    note: 'Phase 4 adapter placeholder',
    tokens: canonical.designSystem.colorTokens,
  };
}
