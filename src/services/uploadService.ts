/**
 * uploadService.ts
 *
 * Fully client-side S3 multipart upload — no backend endpoints required.
 *
 * Flow:
 *   1. CreateMultipartUpload  — signed request from browser → S3
 *   2. UploadPart (×N)        — PUT chunks directly to S3 presigned URLs
 *   3. CompleteMultipartUpload — signed request from browser → S3
 *   4. Poll FinerWorks API     — browser calls list_images until indexed
 *
 * Signing uses browser-native crypto.subtle (AWS Signature V4) — zero npm deps.
 */

// ─── Config (values from .env via REACT_APP_ prefix) ────────────────────────
const S3_REGION = process.env.REACT_APP_S3_REGION || 'us-east-1';
const S3_BUCKET = process.env.REACT_APP_S3_UPLOAD_BUCKET || 'finerworks-initial-uploads';
const ACCESS_KEY_ID = process.env.REACT_APP_S3_ACCESS_KEY_ID || '';
const SECRET_KEY = process.env.REACT_APP_S3_SECRET_ACCESS_KEY || '';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('local.finerworks.com');
const FW_API_BASE = (process.env.REACT_APP_FINERWORKS_API_URL || 'https://v2.api.finerworks.com');
const FW_WEB_KEY = process.env.REACT_APP_FINERWORKS_WEB_KEY || '';
const FW_APP_KEY = process.env.REACT_APP_FINERWORKS_APP_KEY || '';

export const UPLOAD_CONFIG = {
  MAX_UPLOADS: 10,
  MAX_FILE_SIZE_MB: 1000,
  CHUNK_SIZE: 10 * 1024 * 1024,   // 10 MB — must match S3 minimum part size
  POLL_INTERVAL_MS: 3_000,
  POLL_TIMEOUT_MS: 60_000,
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/tiff', 'image/bmp',
    'image/heic', 'image/webp', 'image/vnd.adobe.photoshop', 'application/pdf',
  ],
  ALLOWED_EXT_FALLBACKS: ['heic', 'heif', 'psd', 'webp'],
  ALLOWED_EXT_LABELS: 'JPG, PNG, TIFF, BMP, HEIC, WEBP, PSD, PDF',
};

// ─── AWS Signature V4 (browser native crypto.subtle) ────────────────────────

const enc = (s: string) => new TextEncoder().encode(s);

async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc(data));
}

async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const buf = typeof data === 'string' ? enc(data) : new Uint8Array(data);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isoDate(d: Date) {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
}
function shortDate(d: Date) { return isoDate(d).slice(0, 8); }

interface S3RequestOptions {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  key: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
}

/** Build a signed S3 request and execute it, returning the raw Response */
async function signedS3Request(opts: S3RequestOptions): Promise<Response> {
  const { method, key, queryParams = {}, body = '' } = opts;
  const now = new Date();
  const amzDate = isoDate(now);
  const dateStamp = shortDate(now);
  const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const service = 's3';

  const payloadHash = await sha256Hex(body);

  // Canonical headers
  const headers: Record<string, string> = {
    host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    ...opts.headers,
  };

  const signedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHeaders = signedHeaderKeys.join(';');

  // Sort query params
  const sortedQuery = Object.entries(queryParams)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))  // ASCII byte-value order (AWS Sig V4 spec)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const canonicalRequest = [method, canonicalUri, sortedQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const credentialScope = `${dateStamp}/${S3_REGION}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  // Derive signing key
  const signingKey = await hmac(
    await hmac(await hmac(await hmac(enc('AWS4' + SECRET_KEY), dateStamp), S3_REGION), service),
    'aws4_request'
  );
  const signature = toHex(await hmac(signingKey, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}/${key}${sortedQuery ? '?' + sortedQuery : ''}`;

  return fetch(url, {
    method,
    headers: { ...headers, Authorization: authHeader },
    body: body || undefined,
  });
}

// ─── Presigned URL for UploadPart (PUT) ─────────────────────────────────────
async function buildPresignedUploadPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn = 3600
): Promise<string> {
  const now = new Date();
  const amzDate = isoDate(now);
  const dateStamp = shortDate(now);
  const host = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const service = 's3';

  const credentialScope = `${dateStamp}/${S3_REGION}/${service}/aws4_request`;
  const signedHeaders = 'host';

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeaders,
    'partNumber': String(partNumber),
    'uploadId': uploadId,
  };

  const sortedQuery = Object.entries(queryParams)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))  // ASCII byte-value order (AWS Sig V4 spec)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = ['PUT', canonicalUri, sortedQuery, canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey = await hmac(
    await hmac(await hmac(await hmac(enc('AWS4' + SECRET_KEY), dateStamp), S3_REGION), service),
    'aws4_request'
  );
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `https://${host}/${canonicalUri.slice(1)}?${sortedQuery}&X-Amz-Signature=${signature}`;
}

