import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizeSheetUrl } from '@/lib/sheet';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_ALLOWLIST = ['docs.google.com'];

function getAllowedHosts() {
  const envHosts = (process.env.SHEET_FETCH_ALLOWLIST || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ALLOWLIST, ...envHosts]));
}

function isHostAllowed(hostname: string, allowedHosts: string[]) {
  const normalizedHost = hostname.toLowerCase();
  return allowedHosts.some((allowedHost) => normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`));
}

async function readTextWithSizeLimit(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();

  if (!reader) {
    const fallbackText = await response.text();
    if (new TextEncoder().encode(fallbackText).byteLength > maxBytes) {
      throw new Error(`Response too large. Limit is ${Math.round(maxBytes / 1024)} KB.`);
    }
    return fallbackText;
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let receivedBytes = 0;

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Response too large. Limit is ${Math.round(maxBytes / 1024)} KB.`);
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join('');
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const inputUrl = String(body?.url || '').trim();

    if (!inputUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const normalizedUrl = normalizeSheetUrl(inputUrl);
    const parsed = new URL(normalizedUrl);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
    }

    const allowedHosts = getAllowedHosts();
    if (!isHostAllowed(parsed.hostname, allowedHosts)) {
      return NextResponse.json(
        {
          error: `Host not allowed. Allowed hosts: ${allowedHosts.join(', ')}`
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(normalizedUrl, {
      headers: {
        Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8'
      },
      cache: 'no-store',
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL (${response.status} ${response.statusText})` },
        { status: 400 }
      );
    }

    const contentLengthHeader = Number(response.headers.get('content-length') || 0);
    if (Number.isFinite(contentLengthHeader) && contentLengthHeader > MAX_RESPONSE_BYTES) {
      return NextResponse.json(
        { error: `Sheet is too large. Max allowed size is ${Math.round(MAX_RESPONSE_BYTES / 1024)} KB.` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const normalizedContentType = contentType.toLowerCase();
    const isTextLike =
      normalizedContentType.includes('text/csv') ||
      normalizedContentType.includes('text/plain') ||
      normalizedContentType.includes('application/vnd.ms-excel') ||
      normalizedContentType === '';

    if (!isTextLike) {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}` },
        { status: 400 }
      );
    }

    const csvText = await readTextWithSizeLimit(response, MAX_RESPONSE_BYTES);

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'Fetched sheet is empty' }, { status: 400 });
    }

    return NextResponse.json({ csvText });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: `Timed out while fetching sheet (>${FETCH_TIMEOUT_MS / 1000}s).` },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error while fetching sheet' },
      { status: 500 }
    );
  }
}
