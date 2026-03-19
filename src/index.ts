import { ingestDocxReference } from './ingest/docx-reference';
import { ingestImage } from './ingest/image';
import { ingestPdf } from './ingest/pdf';
import { ingestWeb } from './ingest/web';
import { DEFAULT_PIPELINE_OPTIONS, PIPELINE_VERSION } from './config';
import { abstractDesignSystem } from './pipeline/abstract';
import { runExporters } from './pipeline/export';
import { interpret } from './pipeline/interpret';
import { observe } from './pipeline/observe';
import { CanonicalDesignSchema, InputType } from './pipeline/types';
import { averageConfidence } from './utils/confidence';

export interface BuildSchemaRequest {
  inputType: InputType;
  inputPathOrUrl: string;
  sourceName?: string;
  referenceDocxPath?: string;
}

export async function buildSchema(request: BuildSchemaRequest): Promise<CanonicalDesignSchema> {
  const source = await (async () => {
    if (request.inputType === 'image') return ingestImage(request.inputPathOrUrl);
    if (request.inputType === 'pdf') return ingestPdf(request.inputPathOrUrl);
    if (request.inputType === 'web') return ingestWeb(request.inputPathOrUrl);
    throw new Error(`Unsupported input type: ${request.inputType}`);
  })();

  if (request.referenceDocxPath) {
    const doc = await ingestDocxReference(request.referenceDocxPath);
    source.referenceDocuments = [{ name: doc.name, type: 'docx', role: 'reference_only' }];
  }

  const observation = await observe(source);
  const semantics = await interpret(observation);
  const { designSystem, responsive } = await abstractDesignSystem(observation, semantics);

  const confidence = {
    observation: averageConfidence([
      ...observation.regions.map((r) => r.confidence),
      ...observation.text_nodes.map((t) => t.confidence),
      ...observation.controls.map((c) => c.confidence),
    ]),
    semantics: averageConfidence(semantics.sections.map((s) => s.confidence)),
    designSystem: averageConfidence([
      ...designSystem.colorTokens.map((t) => t.confidence),
      ...designSystem.typeTokens.map((t) => t.confidence),
      ...designSystem.spacingTokens.map((t) => t.confidence),
    ]),
  };

  const canonical: CanonicalDesignSchema = {
    meta: {
      schema_version: '1.0.0',
      generated_at: new Date().toISOString(),
      pipeline_version: PIPELINE_VERSION,
      source_type: source.inputType,
      source_name: request.sourceName ?? source.name,
      confidence_summary: {
        overall: averageConfidence([confidence.observation, confidence.semantics, confidence.designSystem]),
        observation: confidence.observation,
        semantics: confidence.semantics,
        designSystem: confidence.designSystem,
      },
    },
    source: {
      input_type: source.inputType,
      original_dimensions: source.dimensions,
      page_count: source.pageCount,
      url: source.url,
      reference_documents: source.referenceDocuments,
    },
    observation,
    semantics,
    designSystem,
    responsive,
    builderExports: {},
  };

  canonical.builderExports = runExporters(canonical, DEFAULT_PIPELINE_OPTIONS);
  return canonical;
}
