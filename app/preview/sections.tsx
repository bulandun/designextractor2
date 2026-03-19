import type { CSSProperties, ReactElement } from 'react';
import type { CanonicalDesignSchema, SemanticSection } from '../../src/pipeline/types';
import type { ResolvedPreviewTokens } from './token-resolver';

export type SectionRenderContext = {
  schema: CanonicalDesignSchema;
  section: SemanticSection;
  tokens: ResolvedPreviewTokens;
  breakpoint: string;
  index: number;
};

type SectionData = {
  title: string;
  body: string;
  ctaLabel: string;
  links: string[];
  imageAlt: string;
};

function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
}

function getSectionData(schema: CanonicalDesignSchema, section: SemanticSection): SectionData {
  const nodesById = new Map(
    [...schema.observation.text_nodes, ...schema.observation.regions, ...schema.observation.controls].map((node) => [node.id, node])
  );

  const text = section.node_ids
    .map((id) => nodesById.get(id)?.raw_text)
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));

  const title = text[0] ?? `${section.role} section`;
  const body = text.slice(1).join(' ') || 'Placeholder copy generated because source content was incomplete.';
  const ctaLabel = text.find((item) => item.length <= 22) ?? 'Get Started';

  return {
    title,
    body,
    ctaLabel,
    links: text.slice(0, 4),
    imageAlt: `${section.role} placeholder image`,
  };
}

function sectionCardStyle(tokens: ResolvedPreviewTokens): CSSProperties {
  return {
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.lg,
    background: tokens.colors.surface,
    boxShadow: tokens.shadow.sm,
    padding: tokens.spacing.lg,
  };
}

function imagePlaceholder(tokens: ResolvedPreviewTokens, ratio: string): CSSProperties {
  return {
    aspectRatio: ratio,
    border: `1px dashed ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    display: 'grid',
    placeItems: 'center',
    color: tokens.colors.mutedText,
    fontSize: 14,
    background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.16), rgba(148, 163, 184, 0.08))',
  };
}

const HeaderSection = ({ tokens, schema }: SectionRenderContext) => (
  <header style={{ ...sectionCardStyle(tokens), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <strong>{schema.meta.source_name || 'Website Brand'}</strong>
    <button
      type="button"
      style={{
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.radius.sm,
        background: tokens.colors.surface,
        padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
      }}
    >
      Menu
    </button>
  </header>
);

const NavSection = ({ tokens }: SectionRenderContext) => (
  <nav style={{ ...sectionCardStyle(tokens), display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
    {['Home', 'Features', 'Pricing', 'Contact'].map((item) => (
      <a key={item} href="#" style={{ color: tokens.colors.text, textDecoration: 'none', fontWeight: 600 }}>
        {item}
      </a>
    ))}
  </nav>
);

const HeroSection = (ctx: SectionRenderContext) => {
  const { tokens, schema, section, breakpoint } = ctx;
  const data = getSectionData(schema, section);
  const compact = breakpoint === 'sm';

  return (
    <section
      style={{
        ...sectionCardStyle(tokens),
        display: 'grid',
        gap: tokens.spacing.lg,
        gridTemplateColumns: compact ? '1fr' : '1.1fr 1fr',
        alignItems: 'center',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: tokens.typeScale.h1 }}>{data.title}</h2>
        <p style={{ color: tokens.colors.mutedText, fontSize: tokens.typeScale.lead }}>{data.body}</p>
        <button
          type="button"
          style={{
            border: 'none',
            borderRadius: tokens.radius.md,
            padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
            background: tokens.colors.accent,
            color: '#fff',
          }}
        >
          {data.ctaLabel}
        </button>
      </div>
      <div style={imagePlaceholder(tokens, '16 / 9')}>{data.imageAlt}</div>
    </section>
  );
};

const IntroSection = (ctx: SectionRenderContext) => {
  const data = getSectionData(ctx.schema, ctx.section);
  return (
    <section style={sectionCardStyle(ctx.tokens)}>
      <h3 style={{ marginTop: 0, fontSize: ctx.tokens.typeScale.h2 }}>{data.title}</h3>
      <p style={{ marginBottom: 0, color: ctx.tokens.colors.mutedText }}>{data.body}</p>
    </section>
  );
};

const ArticleSection = (ctx: SectionRenderContext) => {
  const { tokens, schema, section } = ctx;
  const data = getSectionData(schema, section);
  return (
    <article style={{ ...sectionCardStyle(tokens), display: 'grid', gap: tokens.spacing.md }}>
      <h3 style={{ margin: 0, fontSize: tokens.typeScale.h3 }}>{data.title}</h3>
      <p style={{ margin: 0 }}>{data.body}</p>
      <div style={imagePlaceholder(tokens, '4 / 3')}>{data.imageAlt}</div>
    </article>
  );
};

const CtaSection = (ctx: SectionRenderContext) => {
  const data = getSectionData(ctx.schema, ctx.section);
  const { tokens } = ctx;
  return (
    <section
      style={{
        ...sectionCardStyle(tokens),
        background: tokens.colors.accent,
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <p>{data.body}</p>
      <button
        type="button"
        style={{
          border: 'none',
          borderRadius: tokens.radius.md,
          padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
        }}
      >
        {data.ctaLabel}
      </button>
    </section>
  );
};

const FeatureGridSection = (ctx: SectionRenderContext) => {
  const { tokens, breakpoint } = ctx;
  const columns = breakpoint === 'lg' ? 3 : breakpoint === 'md' ? 2 : 1;
  return (
    <section style={sectionCardStyle(tokens)}>
      <h3 style={{ marginTop: 0 }}>Feature Grid</h3>
      <div style={{ display: 'grid', gap: tokens.spacing.md, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {[1, 2, 3].map((item) => (
          <div key={item} style={{ border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing.md }}>
            <div style={imagePlaceholder(tokens, '3 / 2')}>Image placeholder</div>
            <h4>Feature {item}</h4>
            <p style={{ marginBottom: 0, color: tokens.colors.mutedText }}>A concise value statement for this feature.</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const FooterSection = ({ tokens, schema }: SectionRenderContext) => (
  <footer
    style={{
      ...sectionCardStyle(tokens),
      display: 'flex',
      gap: tokens.spacing.md,
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      color: tokens.colors.mutedText,
    }}
  >
    <span>© {new Date(schema.meta.generated_at).getUTCFullYear()} {schema.meta.source_name}</span>
    <span>Privacy • Terms • Contact</span>
  </footer>
);

const GenericSection = (ctx: SectionRenderContext) => {
  const data = getSectionData(ctx.schema, ctx.section);
  return (
    <section style={sectionCardStyle(ctx.tokens)}>
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <p style={{ marginBottom: 0 }}>{data.body}</p>
    </section>
  );
};

export const sectionComponentMap: Record<string, (ctx: SectionRenderContext) => ReactElement> = {
  header: HeaderSection,
  nav: NavSection,
  hero: HeroSection,
  'intro section': IntroSection,
  intro: IntroSection,
  'article section': ArticleSection,
  article: ArticleSection,
  cta: CtaSection,
  'feature grid': FeatureGridSection,
  footer: FooterSection,
};

export function renderSection(ctx: SectionRenderContext): ReactElement {
  const roleKey = normalizeRole(ctx.section.role);
  const Component = sectionComponentMap[roleKey] ?? GenericSection;
  return <Component {...ctx} />;
}
