let seq = 0;

export function nextId(prefix = 'node'): string {
  seq += 1;
  return `${prefix}_${seq}`;
}
