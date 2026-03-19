export type InputType = 'pdf' | 'image' | 'web' | 'docx_reference';

export interface ConfidenceScore {
  score: number; // 0..1
  evidence?: string[];
  alternatives?: Array<{ label: string; score: number }>;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | 'pt' | '%';
}

export interface StyleGuess {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  shadow?: string;
}

export interface AlignmentGuess {
  horizontal?: 'left' | 'center' | 'right' | 'space-between' | 'space-around';
  vertical?: 'top' | 'middle' | 'bottom';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  flow?: 'row' | 'column' | 'grid';
}

export interface ObservedNode {
  id: string;
  bbox: BBox;
  type: string;
  raw_text?: string;
  style_guess?: StyleGuess;
  alignment?: AlignmentGuess;
  confidence: number;
}

export interface ObservedLayout {
  pages: Array<{ id: string; index: number; viewport: BBox; confidence: number }>;
  regions: ObservedNode[];
  text_nodes: ObservedNode[];
  images: ObservedNode[];
  controls: ObservedNode[];
  visual_groups: ObservedNode[];
}

export interface SemanticSection {
  id: string;
  role: string;
  node_ids: string[];
  confidence: number;
  alternatives?: Array<{ role: string; confidence: number }>;
}

export interface SemanticLayout {
  sections: SemanticSection[];
  inferred_role_map: Record<string, { role: string; confidence: number; alternatives?: Array<{ role: string; confidence: number }> }>;
  reading_order: string[];
  relationships: Array<{ parent_id: string; child_id: string; relation: 'contains' | 'follows' | 'linked_to'; confidence: number }>;
  page_template_type: {
    value: string;
    confidence: number;
    alternatives?: Array<{ value: string; confidence: number }>;
  };
}

export interface DesignToken<T = unknown> {
  name: string;
  value: T;
  usage?: string[];
  confidence: number;
}

export interface DesignSystem {
  colorTokens: Array<DesignToken<string>>;
  typeTokens: Array<DesignToken<Record<string, unknown>>>;
  spacingTokens: Array<DesignToken<number>>;
  radiusTokens: Array<DesignToken<number>>;
  shadowTokens: Array<DesignToken<string>>;
  layoutTokens: Array<DesignToken<Record<string, unknown> | number>>;
  componentPatterns: Array<{ name: string; parts: string[]; evidence_nodes: string[]; confidence: number }>;
  variants: Array<{ component: string; variant_name: string; props: Record<string, unknown>; confidence: number }>;
  interactionHints: Array<{ target_id: string; state: 'hover' | 'focus' | 'active' | 'disabled'; style_delta: Record<string, unknown>; confidence: number }>;
}

export interface ResponsiveRules {
  breakpoints: Array<{ name: string; min_width?: number; max_width?: number }>;
  stacking_rules: Array<Record<string, unknown>>;
  container_rules: Array<Record<string, unknown>>;
  hide_show_behavior: Array<Record<string, unknown>>;
  typography_scaling: Array<Record<string, unknown>>;
  spacing_scaling: Array<Record<string, unknown>>;
}

export interface CanonicalDesignSchema {
  meta: {
    schema_version: string;
    generated_at: string;
    pipeline_version: string;
    source_type: InputType;
    source_name: string;
    confidence_summary: {
      overall: number;
      observation: number;
      semantics: number;
      designSystem: number;
      responsive?: number;
    };
  };
  source: {
    input_type: InputType;
    original_dimensions: { width: number; height: number; unit: 'px' | 'pt' };
    page_count?: number;
    url?: string;
    reference_documents?: Array<{ name: string; type: string; role: string }>;
  };
  observation: ObservedLayout;
  semantics: SemanticLayout;
  designSystem: DesignSystem;
  responsive: ResponsiveRules;
  builderExports: {
    lovable?: Record<string, unknown>;
    react?: Record<string, unknown>;
    builderio?: Record<string, unknown>;
    webflow?: Record<string, unknown>;
  };
}

export interface IngestedSource {
  inputType: InputType;
  name: string;
  dimensions: { width: number; height: number; unit: 'px' | 'pt' };
  pageCount?: number;
  url?: string;
  frames: Array<{ id: string; width: number; height: number; imagePath?: string }>;
  textHints?: Array<{ text: string; bbox: BBox; confidence: number }>;
  domHints?: Record<string, unknown>;
  referenceDocuments?: Array<{ name: string; type: string; role: string }>;
}

export interface PipelineOptions {
  exportTargets: Array<'lovable' | 'react' | 'builderio' | 'webflow'>;
  sourceName?: string;
}
