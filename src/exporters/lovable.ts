import { CanonicalDesignSchema } from '../pipeline/types';

export function exportLovable(canonical: CanonicalDesignSchema): Record<string, unknown> {
  return {
    version: '0.1.0',
    sections: canonical.semantics.sections,
    tokens: canonical.designSystem,
  };
}
