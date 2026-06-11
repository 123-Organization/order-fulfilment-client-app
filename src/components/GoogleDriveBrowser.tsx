import React, { useCallback, useEffect, useState } from 'react';
import { DriveFile, googleDownloadFile, googleListFiles } from '../services/cloudImportService';

const BRAND      = '#07a3c3';
const BRAND_DARK = '#058fa8';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

interface BreadcrumbItem { id: string; name: string; }

interface Props {
  token: string;
  onFiles: (files: File[]) => void;
  onClose: () => void;
}

/* ── tiny icons ──────────────────────────────────────────────────────────── */
const FolderIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="#fbbf24">
    <path d="M10 4H2a2 2 0 00-2 2v12a2 2 0 002 2h20a2 2 0 002-2V8a2 2 0 00-2-2H12l-2-2z"/>
  </svg>
);
const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#d1d5db"/>
    <path d="M14 2v6h6" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
  </svg>
);
const GDriveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 87.3 78" fill="none">
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9 9 0 000 53h27.5z" fill="#00ac47"/>
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5a9 9 0 000-9L59.8 1.2C59 .4 57.9 0 56.7 0H30.6l-.1.2 13.15 22.8z" fill="#ea4335"/>
    <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.5 1.2z" fill="#00832d"/>
    <path d="M59.8 53H27.5L13.75 76.8c1.4.8 2.95 1.2 4.5 1.2h50.8c1.55 0 3.1-.4 4.5-1.2z" fill="#2684fc"/>
    <path d="M73.4 26.5l-12.7-22C59.85 3.1 58.7 2 57.35 1.2L43.6 25 59.75 53h26.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

/* ── component ───────────────────────────────────────────────────────────── */
const GoogleDriveBrowser: React.FC<Props> = ({ token, onFiles, onClose }) => {
  const [files,     setFiles]     = useState<DriveFile[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [path,      setPath]      = useState<BreadcrumbItem[]>([{ id: 'root', name: 'My Drive' }]);
  const [importing, setImporting] = useState(false);

  const currentFolder = path[path.length - 1];

  const loadFolder = useCallback(async (folderId: string) => {
    setLoading(true); setError(null); setSelected(new Set());
    try {
      const data = await googleListFiles(token, folderId);
      setFiles(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFolder(currentFolder.id); }, [currentFolder.id, loadFolder]);

  const handleClick = (file: DriveFile) => {
    if (file.mimeType === FOLDER_MIME) {
      setPath(p => [...p, { id: file.id, name: file.name }]);
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(file.id) ? next.delete(file.id) : next.add(file.id);
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const toGet = files.filter(f => selected.has(f.id));
      const result: File[] = [];
      for (const f of toGet) result.push(await googleDownloadFile(token, f));
      onFiles(result);
    } catch (e: any) {
      setError(e?.message || 'Import failed');
      setImporting(false);
    }
  };

  return (
    <div style={{ border: `1.5px solid rgba(7,163,195,.25)`, borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#4285F4 0%,#0F9D58 100%)', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <GDriveIcon />
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
            {path.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>/</span>}
                <button
                  onClick={() => setPath(p => p.slice(0, i + 1))}
                  disabled={i === path.length - 1}
                  style={{ background: 'none', border: 'none', padding: '0 2px', fontSize: 12, fontWeight: i === path.length - 1 ? 700 : 500, color: i === path.length - 1 ? '#fff' : 'rgba(255,255,255,.72)', cursor: i === path.length - 1 ? 'default' : 'pointer', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >{item.name}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ flexShrink: 0, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
      </div>

      {/* ── Body ── */}
      <div className="upl-scroll" style={{ height: 288, overflowY: 'auto', padding: 12, background: '#f8fafc' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${BRAND}`, borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>⚠ {error}</span>
            <button onClick={() => loadFolder(currentFolder.id)} style={{ fontSize: 12, color: BRAND, border: `1px solid ${BRAND}`, borderRadius: 6, padding: '4px 14px', background: '#fff', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : files.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>No supported files in this folder</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 8 }}>
            {files.map(file => {
              const isFolder   = file.mimeType === FOLDER_MIME;
              const isSelected = selected.has(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => handleClick(file)}
                  title={file.name}
                  style={{ borderRadius: 10, border: isSelected ? `2px solid ${BRAND}` : '2px solid transparent', background: isSelected ? 'rgba(7,163,195,.05)' : '#fff', padding: 6, cursor: 'pointer', textAlign: 'center', position: 'relative', boxShadow: isSelected ? `0 0 0 3px rgba(7,163,195,.14)` : '0 1px 4px rgba(0,0,0,.07)', transition: 'all .15s ease' }}
                >
                  <div style={{ width: '100%', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 7, background: isFolder ? '#fffbeb' : '#f0f2f5', marginBottom: 5 }}>
                    {isFolder ? <FolderIcon /> : file.thumbnailLink
                      ? <img src={file.thumbnailLink} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <FileIcon />
                    }
                  </div>
                  <p style={{ margin: 0, fontSize: 10.5, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${BRAND_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {selected.size > 0
            ? <b style={{ color: BRAND }}>{selected.size} file{selected.size > 1 ? 's' : ''} selected</b>
            : 'Click images to select · click folders to open'}
        </span>
        <button
          onClick={handleImport}
          disabled={selected.size === 0 || importing}
          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: selected.size > 0 && !importing ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', ...(selected.size > 0 && !importing ? { background: `linear-gradient(135deg,${BRAND},${BRAND_DARK})`, color: '#fff', boxShadow: `0 3px 12px rgba(7,163,195,.35)` } : { background: '#e9ecf0', color: '#b0b8c4' }) }}
        >
          {importing
            ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} /> Importing…</>
            : <>Import{selected.size > 0 ? ` ${selected.size}` : ''} file{selected.size !== 1 ? 's' : ''}</>}
        </button>
      </div>
    </div>
  );
};

export default GoogleDriveBrowser;
