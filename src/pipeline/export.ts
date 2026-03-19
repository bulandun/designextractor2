import { exportBuilderIo } from '../exporters/builderio';
import { exportLovable } from '../exporters/lovable';
import { exportReact } from '../exporters/react';
import { exportWebflow } from '../exporters/webflow';
import { CanonicalDesignSchema, PipelineOptions } from './types';

export function runExporters(canonical: CanonicalDesignSchema, options: PipelineOptions): CanonicalDesignSchema['builderExports'] {
  const out: CanonicalDesignSchema['builderExports'] = {};

  for (const target of options.exportTargets) {
    if (target === 'react') out.react = exportReact(canonical);
    if (target === 'lovable') out.lovable = exportLovable(canonical);
    if (target === 'builderio') out.builderio = exportBuilderIo(canonical);
    if (target === 'webflow') out.webflow = exportWebflow(canonical);
  }

  return out;
}
