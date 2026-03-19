import { IngestedSource, ObservedLayout } from './types';

export async function observe(source: IngestedSource): Promise<ObservedLayout> {
  const frame = source.frames[0];

  // TODO: CV + OCR-backed extraction.
  return {
    pages: [
      {
        id: 'page_1',
        index: 0,
        viewport: { x: 0, y: 0, width: frame.width, height: frame.height, unit: 'px' },
        confidence: 0.99,
      },
    ],
    regions: [],
    text_nodes: [],
    images: [],
    controls: [],
    visual_groups: [],
  };
}
