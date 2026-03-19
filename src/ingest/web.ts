import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IngestedSource } from '../pipeline/types';

type DomBlockHint = {
  id: string;
  tag: string;
  role: string;
  text: string;
  depth: number;
  order: number;
};

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferRole(tag: string, attrs: string): string {
  const haystack = `${tag} ${attrs}`.toLowerCase();
  if (haystack.includes('header') || haystack.includes('masthead')) return 'masthead';
  if (haystack.includes('nav')) return 'nav';
  if (haystack.includes('hero') || haystack.includes('banner')) return 'hero';
  if (haystack.includes('sidebar') || haystack.includes('aside')) return 'sidebar';
  if (haystack.includes('footer')) return 'footer';
  if (haystack.includes('article') || haystack.includes('post')) return 'article-card';
  if (tag === 'section' || tag === 'main') return 'section';
  return 'region';
}

function extractDomBlocks(html: string): DomBlockHint[] {
  const blockRe = /<(header|nav|main|section|article|aside|footer|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const blocks: DomBlockHint[] = [];
  let match: RegExpExecArray | null;
  let order = 0;

  while ((match = blockRe.exec(html)) && blocks.length < 60) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? '';
    const content = match[3] ?? '';
    const text = stripTags(content);
    if (text.length < 15) continue;
    const depth = (match[0].match(/<(section|article|div|main|aside|header|footer|nav)/gi) ?? []).length;

    blocks.push({
      id: `dom_${order + 1}`,
      tag,
      role: inferRole(tag, attrs),
      text: text.slice(0, 260),
      depth,
      order,
    });
    order += 1;
  }

  return blocks;
}

async function captureScreenshot(url: string): Promise<string | undefined> {
  try {
    const encoded = encodeURIComponent(url);
    const screenshotUrl = `https://s.wordpress.com/mshots/v1/${encoded}?w=1440`;
    const response = await fetch(screenshotUrl);
    if (!response.ok) return undefined;
    const arr = await response.arrayBuffer();
    const outputDir = path.resolve(process.cwd(), 'tmp', 'captures');
    await mkdir(outputDir, { recursive: true });
    const fileName = `${new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_')}-${Date.now()}.jpg`;
    const outPath = path.join(outputDir, fileName);
    await writeFile(outPath, Buffer.from(arr));
    return outPath;
  } catch {
    return undefined;
  }
}

export async function ingestWeb(url: string): Promise<IngestedSource> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'designextractor2-mvp/0.2',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch URL (${response.status}): ${url}`);
  }

  const html = await response.text();
  const title = extractTitle(html) ?? url;
  const domBlocks = extractDomBlocks(html);
  const screenshotPath = await captureScreenshot(url);

  return {
    inputType: 'web',
    name: title,
    url,
    dimensions: { width: 1440, height: 2400, unit: 'px' },
    frames: [{ id: 'frame_0', width: 1440, height: 2400, ...(screenshotPath ? { imagePath: screenshotPath } : {}) }],
    domHints: {
      title,
      domBlocks,
      screenshotPath,
      fetchedAt: new Date().toISOString(),
    },
  };
}
