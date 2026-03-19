import { NextRequest, NextResponse } from 'next/server';
import { buildSchema } from '../../../src/index';

export const runtime = 'nodejs';

const ALLOWED_INPUT_TYPES = new Set(['pdf', 'image', 'web']);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { inputType, inputPathOrUrl, sourceName } = payload ?? {};

    if (!ALLOWED_INPUT_TYPES.has(inputType)) {
      return NextResponse.json(
        { error: 'inputType must be one of: pdf | image | web' },
        { status: 400 }
      );
    }

    if (typeof inputPathOrUrl !== 'string' || !inputPathOrUrl.trim()) {
      return NextResponse.json(
        { error: 'inputPathOrUrl is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const schema = await buildSchema({
      inputType,
      inputPathOrUrl: inputPathOrUrl.trim(),
      sourceName: typeof sourceName === 'string' ? sourceName : undefined,
    });

    return NextResponse.json(schema);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
