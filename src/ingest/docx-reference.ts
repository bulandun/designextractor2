export interface DocxReference {
  name: string;
  tokenHints: Array<{ category: string; name: string; value: string | number }>;
  namingConventions: string[];
  confidence: number;
}

export async function ingestDocxReference(docxPath: string): Promise<DocxReference> {
  // TODO: parse DOCX with mammoth; this is reference-only guidance.
  return {
    name: docxPath,
    tokenHints: [],
    namingConventions: [],
    confidence: 0.5,
  };
}
