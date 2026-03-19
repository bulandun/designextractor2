import { IngestedSource, ObservedLayout, ObservedNode } from './types';

type DomBlockHint = {
  id: string;
  tag: string;
  role: string;
  text: string;
  depth: number;
  order: number;
};

function guessStyle(tag: string, text: string, order: number): ObservedNode['style_guess'] {
  const isHeading = tag === 'header' || /^.{0,80}$/.test(text);
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: isHeading ? 32 : 16,
    lineHeight: isHeading ? 1.2 : 1.5,
    fontWeight: isHeading ? 700 : 400,
    color: '#111827',
    backgroundColor: order % 2 === 0 ? '#ffffff' : '#f8fafc',
  };
}

function guessConfidence(tag: string, role: string): number {
  if (['header', 'nav', 'main', 'footer', 'article', 'aside'].includes(tag)) return 0.93;
  if (role !== 'region') return 0.84;
  return 0.72;
}

export async function observe(source: IngestedSource): Promise<ObservedLayout> {
  const frame = source.frames[0];
  const domBlocks = (source.domHints?.domBlocks as DomBlockHint[] | undefined) ?? [];

  const estimatedBlockHeight = domBlocks.length ? Math.max(120, Math.floor((frame.height - 48) / domBlocks.length)) : 140;

  const regions: ObservedNode[] = domBlocks.map((block, idx) => {
    const y = 24 + idx * estimatedBlockHeight;
    return {
      id: `region_${idx + 1}`,
      bbox: {
        x: 32,
        y,
        width: frame.width - 64,
        height: Math.max(110, estimatedBlockHeight - 20),
        unit: 'px',
      },
      type: block.role,
      raw_text: block.text,
      style_guess: guessStyle(block.tag, block.text, idx),
      alignment: {
        horizontal: block.tag === 'nav' ? 'space-between' : 'left',
        vertical: 'top',
        textAlign: 'left',
        flow: block.tag === 'nav' ? 'row' : 'column',
      },
      confidence: guessConfidence(block.tag, block.role),
    };
  });

  const textNodes: ObservedNode[] = domBlocks.map((block, idx) => ({
    id: `text_${idx + 1}`,
    bbox: {
      x: 48,
      y: 40 + idx * estimatedBlockHeight,
      width: frame.width - 96,
      height: 80,
      unit: 'px',
    },
    type: 'text',
    raw_text: block.text,
    style_guess: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: idx === 0 ? 34 : 16,
      lineHeight: 1.4,
      fontWeight: idx < 2 ? 600 : 400,
      color: '#111827',
    },
    alignment: { horizontal: 'left', vertical: 'top', textAlign: 'left', flow: 'column' },
    confidence: 0.86,
  }));

  const imageNodes: ObservedNode[] = regions.slice(0, 4).map((region, idx) => ({
    id: `image_${idx + 1}`,
    bbox: {
      x: region.bbox.x + region.bbox.width - 280,
      y: region.bbox.y + 20,
      width: 240,
      height: 140,
      unit: 'px',
    },
    type: 'image',
    raw_text: 'image placeholder',
    confidence: 0.58,
  }));

  return {
    pages: [
      {
        id: 'page_1',
        index: 0,
        viewport: { x: 0, y: 0, width: frame.width, height: frame.height, unit: 'px' },
        confidence: 0.95,
      },
    ],
    regions,
    text_nodes: textNodes,
    images: imageNodes,
    controls: [],
    visual_groups: [],
  };
}
