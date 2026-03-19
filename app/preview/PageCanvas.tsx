import { useMemo, type CSSProperties } from 'react';
import type { CanonicalDesignSchema, ObservedNode } from '../../src/pipeline/types';
import {
  computeNesting,
  dedupeOverlappingRegions,
  detectRepeatedCardGroups,
  scaleBBox,
  type RepeatedGroup,
} from './bbox-utils';

type PageCanvasProps = {
  schema: CanonicalDesignSchema;
};

type CanvasNode = {
  node: ObservedNode;
  kind: 'region' | 'image' | 'text';
};

const CANVAS_WIDTH = 920;

function truncateText(text: string, max = 160): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function nodeZIndex(node: ObservedNode, kind: CanvasNode['kind'], readingOrder: string[]): number {
  const readingPos = readingOrder.indexOf(node.id);
  const base = readingPos >= 0 ? 100 + readingPos : 20;
  if (kind === 'image') return base + 10;
  if (kind === 'text') return base + 20;
  return base;
}

function cardGroupForNode(groups: RepeatedGroup[], nodeId: string): RepeatedGroup | undefined {
  return groups.find((group) => group.memberIds.includes(nodeId));
}

function regionStyle(node: ObservedNode, repeatedGroup?: RepeatedGroup): CSSProperties {
  const background = repeatedGroup ? 'rgba(59, 130, 246, 0.11)' : 'rgba(148, 163, 184, 0.08)';
  return {
    border: repeatedGroup ? '1px solid rgba(37, 99, 235, 0.45)' : '1px solid rgba(71, 85, 105, 0.55)',
    borderRadius: repeatedGroup ? 9 : 7,
    background,
    overflow: 'hidden',
    display: 'grid',
    alignContent: 'start',
    gap: 4,
    padding: 6,
  };
}

export function PageCanvas({ schema }: PageCanvasProps) {
  const page = schema.observation.pages[0]?.viewport ?? {
    x: 0,
    y: 0,
    width: schema.source.original_dimensions.width,
    height: schema.source.original_dimensions.height,
    unit: 'px' as const,
  };

  const canvasHeight = Math.max(320, (page.height / page.width) * CANVAS_WIDTH);

  const dedupedRegions = useMemo(() => dedupeOverlappingRegions(schema.observation.regions), [schema.observation.regions]);
  const repeatedGroups = useMemo(() => detectRepeatedCardGroups(dedupedRegions), [dedupedRegions]);
  const nesting = useMemo(() => computeNesting(dedupedRegions), [dedupedRegions]);

  const nodes: CanvasNode[] = [
    ...dedupedRegions.map((node) => ({ node, kind: 'region' as const })),
    ...schema.observation.images.map((node) => ({ node, kind: 'image' as const })),
    ...schema.observation.text_nodes.map((node) => ({ node, kind: 'text' as const })),
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, color: '#475569' }}>
        Deduped regions: <strong>{dedupedRegions.length}</strong> / {schema.observation.regions.length} • Repeated groups: <strong>{repeatedGroups.length}</strong>
      </div>
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
          padding: 14,
        }}
      >
        <div
          style={{
            width: CANVAS_WIDTH,
            height: canvasHeight,
            position: 'relative',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
          }}
        >
          {nodes.map(({ node, kind }) => {
            const scaled = scaleBBox(node.bbox, page, CANVAS_WIDTH, canvasHeight);
            const parentId = kind === 'region' ? nesting.get(node.id) : null;
            const repeated = kind === 'region' ? cardGroupForNode(repeatedGroups, node.id) : undefined;

            const commonStyle: CSSProperties = {
              position: 'absolute',
              left: scaled.left,
              top: scaled.top,
              width: scaled.width,
              height: scaled.height,
              zIndex: nodeZIndex(node, kind, schema.semantics.reading_order),
            };

            if (kind === 'image') {
              return (
                <div
                  key={`image-${node.id}`}
                  style={{
                    ...commonStyle,
                    border: '1px dashed rgba(14, 116, 144, 0.55)',
                    background: 'repeating-linear-gradient(45deg, rgba(125, 211, 252, 0.22), rgba(125, 211, 252, 0.22) 8px, rgba(186, 230, 253, 0.14) 8px, rgba(186, 230, 253, 0.14) 16px)',
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#0f766e',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                  }}
                >
                  Image
                </div>
              );
            }

            if (kind === 'text') {
              return (
                <div
                  key={`text-${node.id}`}
                  style={{
                    ...commonStyle,
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'rgba(241, 245, 249, 0.72)',
                    borderRadius: 4,
                    padding: 4,
                    fontSize: 10,
                    lineHeight: 1.35,
                    color: '#334155',
                    overflow: 'hidden',
                  }}
                  title={node.raw_text || ''}
                >
                  {truncateText(node.raw_text || 'Text block')}
                </div>
              );
            }

            return (
              <div key={`region-${node.id}`} style={{ ...commonStyle, ...regionStyle(node, repeated) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#334155' }}>
                  <strong style={{ fontSize: 10, textTransform: 'uppercase' }}>{node.type || 'region'}</strong>
                  <span>{Math.round(node.confidence * 100)}%</span>
                </div>
                {repeated ? (
                  <span style={{ fontSize: 10, color: '#1d4ed8' }}>
                    Repeated cards ({repeated.orientation})
                  </span>
                ) : null}
                {parentId ? <span style={{ fontSize: 10, color: '#64748b' }}>In {parentId}</span> : null}
              </div>
            );
          })}
        </div>
      </div>

      {schema.observation.regions.length > 0 ? (
        <details>
          <summary style={{ cursor: 'pointer', color: '#334155', fontSize: 13 }}>Debug region list</summary>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {schema.observation.regions.map((node) => (
              <div key={node.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, background: '#fff' }}>
                <strong>{node.id}</strong> • {node.type} • ({Math.round(node.bbox.x)}, {Math.round(node.bbox.y)}) → {Math.round(node.bbox.width)}×
                {Math.round(node.bbox.height)}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
