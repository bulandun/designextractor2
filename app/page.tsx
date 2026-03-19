'use client';

import { FormEvent, useMemo, useState } from 'react';
import { PreviewRenderer } from './preview/PreviewRenderer';
import type { CanonicalDesignSchema } from '../src/pipeline/types';

type InputType = 'pdf' | 'image' | 'web';
type OutputMode = 'json' | 'preview' | 'split';

type ApiPayload = {
  inputType: InputType;
  inputPathOrUrl: string;
  sourceName?: string;
};

function isCanonicalSchema(value: unknown): value is CanonicalDesignSchema {
  if (!value || typeof value !== 'object') return false;
  const asRecord = value as Record<string, unknown>;
  return 'semantics' in asRecord && 'designSystem' in asRecord && 'responsive' in asRecord;
}

export default function HomePage() {
  const [inputType, setInputType] = useState<InputType>('web');
  const [inputPathOrUrl, setInputPathOrUrl] = useState('https://example.com');
  const [sourceName, setSourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [outputMode, setOutputMode] = useState<OutputMode>('split');

  const schema = useMemo(() => (isCanonicalSchema(result) ? result : null), [result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload: ApiPayload = {
      inputType,
      inputPathOrUrl,
      ...(sourceName.trim() ? { sourceName: sourceName.trim() } : {}),
    };

    try {
      const response = await fetch('/api/build-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? 'Request failed');
      }

      setResult(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Design Extractor MVP</h1>
      <p>Submit source details and generate a canonical design schema.</p>

      <form onSubmit={onSubmit}>
        <label>
          Input type
          <select value={inputType} onChange={(e) => setInputType(e.target.value as InputType)}>
            <option value="pdf">pdf</option>
            <option value="image">image</option>
            <option value="web">web</option>
          </select>
        </label>

        <label>
          Input path or URL
          <input
            required
            value={inputPathOrUrl}
            onChange={(e) => setInputPathOrUrl(e.target.value)}
            placeholder="/tmp/design.pdf or https://example.com"
          />
        </label>

        <label>
          Source name (optional)
          <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Marketing landing page" />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Building schema...' : 'Build schema'}
        </button>
      </form>

      {error ? <p style={{ color: '#b91c1c' }}>Error: {error}</p> : null}

      {result ? (
        <section className="output-shell">
          <div className="view-toggle" role="tablist" aria-label="Output view mode">
            {(['json', 'preview', 'split'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setOutputMode(mode)}
                className={outputMode === mode ? 'active' : ''}
                aria-pressed={outputMode === mode}
              >
                {mode === 'json' ? 'JSON view' : mode === 'preview' ? 'Preview view' : 'Split view'}
              </button>
            ))}
          </div>

          <div className={`output-grid output-${outputMode}`}>
            {(outputMode === 'json' || outputMode === 'split') && <pre>{JSON.stringify(result, null, 2)}</pre>}
            {(outputMode === 'preview' || outputMode === 'split') &&
              (schema ? <PreviewRenderer schema={schema} /> : <p>Preview unavailable: result is not a canonical schema.</p>)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
