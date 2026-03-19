import path from 'node:path';
import { IngestedSource } from '../pipeline/types';

export async function ingestPdf(pdfPath: string): Promise<IngestedSource> {
  // TODO: add pdfjs-dist parsing + first-page rasterization.
  return {
    inputType: 'pdf',
    name: path.basename(pdfPath),
    dimensions: { width: 1440, height: 2000, unit: 'px' },
    pageCount: 1,
    frames: [{ id: 'frame_0', width: 1440, height: 2000 }],
    textHints: [],
  };
}
