export function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase();
}

export function dedupeColors(colors: string[]): string[] {
  return [...new Set(colors.map(normalizeHex))];
}
