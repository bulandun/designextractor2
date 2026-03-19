import { BBox } from '../pipeline/types';

export function area(b: BBox): number {
  return b.width * b.height;
}

export function intersects(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}
