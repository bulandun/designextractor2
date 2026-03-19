export interface TypeScaleGuess {
  sizes: number[];
  weights: number[];
}

export function estimateTypeScale(fontSizes: number[], fontWeights: number[]): TypeScaleGuess {
  return {
    sizes: [...new Set(fontSizes)].sort((a, b) => a - b),
    weights: [...new Set(fontWeights)].sort((a, b) => a - b),
  };
}
