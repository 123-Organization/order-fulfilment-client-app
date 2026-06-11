/**
 * cloudImportService.ts
 *
 * Client-side cloud provider file pickers.
 * Both SDKs are lazy-loaded on first use (no bundle cost when unused).
 *
 * Flow for both providers:
 *   1. Load SDK script from CDN (once)
 *   2. Open the provider's native picker UI
 *   3. Fetch selected files as Blobs → wrap in File objects
 *   4. Return File[] — caller passes them to handleFiles() → existing S3 upload
 */

const DROPBOX_APP_KEY  = process.env.REACT_APP_DROPBOX_APP_KEY  || '';
const DROPBOX_REDIRECT = `${window.location.origin}/dropbox-callback.html`;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY   = process.env.REACT_APP_GOOGLE_API_KEY   || '';   // optional

declare global {
  interface Window {
    Dropbox: any;
    gapi: any;
    google: any;
  }
}

// ─── Generic script loader (idempotent) ─────────────────────────────────────

function loadScript(src: string, id: string, attrs: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      // Always re-apply attrs in case the script was inserted without them
      Object.entries(attrs).forEach(([k, v]) => existing.setAttribute(k, v));
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.id  = id;
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

// ─── DROPBOX CHOOSER ─────────────────────────────────────────────────────────

const DROPBOX_ALLOWED_EXT = [
  '.jpg', '.jpeg', '.png', '.tiff', '.tif',
  '.bmp', '.heic', '.heif', '.webp', '.psd', '.pdf',
];

/**
 * Opens the Dropbox Chooser popup.
 * The SDK is pre-loaded in public/index.html with the correct data-app-key.
 * Returns a File[] of the files the user selected (empty if cancelled).
 */
export async function openDropboxPicker(): Promise<File[]> {
  if (!window.Dropbox) throw new Error('Dropbox SDK not loaded. Check internet connection.');

  return new Promise((resolve, reject) => {
    window.Dropbox.choose({
      linkType:    'direct',   // dl.dropboxusercontent.com — CORS-safe
      multiselect: true,
      extensions:  DROPBOX_ALLOWED_EXT,
      folderselect: false,

      success: async (dbFiles: Array<{ link: string; name: string; bytes: number }>) => {
        try {
          const files: File[] = [];
          for (const f of dbFiles) {
            const res = await fetch(f.link);
            if (!res.ok) throw new Error(`Dropbox: could not download "${f.name}" (${res.status})`);
            const blob = await res.blob();
            files.push(new File([blob], f.name, { type: blob.type || 'application/octet-stream' }));
          }
          resolve(files);
        } catch (err) {
          reject(err);
        }
      },

      cancel: () => resolve([]),
    });
  });
}

// ─── GOOGLE DRIVE — embedded file browser ────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const ALLOWED_MIMES = [
  'image/jpeg','image/png','image/tiff','image/bmp',
  'image/heic','image/webp','application/pdf','image/vnd.adobe.photoshop',
];

/** Step 1 — OAuth: opens a small Google popup, returns the access token */
export function googleAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    loadScript('https://accounts.google.com/gsi/client', 'gsi-sdk')
      .then(() => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (resp: any) => {
            if (resp.error) reject(new Error(resp.error_description || resp.error));
            else resolve(resp.access_token as string);
          },
        });
        client.requestAccessToken({ prompt: '' });
      })
      .catch(reject);
  });
}

/** Step 2 — List files/folders inside a Drive folder */
export async function googleListFiles(
  token: string,
  folderId = 'root',
): Promise<DriveFile[]> {
  const mimeFilter = [FOLDER_MIME, ...ALLOWED_MIMES]
    .map(m => `mimeType='${m}'`).join(' or ');
  const q = encodeURIComponent(`'${folderId}' in parents and (${mimeFilter}) and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink,size)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100&orderBy=folder,name`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Drive API error (${res.status})`);
  }
  const data = await res.json();
  return data.files as DriveFile[];
}

/** Step 3 — Download one Drive file, returns a browser File object */
export async function googleDownloadFile(
  token: string,
  file: DriveFile,
): Promise<File> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Could not download "${file.name}" (${res.status})`);
  const blob = await res.blob();
  return new File([blob], file.name, { type: file.mimeType || blob.type });
}

// ─── DROPBOX — embedded file browser (OAuth Implicit Grant + REST API) ───────

