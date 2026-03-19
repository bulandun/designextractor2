import { CanonicalDesignSchema } from '../pipeline/types';

export function exportBuilderIo(canonical: CanonicalDesignSchema): Record<string, unknown> {
  return {
    version: '0.1.0',
    note: 'Phase 4 adapter placeholder',
    sections: canonical.semantics.sections.map((s) => ({ id: s.id, role: s.role, confidence: s.confidence })),
  };
}
