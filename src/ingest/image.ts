import path from 'node:path';
import { IngestedSource } from '../pipeline/types';

export async function ingestImage(imagePath: string): Promise<IngestedSource> {
  // TODO: replace with sharp metadata extraction.
  return {
    inputType: 'image',
    name: path.basename(imagePath),
    dimensions: { width: 1440, height: 900, unit: 'px' },
    frames: [{ id: 'frame_0', width: 1440, height: 900, imagePath }],
    textHints: [],
  };
}
