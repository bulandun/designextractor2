import { DesignSystem, DesignToken, ObservedLayout, ResponsiveRules, SemanticLayout } from './types';
import { dedupeColors } from '../utils/colors';
import { estimateSpacingScale } from '../utils/spacing';
import { estimateTypeScale } from '../utils/typography';

function tokenName(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

export async function abstractDesignSystem(
  observation: ObservedLayout,
  semantics: SemanticLayout,
): Promise<{ designSystem: DesignSystem; responsive: ResponsiveRules }> {
  const allNodes = [...observation.regions, ...observation.text_nodes];

  const colors = dedupeColors(
    allNodes
      .flatMap((node) => [node.style_guess?.color, node.style_guess?.backgroundColor, node.style_guess?.borderColor])
      .filter((value): value is string => Boolean(value))
  );

  const typeScale = estimateTypeScale(
    allNodes.map((node) => node.style_guess?.fontSize).filter((v): v is number => typeof v === 'number'),
    allNodes.map((node) => node.style_guess?.fontWeight).filter((v): v is number => typeof v === 'number')
  );

  const spacingValues = estimateSpacingScale(
    observation.regions
      .slice(1)
      .map((region, idx) => region.bbox.y - observation.regions[idx].bbox.y)
      .map((value) => Math.max(4, Math.round(value / 4) * 4))
  );

  const colorTokens: Array<DesignToken<string>> = colors.map((color, idx) => ({
    name: tokenName(idx === 0 ? 'color-text' : idx === 1 ? 'color-surface' : 'color-accent', idx),
    value: color,
    confidence: 0.78,
  }));

  const typeTokens: Array<DesignToken<Record<string, unknown>>> = typeScale.sizes.map((size, idx) => ({
    name: tokenName(idx === 0 ? 'type-body' : idx === typeScale.sizes.length - 1 ? 'type-display' : 'type-scale', idx),
    value: { fontSize: size, fontWeight: typeScale.weights[Math.min(idx, typeScale.weights.length - 1)] ?? 400 },
    confidence: 0.74,
  }));

  const spacingTokens: Array<DesignToken<number>> = spacingValues.map((space, idx) => ({
    name: tokenName('space', idx),
    value: space,
    confidence: 0.71,
  }));

  const designSystem: DesignSystem = {
    colorTokens,
    typeTokens,
    spacingTokens,
    radiusTokens: [
      { name: 'radius-sm', value: 6, confidence: 0.64 },
      { name: 'radius-md', value: 12, confidence: 0.64 },
    ],
    shadowTokens: [{ name: 'shadow-sm', value: '0 1px 2px rgba(0,0,0,0.08)', confidence: 0.6 }],
    layoutTokens: [
      { name: 'container-max-width', value: 1120, confidence: 0.68 },
      { name: 'grid-columns', value: { desktop: 12, tablet: 8, mobile: 4 }, confidence: 0.66 },
    ],
    componentPatterns: semantics.sections.slice(0, 8).map((section) => ({
      name: section.role,
      parts: ['container', 'content'],
      evidence_nodes: section.node_ids,
      confidence: section.confidence,
    })),
    variants: [],
    interactionHints: [],
  };

  const responsive: ResponsiveRules = {
    breakpoints: [
      { name: 'sm', max_width: 767 },
      { name: 'md', min_width: 768, max_width: 1023 },
      { name: 'lg', min_width: 1024 },
    ],
    stacking_rules: [
      { condition: 'sm', behavior: 'stack_regions_vertically', source: 'observation.regions' },
      { condition: 'md', behavior: 'two_column_when_possible', source: 'semantic.article-grid' },
    ],
    container_rules: [{ container: 'main', maxWidth: 1120, padding: { sm: 16, md: 24, lg: 32 } }],
    hide_show_behavior: [],
    typography_scaling: [{ token: 'type-display', sm: 28, md: 36, lg: 44 }],
    spacing_scaling: [{ token: 'space-2', sm: 12, md: 16, lg: 20 }],
  };

  return { designSystem, responsive };
}
