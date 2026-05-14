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
