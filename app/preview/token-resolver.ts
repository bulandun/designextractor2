import type { CanonicalDesignSchema, DesignToken } from '../../src/pipeline/types';

export type ResolvedPreviewTokens = {
  colors: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    accent: string;
    border: string;
  };
  typeScale: {
    body: number;
    lead: number;
    h1: number;
    h2: number;
    h3: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadow: {
    sm: string;
    md: string;
  };
  container: {
    maxWidth: number;
    pagePadding: number;
  };
};

const DEFAULT_TOKENS: ResolvedPreviewTokens = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    mutedText: '#475569',
    accent: '#2563eb',
    border: '#e2e8f0',
  },
  typeScale: {
    body: 16,
    lead: 18,
    h1: 42,
    h2: 32,
    h3: 24,
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 28,
    xl: 42,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 18,
  },
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
    md: '0 10px 30px rgba(15, 23, 42, 0.1)',
  },
  container: {
    maxWidth: 1120,
    pagePadding: 24,
  },
};

function parseNumericToken(token: DesignToken<unknown> | undefined): number | undefined {
  if (!token) return undefined;
  if (typeof token.value === 'number') return token.value;
  if (typeof token.value === 'string') {
    const match = token.value.match(/-?\d+(\.\d+)?/);
    if (match) return Number(match[0]);
  }
  if (typeof token.value === 'object' && token.value && 'value' in token.value) {
    const nested = (token.value as { value?: unknown }).value;
    if (typeof nested === 'number') return nested;
  }
  return undefined;
}

function parseColorToken(token: DesignToken<unknown> | undefined): string | undefined {
  if (!token) return undefined;
  return typeof token.value === 'string' ? token.value : undefined;
}

function findToken(tokens: DesignToken<unknown>[], includes: string[]): DesignToken<unknown> | undefined {
  const lower = includes.map((item) => item.toLowerCase());
  return tokens.find((token) => {
    const target = `${token.name} ${(token.usage ?? []).join(' ')}`.toLowerCase();
    return lower.some((term) => target.includes(term));
  });
}

export function resolvePreviewTokens(schema: CanonicalDesignSchema): ResolvedPreviewTokens {
  const { designSystem } = schema;

  const background = parseColorToken(findToken(designSystem.colorTokens, ['background', 'canvas']));
  const surface = parseColorToken(findToken(designSystem.colorTokens, ['surface', 'card', 'panel', 'neutral']));
  const text = parseColorToken(findToken(designSystem.colorTokens, ['text', 'foreground', 'body']));
  const accent = parseColorToken(findToken(designSystem.colorTokens, ['accent', 'primary', 'brand']));
  const border = parseColorToken(findToken(designSystem.colorTokens, ['border', 'stroke', 'divider']));

  const bodySize = parseNumericToken(findToken(designSystem.typeTokens, ['body', 'paragraph', 'base']));
  const leadSize = parseNumericToken(findToken(designSystem.typeTokens, ['lead', 'subtitle', 'large']));
  const h1 = parseNumericToken(findToken(designSystem.typeTokens, ['h1', 'headline', 'display']));
  const h2 = parseNumericToken(findToken(designSystem.typeTokens, ['h2', 'title']));
  const h3 = parseNumericToken(findToken(designSystem.typeTokens, ['h3', 'heading']));

  const spacingSm = parseNumericToken(findToken(designSystem.spacingTokens, ['sm', 'small', 'space-2']));
  const spacingMd = parseNumericToken(findToken(designSystem.spacingTokens, ['md', 'medium', 'space-3']));
  const spacingLg = parseNumericToken(findToken(designSystem.spacingTokens, ['lg', 'large', 'space-4']));

  const radiusSm = parseNumericToken(findToken(designSystem.radiusTokens, ['sm', 'small']));
  const radiusMd = parseNumericToken(findToken(designSystem.radiusTokens, ['md', 'medium']));
  const radiusLg = parseNumericToken(findToken(designSystem.radiusTokens, ['lg', 'large', 'pill']));

  const shadowSm = parseColorToken(findToken(designSystem.shadowTokens, ['sm', 'small']));
  const shadowMd = parseColorToken(findToken(designSystem.shadowTokens, ['md', 'large', 'card']));

  const container = parseNumericToken(findToken(designSystem.layoutTokens, ['container', 'content', 'max-width']));

  return {
    colors: {
      background: background ?? DEFAULT_TOKENS.colors.background,
      surface: surface ?? DEFAULT_TOKENS.colors.surface,
      text: text ?? DEFAULT_TOKENS.colors.text,
      mutedText: DEFAULT_TOKENS.colors.mutedText,
      accent: accent ?? DEFAULT_TOKENS.colors.accent,
      border: border ?? DEFAULT_TOKENS.colors.border,
    },
    typeScale: {
      body: bodySize ?? DEFAULT_TOKENS.typeScale.body,
      lead: leadSize ?? DEFAULT_TOKENS.typeScale.lead,
      h1: h1 ?? DEFAULT_TOKENS.typeScale.h1,
      h2: h2 ?? DEFAULT_TOKENS.typeScale.h2,
      h3: h3 ?? DEFAULT_TOKENS.typeScale.h3,
    },
    spacing: {
      xs: Math.max(4, Math.round((spacingSm ?? DEFAULT_TOKENS.spacing.sm) / 2)),
      sm: spacingSm ?? DEFAULT_TOKENS.spacing.sm,
      md: spacingMd ?? DEFAULT_TOKENS.spacing.md,
      lg: spacingLg ?? DEFAULT_TOKENS.spacing.lg,
      xl: Math.round((spacingLg ?? DEFAULT_TOKENS.spacing.lg) * 1.5),
    },
    radius: {
      sm: radiusSm ?? DEFAULT_TOKENS.radius.sm,
      md: radiusMd ?? DEFAULT_TOKENS.radius.md,
      lg: radiusLg ?? DEFAULT_TOKENS.radius.lg,
    },
    shadow: {
      sm: shadowSm ?? DEFAULT_TOKENS.shadow.sm,
      md: shadowMd ?? DEFAULT_TOKENS.shadow.md,
    },
    container: {
      maxWidth: container ?? DEFAULT_TOKENS.container.maxWidth,
      pagePadding: DEFAULT_TOKENS.container.pagePadding,
    },
  };
}

export function resolveCurrentBreakpoint(schema: CanonicalDesignSchema, viewportWidth: number): string {
  const points = schema.responsive.breakpoints ?? [];
  const matched = points.find((point) => {
    const minOk = typeof point.min_width !== 'number' || viewportWidth >= point.min_width;
    const maxOk = typeof point.max_width !== 'number' || viewportWidth <= point.max_width;
    return minOk && maxOk;
  });

  return matched?.name ?? (viewportWidth < 768 ? 'sm' : viewportWidth < 1024 ? 'md' : 'lg');
}
