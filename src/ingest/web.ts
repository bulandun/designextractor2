import { IngestedSource } from '../pipeline/types';

export async function ingestWeb(url: string): Promise<IngestedSource> {
  // TODO: add Playwright screenshot + DOM extraction.
  return {
    inputType: 'web',
    name: url,
    url,
    dimensions: { width: 1440, height: 2000, unit: 'px' },
    frames: [{ id: 'frame_0', width: 1440, height: 2000 }],
    domHints: {
      note: 'placeholder-dom-hints'
    },
  };
}