export interface DropboxEntry {
  id: string;
  name: string;
  path_lower: string;
  '.tag': 'file' | 'folder';
  size?: number;
  thumbnailUrl?: string;  // populated by dropboxGetThumbnails
}

const DROPBOX_ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/tiff', 'image/bmp',
  'image/heic', 'image/webp', 'application/pdf', 'image/vnd.adobe.photoshop',
];
const DROPBOX_ALLOWED_EXT_REGEX = /\.(jpe?g|png|tiff?|bmp|heic|heif|webp|psd|pdf)$/i;

/**
 * Opens a small popup to Dropbox OAuth (Implicit Grant / token flow).
 * Returns the access token when the user approves.
 */
export function dropboxAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url =
      `https://www.dropbox.com/oauth2/authorize` +
      `?client_id=${DROPBOX_APP_KEY}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT)}`;

    const w = 600, h = 700;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top  = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
    const popup = window.open(
      url, 'dropbox-auth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
      return;
    }

    const onMessage = (evt: MessageEvent) => {
      if (evt.origin !== window.location.origin) return;
      if (evt.data?.type === 'DROPBOX_TOKEN') {
        cleanup();
        resolve(evt.data.token as string);
      } else if (evt.data?.type === 'DROPBOX_ERROR') {
        cleanup();
        reject(new Error(evt.data.error || 'Dropbox auth failed'));
      }
    };

    // Detect if user closes the popup without completing
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Dropbox sign-in was cancelled.'));
      }
    }, 800);

    function cleanup() {
      clearInterval(pollClosed);
      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);
  });
}

/**
 * Lists files and sub-folders inside a Dropbox path.
 * path='' means the root. Only returns files with allowed extensions.
 */
export async function dropboxListFolder(
  token: string,
  path = '',
): Promise<DropboxEntry[]> {
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      recursive: false,
      include_media_info: true,
      limit: 300,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error_summary || err?.error?.path?.['.tag'] || `Dropbox API error (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const entries: DropboxEntry[] = (data.entries as any[]).filter(e =>
    e['.tag'] === 'folder' || DROPBOX_ALLOWED_EXT_REGEX.test(e.name)
  );

  // Sort: folders first, then files alphabetically
  return entries.sort((a, b) => {
    if (a['.tag'] !== b['.tag']) return a['.tag'] === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Fetches thumbnails for a batch of file paths.
 * Mutates the entries in-place by adding `thumbnailUrl`.
 */
export async function dropboxGetThumbnails(
  token: string,
  entries: DropboxEntry[],
): Promise<void> {
  const files = entries.filter(e => e['.tag'] === 'file');
  if (files.length === 0) return;

  const BATCH = 25; // Dropbox max per batch
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    try {
      const res = await fetch('https://content.dropboxapi.com/2/files/get_thumbnail_batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: batch.map(f => ({
            path: f.path_lower,
            format: { '.tag': 'jpeg' },
            size: { '.tag': 'w128h128' },
            mode: { '.tag': 'fitone_bestfit' },
          })),
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      (data.entries as any[]).forEach((result, idx) => {
        if (result['.tag'] === 'success' && result.thumbnail) {
          batch[idx].thumbnailUrl = `data:image/jpeg;base64,${result.thumbnail}`;
        }
      });
    } catch (_) {
      // Silently skip thumbnails that fail — file icons will be shown instead
    }
  }
}

/**
 * Downloads one Dropbox file by path, returns a browser File object.
 */
/** Extension → MIME fallback (Dropbox often returns application/octet-stream) */
const EXT_MIME: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  tiff: 'image/tiff',
  tif:  'image/tiff',
  bmp:  'image/bmp',
  heic: 'image/heic',
  heif: 'image/heic',
  webp: 'image/webp',
  psd:  'image/vnd.adobe.photoshop',
  pdf:  'application/pdf',
};

export async function dropboxDownloadFile(
  token: string,
  entry: DropboxEntry,
): Promise<File> {
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path: entry.path_lower }),
    },
  });
  if (!res.ok) throw new Error(`Could not download "${entry.name}" (${res.status})`);
  const blob = await res.blob();

  // Dropbox often returns application/octet-stream — derive the real MIME from the filename
  const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeType =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob.type
      : (EXT_MIME[ext] ?? 'application/octet-stream');

  return new File([blob], entry.name, { type: mimeType });
}
