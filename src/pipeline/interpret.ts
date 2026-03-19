import { ObservedLayout, SemanticLayout } from './types';

export async function interpret(observation: ObservedLayout): Promise<SemanticLayout> {
  // TODO: heuristic/rule/model hybrid semantic inference.
  return {
    sections: [],
    inferred_role_map: {},
    reading_order: observation.pages.map((p) => p.id),
    relationships: [],
    page_template_type: {
      value: 'unknown',
      confidence: 0.2,
      alternatives: [
        { value: 'marketing-landing-page', confidence: 0.1 },
        { value: 'documentation', confidence: 0.1 },
      ],
    },
  };
}