// ─── Public upload API ───────────────────────────────────────────────────────

/** Step 1 – Create multipart upload session, returns uploadId */
export async function initiateMultipartUpload(
  key: string,
  fileType: string,
  metadata: Record<string, string>
): Promise<string> {
  const metadataHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata)) {
    metadataHeaders[`x-amz-meta-${k.toLowerCase()}`] = v;
  }

  const response = await signedS3Request({
    method: 'POST',
    key,
    queryParams: { uploads: '' },
    headers: {
      'content-type': fileType || 'application/octet-stream',
      ...metadataHeaders,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Initiate failed (${response.status}): ${text}`);
  }

  const xml = await response.text();
  const match = xml.match(/<UploadId>([^<]+)<\/UploadId>/);
  if (!match) throw new Error('No UploadId in S3 response');
  return match[1];
}

/** Step 2 – Upload one part, returns ETag */
export async function uploadPart(
  presignedUrl: string,
  chunk: Blob,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: chunk,
    signal,
    // No auth headers — the signature is in the URL query string
  });
  if (!res.ok) throw new Error(`Part upload failed: ${res.status}`);
  const etag = res.headers.get('ETag') || '';
  return etag.replace(/"/g, '');  // strip surrounding quotes
}

/** Get presigned PUT URL for a part */
export async function getPresignedPartUrl(
  key: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  return buildPresignedUploadPartUrl(key, uploadId, partNumber);
}

/** Step 3 – Complete the multipart upload */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<void> {
  const sorted = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
  const xmlBody = `<CompleteMultipartUpload>${sorted
    .map(p => `<Part><PartNumber>${p.PartNumber}</PartNumber><ETag>&quot;${p.ETag}&quot;</ETag></Part>`)
    .join('')}</CompleteMultipartUpload>`;

  const res = await signedS3Request({
    method: 'POST',
    key,
    queryParams: { uploadId },
    headers: { 'content-type': 'application/xml' },
    body: xmlBody,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Complete failed (${res.status}): ${text}`);
  }
}

/** Step 4 – Upload all parts (3 concurrent workers), reporting progress */
export async function uploadAllParts(
  file: File,
  key: string,
  uploadId: string,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void
): Promise<{ ETag: string; PartNumber: number }[]> {
  const totalParts = Math.ceil(file.size / UPLOAD_CONFIG.CHUNK_SIZE);
  const queue: number[] = Array.from({ length: totalParts }, (_, i) => i + 1);
  const results: { ETag: string; PartNumber: number }[] = [];
  let completed = 0;

  async function worker() {
    while (queue.length > 0) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const partNum = queue.shift();
      if (partNum === undefined) return;

      const start = (partNum - 1) * UPLOAD_CONFIG.CHUNK_SIZE;
      const chunk = file.slice(start, start + UPLOAD_CONFIG.CHUNK_SIZE);
      const url = await getPresignedPartUrl(key, uploadId, partNum);
      const etag = await uploadPart(url, chunk, signal);

      results.push({ ETag: etag, PartNumber: partNum });
      completed++;
      onProgress(completed, totalParts);
    }
  }

  await Promise.all([worker(), worker(), worker()]);
  return results;
}

/** Step 5 – Poll FinerWorks until the image appears in the library */
export async function pollUntilIndexed(
  imageGuid: string,
  library: string,
  accountKey: string,
  sessionId: string,
  signal: AbortSignal
): Promise<string | undefined> {
  const started = Date.now();

  while (true) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (Date.now() - started > UPLOAD_CONFIG.POLL_TIMEOUT_MS) {
      throw new Error('Timed out waiting for image to be indexed');
    }

    await new Promise(r => setTimeout(r, UPLOAD_CONFIG.POLL_INTERVAL_MS));
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      const body = JSON.stringify({
        library: { name: library, site_id: 2, account_key: accountKey, session_id: sessionId },
        guid_filter: [imageGuid],
        page_number: 1,
        per_page: 1,
      });

      const res = await fetch(`${FW_API_BASE}/V3/list_images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'web_api_key': FW_WEB_KEY,
          'app_key': FW_APP_KEY,
        },
        body,
        signal,
      });

      const data = await res.json();
      if (data?.images?.length > 0) {
        return data.images[0].public_thumbnail_uri as string;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      // transient error — keep polling
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function validateFile(file: File, existingCount: number): string | null {
  if (existingCount >= UPLOAD_CONFIG.MAX_UPLOADS)
    return `Max ${UPLOAD_CONFIG.MAX_UPLOADS} files allowed.`;

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const validMime = UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type);
  const validExt = UPLOAD_CONFIG.ALLOWED_EXT_FALLBACKS.includes(ext);
  if (!validMime && !validExt)
    return `"${file.name}" has an unsupported type.`;

  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024)
    return `"${file.name}" exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE_MB} MB.`;

  return null;
}
