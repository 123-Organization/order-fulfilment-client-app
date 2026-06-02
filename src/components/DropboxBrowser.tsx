import React, { useCallback, useEffect, useState } from 'react';
import {
  DropboxEntry,
  dropboxListFolder,
  dropboxGetThumbnails,
  dropboxDownloadFile,
} from '../services/cloudImportService';

/* ── brand ───────────────────────────────────────────────────────────────── */
const DBX_BLUE      = '#0061FE';
const DBX_BLUE_DARK = '#0050d8';

/* ── tiny icons ──────────────────────────────────────────────────────────── */
const FolderIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="#fbbf24">
    <path d="M10 4H2a2 2 0 00-2 2v12a2 2 0 002 2h20a2 2 0 002-2V8a2 2 0 00-2-2H12l-2-2z" />
  </svg>
);

const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#d1d5db" />
    <path d="M14 2v6h6" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
  </svg>
);

const DropboxLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
    <path d="M6 2L12 6.5 6 11 0 6.5 6 2zm12 0l6 4.5-6 4.5-6-4.5L18 2zM6 13l6 4.5-6 4.5-6-4.5L6 13zm12 0l6 4.5-6 4.5-6-4.5 6-4.5zM12 12.272L6.273 8 12 3.728 17.727 8 12 12.272z" />
  </svg>
);

/* ── types ───────────────────────────────────────────────────────────────── */
interface BreadcrumbItem { path: string; name: string; }

interface Props {
  token: string;
  onFiles: (files: File[]) => void;
  onClose: () => void;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtSize = (bytes?: number) => {
  if (!bytes) return '';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ── component ───────────────────────────────────────────────────────────── */
const DropboxBrowser: React.FC<Props> = ({ token, onFiles, onClose }) => {
  const [entries,   setEntries]   = useState<DropboxEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [path,      setPath]      = useState<BreadcrumbItem[]>([{ path: '', name: 'Dropbox' }]);
  const [importing, setImporting] = useState(false);

  const currentFolder = path[path.length - 1];

  /* ── load folder ──────────────────────────────────────────────────────── */
  const loadFolder = useCallback(async (folderPath: string) => {
    setLoading(true); setError(null); setSelected(new Set());
    try {
      const items = await dropboxListFolder(token, folderPath);
      setEntries(items);
      // Fire-and-forget thumbnail loading so the grid shows immediately
      dropboxGetThumbnails(token, items).then(() => setEntries([...items]));
    } catch (e: any) {
      setError(e?.message || 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFolder(currentFolder.path); }, [currentFolder.path, loadFolder]);

  /* ── navigation ───────────────────────────────────────────────────────── */
  const handleClick = (entry: DropboxEntry) => {
    if (entry['.tag'] === 'folder') {
      setPath(p => [...p, { path: entry.path_lower, name: entry.name }]);
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
      return next;
    });
  };

  /* ── import ───────────────────────────────────────────────────────────── */
  const handleImport = async () => {
    setImporting(true);
    try {
      const toGet = entries.filter(e => selected.has(e.id));
      const result: File[] = [];
      for (const e of toGet) result.push(await dropboxDownloadFile(token, e));
      onFiles(result);
    } catch (e: any) {
      setError(e?.message || 'Import failed');
      setImporting(false);
    }
  };

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ border: `1.5px solid rgba(0,97,254,.2)`, borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg,${DBX_BLUE} 0%,${DBX_BLUE_DARK} 100%)`, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <DropboxLogo />
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
            {path.map((item, i) => (
              <React.Fragment key={item.path + i}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>/</span>}
                <button
                  onClick={() => setPath(p => p.slice(0, i + 1))}
                  disabled={i === path.length - 1}
                  style={{
                    background: 'none', border: 'none', padding: '0 2px',
                    fontSize: 12, fontWeight: i === path.length - 1 ? 700 : 500,
                    color: i === path.length - 1 ? '#fff' : 'rgba(255,255,255,.72)',
                    cursor: i === path.length - 1 ? 'default' : 'pointer',
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >{item.name}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ flexShrink: 0, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
        >×</button>
      </div>

      {/* ── Body ── */}
      <div className="upl-scroll" style={{ height: 288, overflowY: 'auto', padding: 12, background: '#f8fafc' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${DBX_BLUE}`, borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>⚠ {error}</span>
            <button
              onClick={() => loadFolder(currentFolder.path)}
              style={{ fontSize: 12, color: DBX_BLUE, border: `1px solid ${DBX_BLUE}`, borderRadius: 6, padding: '4px 14px', background: '#fff', cursor: 'pointer' }}
            >Retry</button>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>No supported files in this folder</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 8 }}>
            {entries.map(entry => {
              const isFolder   = entry['.tag'] === 'folder';
              const isSelected = selected.has(entry.id);
              return (
                <div
                  key={entry.id}
                  onClick={() => handleClick(entry)}
                  title={isFolder ? entry.name : `${entry.name}${entry.size ? ' · ' + fmtSize(entry.size) : ''}`}
                  style={{
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${DBX_BLUE}` : '2px solid transparent',
                    background: isSelected ? 'rgba(0,97,254,.05)' : '#fff',
                    padding: 6, cursor: 'pointer', textAlign: 'center', position: 'relative',
                    boxShadow: isSelected ? `0 0 0 3px rgba(0,97,254,.14)` : '0 1px 4px rgba(0,0,0,.07)',
                    transition: 'all .15s ease',
                  }}
                >
                  {/* Thumbnail / icon */}
                  <div style={{ width: '100%', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 7, background: isFolder ? '#fffbeb' : '#f0f2f5', marginBottom: 5 }}>
                    {isFolder
                      ? <FolderIcon />
                      : entry.thumbnailUrl
                        ? <img src={entry.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} />
                        : <FileIcon />
                    }
                  </div>

                  {/* Name */}
                  <p style={{ margin: 0, fontSize: 10.5, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </p>

                  {/* Selection badge */}
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg,${DBX_BLUE},${DBX_BLUE_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
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
            ? <b style={{ color: DBX_BLUE }}>{selected.size} file{selected.size > 1 ? 's' : ''} selected</b>
            : 'Click images to select · click folders to open'}
        </span>
        <button
          onClick={handleImport}
          disabled={selected.size === 0 || importing}
          style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 700,
            cursor: selected.size > 0 && !importing ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            ...(selected.size > 0 && !importing
              ? { background: `linear-gradient(135deg,${DBX_BLUE},${DBX_BLUE_DARK})`, color: '#fff', boxShadow: `0 3px 12px rgba(0,97,254,.35)` }
              : { background: '#e9ecf0', color: '#b0b8c4' }),
          }}
        >
          {importing
            ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} /> Importing…</>
            : <>Import{selected.size > 0 ? ` ${selected.size}` : ''} file{selected.size !== 1 ? 's' : ''}</>
          }
        </button>
      </div>
    </div>
  );
};

export default DropboxBrowser;
