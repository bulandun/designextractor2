import { ObservedLayout, SemanticLayout, SemanticSection } from './types';

const ROLE_PATTERNS: Array<{ role: string; patterns: RegExp[]; base: number }> = [
  { role: 'masthead', patterns: [/masthead|brand|header/i], base: 0.92 },
  { role: 'nav', patterns: [/\bnav\b|menu|links?/i], base: 0.9 },
  { role: 'hero', patterns: [/hero|welcome|headline|discover|build/i], base: 0.82 },
  { role: 'intro', patterns: [/intro|about|overview/i], base: 0.78 },
  { role: 'cta', patterns: [/sign up|get started|contact|subscribe|try/i], base: 0.8 },
  { role: 'article-card', patterns: [/article|post|story|blog/i], base: 0.76 },
  { role: 'article-grid', patterns: [/grid|collection|featured stories/i], base: 0.72 },
  { role: 'sidebar', patterns: [/aside|sidebar|related/i], base: 0.75 },
  { role: 'ad-banner', patterns: [/sponsor|ad\b|advert/i], base: 0.7 },
  { role: 'editorial-feature', patterns: [/editor|feature|opinion/i], base: 0.74 },
  { role: 'footer', patterns: [/footer|privacy|terms|copyright/i], base: 0.89 },
];

function inferRole(text: string, fallbackType: string): { role: string; confidence: number; alternatives: Array<{ role: string; confidence: number }> } {
  const scored = ROLE_PATTERNS.map((item) => {
    const hit = item.patterns.some((pattern) => pattern.test(text) || pattern.test(fallbackType));
    return {
      role: item.role,
      confidence: hit ? item.base : Math.max(0.12, item.base - 0.55),
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const [best, ...rest] = scored;
  return {
    role: best.role,
    confidence: best.confidence,
    alternatives: rest.slice(0, 3),
  };
}

export async function interpret(observation: ObservedLayout): Promise<SemanticLayout> {
  const sections: SemanticSection[] = observation.regions.map((node, index) => {
    const inferred = inferRole(node.raw_text ?? '', node.type);
    return {
      id: `section_${index + 1}`,
      role: inferred.role,
      node_ids: [node.id],
      confidence: Number(((node.confidence + inferred.confidence) / 2).toFixed(3)),
      alternatives: inferred.alternatives,
    };
  });

  const inferredRoleMap = Object.fromEntries(
    sections.map((section) => [
      section.id,
      {
        role: section.role,
        confidence: section.confidence,
        alternatives: section.alternatives,
      },
    ])
  );

  const relationships = sections.slice(1).map((section, index) => ({
    parent_id: sections[index].id,
    child_id: section.id,
    relation: 'follows' as const,
    confidence: 0.78,
  }));

  const templateGuess = sections.some((section) => section.role === 'hero' && section.confidence > 0.72)
    ? { value: 'marketing-landing-page', confidence: 0.79 }
    : { value: 'content-page', confidence: 0.64 };

  return {
    sections,
    inferred_role_map: inferredRoleMap,
    reading_order: observation.regions.map((node) => node.id),
    relationships,
    page_template_type: {
      ...templateGuess,
      alternatives: [
        { value: 'magazine-homepage', confidence: 0.48 },
        { value: 'documentation', confidence: 0.44 },
      ],
    },
  };
}
