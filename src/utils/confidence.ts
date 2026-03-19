export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function averageConfidence(values: number[]): number {
  if (!values.length) return 0;
  return clampConfidence(values.reduce((a, b) => a + b, 0) / values.length);
}
