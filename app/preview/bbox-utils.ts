import type { BBox, ObservedNode } from '../../src/pipeline/types';

export type ScaledBBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type RepeatedGroup = {
  key: string;
  memberIds: string[];
  orientation: 'row' | 'column';
};

const MIN_VISIBLE_SIZE = 6;
const HEAVY_OVERLAP_IOU = 0.72;

export function clampBBoxToPage(bbox: BBox, page: BBox): BBox {
  const x = Math.max(page.x, bbox.x);
  const y = Math.max(page.y, bbox.y);
  const maxX = Math.min(page.x + page.width, bbox.x + bbox.width);
  const maxY = Math.min(page.y + page.height, bbox.y + bbox.height);

  return {
    ...bbox,
    x,
    y,
    width: Math.max(0, maxX - x),
    height: Math.max(0, maxY - y),
  };
}

export function scaleBBox(bbox: BBox, page: BBox, canvasWidth: number, canvasHeight: number): ScaledBBox {
  const clamped = clampBBoxToPage(bbox, page);
  const relativeX = (clamped.x - page.x) / page.width;
  const relativeY = (clamped.y - page.y) / page.height;
  const relativeW = clamped.width / page.width;
  const relativeH = clamped.height / page.height;

  return {
    left: relativeX * canvasWidth,
    top: relativeY * canvasHeight,
    width: Math.max(MIN_VISIBLE_SIZE, relativeW * canvasWidth),
    height: Math.max(MIN_VISIBLE_SIZE, relativeH * canvasHeight),
  };
}

function intersectionArea(a: BBox, b: BBox): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

function bboxArea(bbox: BBox): number {
  return Math.max(0, bbox.width) * Math.max(0, bbox.height);
}

export function iou(a: BBox, b: BBox): number {
  const inter = intersectionArea(a, b);
  if (!inter) return 0;
  const union = bboxArea(a) + bboxArea(b) - inter;
  return union > 0 ? inter / union : 0;
}

export function dedupeOverlappingRegions(regions: ObservedNode[]): ObservedNode[] {
  const sorted = [...regions].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return bboxArea(b.bbox) - bboxArea(a.bbox);
  });

  const kept: ObservedNode[] = [];
  for (const region of sorted) {
    const isDuplicate = kept.some((candidate) => iou(region.bbox, candidate.bbox) >= HEAVY_OVERLAP_IOU);
    if (!isDuplicate) kept.push(region);
  }

  return kept.sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);
}

function near(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function detectRepeatedCardGroups(regions: ObservedNode[]): RepeatedGroup[] {
  const groups = new Map<string, ObservedNode[]>();
  const usable = regions.filter((r) => r.confidence >= 0.76);

  for (const region of usable) {
    const widthBucket = Math.round(region.bbox.width / 36);
    const heightBucket = Math.round(region.bbox.height / 36);
    const key = `${region.type}-${widthBucket}-${heightBucket}`;

    const members = groups.get(key) ?? [];
    members.push(region);
    groups.set(key, members);
  }

  return [...groups.entries()]
    .filter(([, members]) => members.length >= 3)
    .map(([key, members]) => {
      const sortedX = [...members].sort((a, b) => a.bbox.x - b.bbox.x);
      const sortedY = [...members].sort((a, b) => a.bbox.y - b.bbox.y);

      const firstX = sortedX[0]?.bbox.x ?? 0;
      const firstY = sortedY[0]?.bbox.y ?? 0;
      const sameRowCount = members.filter((item) => near(item.bbox.y, firstY, 30)).length;
      const sameColumnCount = members.filter((item) => near(item.bbox.x, firstX, 30)).length;

      return {
        key,
        memberIds: members.map((item) => item.id),
        orientation: sameRowCount >= sameColumnCount ? 'row' : 'column',
      };
    });
}

export function computeNesting(regions: ObservedNode[]): Map<string, string | null> {
  const parents = new Map<string, string | null>();

  for (const child of regions) {
    let bestParent: ObservedNode | null = null;

    for (const candidate of regions) {
      if (child.id === candidate.id) continue;
      const childInside =
        child.bbox.x >= candidate.bbox.x &&
        child.bbox.y >= candidate.bbox.y &&
        child.bbox.x + child.bbox.width <= candidate.bbox.x + candidate.bbox.width &&
        child.bbox.y + child.bbox.height <= candidate.bbox.y + candidate.bbox.height;

      if (!childInside) continue;
      if (!bestParent || bboxArea(candidate.bbox) < bboxArea(bestParent.bbox)) {
        bestParent = candidate;
      }
    }

    parents.set(child.id, bestParent?.id ?? null);
  }

  return parents;
}
