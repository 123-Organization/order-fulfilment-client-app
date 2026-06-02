import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { googleAuth, openDropboxPicker, dropboxAuth } from '../services/cloudImportService';
import GoogleDriveBrowser from './GoogleDriveBrowser';
import DropboxBrowser from './DropboxBrowser';
import {
  UPLOAD_CONFIG,
  initiateMultipartUpload,
  completeMultipartUpload,
  uploadAllParts,
  pollUntilIndexed,
  generateUUID,
  validateFile,
} from '../services/uploadService';
import { useAppSelector } from "../store";

/* ─── brand colours ─────────────────────────────────────────────────────── */
const BRAND = '#07a3c3';
const BRAND_DARK = '#058fa8';

/* ─── cookie helper ─────────────────────────────────────────────────────── */
const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  return '';
};

/* ─── types ─────────────────────────────────────────────────────────────── */
export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'complete' | 'failed';

export interface UploadTask {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  localPreview: string;
  proofUrl?: string;
  errorMsg?: string;
  abortController: AbortController;
}

/* ─── props ─────────────────────────────────────────────────────────────── */
interface MultiUploadModalProps {
  visible: boolean;
  library: 'temporary' | 'inventory';
  onClose: () => void;
  onUploadComplete: () => void;
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/* ─── status icon ───────────────────────────────────────────────────────── */
const StatusIcon: React.FC<{ status: UploadStatus; progress: number }> = ({ status, progress }) => {
  if (status === 'complete') return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${BRAND},${BRAND_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </div>
  );
  if (status === 'failed') return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </div>
  );
  if (status === 'processing') return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${BRAND}`, borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite', flexShrink: 0 }} />
  );
  // uploading / queued – arc ring
  const r = 11, circ = 2 * Math.PI * r, dash = (progress / 100) * circ;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={BRAND} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .3s' }} />
    </svg>
  );
};

/* ─── component ─────────────────────────────────────────────────────────── */
const MultiUploadModal: React.FC<MultiUploadModalProps> = ({
  visible,
  library,
  onClose,
  onUploadComplete,
}) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const [cloudLoading,    setCloudLoading]    = useState<'dropbox' | 'google' | null>(null);
  const [cloudError,      setCloudError]      = useState<string | null>(null);
  const [googleToken,     setGoogleToken]     = useState<string | null>(null);
  const [showGooglePanel, setShowGooglePanel] = useState(false);
  const [dropboxToken,    setDropboxToken]    = useState<string | null>(null);
  const [showDropboxPanel,setShowDropboxPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tasksRef = useRef<UploadTask[]>([]);
  const companyInfo = useAppSelector((state) => state.company.company_info.data);
  const accountId = companyInfo.account_id;

  console.log("comp", companyInfo)

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  /* clear on open */
  useEffect(() => {
    if (visible) {
      tasksRef.current.forEach(t => URL.revokeObjectURL(t.localPreview));
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /* cleanup on unmount */
  useEffect(() => () => {
    tasksRef.current.forEach(t => URL.revokeObjectURL(t.localPreview));
  }, []);

  /* ── derived ──────────────────────────────────────────────────────────── */
  const hasActive = tasks.some(t => t.status === 'uploading' || t.status === 'processing');
  const allDone = tasks.length > 0 && tasks.every(t => t.status === 'complete' || t.status === 'failed');
  const allSuccess = tasks.length > 0 && tasks.every(t => t.status === 'complete');
  const anySuccess = tasks.some(t => t.status === 'complete');
  const overallPct = tasks.length === 0
    ? 0
    : Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);

  /* auto-close when all succeed */
  useEffect(() => {
    if (allSuccess && visible) {
      const t = setTimeout(() => { onUploadComplete(); onClose(); }, 1400);
      return () => clearTimeout(t);
    }
  }, [allSuccess, visible, onUploadComplete, onClose]);

  /* ── task helpers ──────────────────────────────────────────────────────── */
  const updateTask = useCallback(
    (id: string, patch: Partial<UploadTask>) =>
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t))),
    []
  );

  /* ── core upload logic ────────────────────────────────────────────────── */
  const runUpload = useCallback(async (task: UploadTask) => {
    const { id, file, fileName, abortController: { signal } } = task;
    const accountKey = getCookie('AccountGUID') || '';
    const sessionId = getCookie('Session') || '';
    const imageGuid = generateUUID();
    const s3Key = `${imageGuid}/${fileName}`;

    try {
      updateTask(id, { status: 'uploading', progress: 0 });

      /* 1. initiate multipart upload → get uploadId */
      const uploadId = await initiateMultipartUpload(
        s3Key,
        file.type || 'application/octet-stream',
        {
          library: library,
          sessionid: sessionId,
          imageguid: imageGuid,
          accountguid: accountKey,
          accountid: accountId,
        }
      );

      /* 2. upload all chunks directly to S3 (3 workers) */
      const parts = await uploadAllParts(
        file,
        s3Key,
        uploadId,
        signal,
        (done, total) => updateTask(id, { progress: Math.round((done / total) * 88) })
      );

      /* 3. tell S3 to stitch the file */
      await completeMultipartUpload(s3Key, uploadId, parts);
      updateTask(id, { status: 'processing', progress: 92 });

      /* 4. poll FinerWorks until image appears in the library */
      const thumbUrl = await pollUntilIndexed(imageGuid, library, accountKey, sessionId, signal);
      updateTask(id, { status: 'complete', progress: 100, proofUrl: thumbUrl });

    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setTasks(prev => prev.filter(t => t.id !== id));
      } else {
        updateTask(id, { status: 'failed', errorMsg: err?.message ?? 'Upload failed' });
      }
    }
  }, [library, updateTask]);

  /* ── file selection ──────────────────────────────────────────────────── */
  const handleFiles = useCallback((rawFiles: File[]) => {
    const current = tasksRef.current;
    const newTasks: UploadTask[] = [];

    for (const file of rawFiles) {
      const err = validateFile(file, current.length + newTasks.length);
      if (err) { console.warn('[Upload]', err); continue; }

      const task: UploadTask = {
        id: generateUUID(),
        file,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'queued',
        localPreview: URL.createObjectURL(file),
        abortController: new AbortController(),
      };
      newTasks.push(task);
    }

    if (newTasks.length === 0) return;
    setTasks(prev => [...prev, ...newTasks]);
    newTasks.forEach(t => runUpload(t));
  }, [runUpload]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  /* ── cloud import handlers ───────────────────────────────────────────────── */
  const handleDropboxImport = async () => {
    setCloudLoading('dropbox');
    setCloudError(null);
    setShowGooglePanel(false);
    try {
      const token = dropboxToken || await dropboxAuth();
      setDropboxToken(token);
      setShowDropboxPanel(true);
    } catch (err: any) {
      setCloudError(err?.message || 'Dropbox sign-in failed');
    } finally {
      setCloudLoading(null);
    }
  };

  const handleDropboxFiles = (files: File[]) => {
    if (files.length > 0) handleFiles(files);
    setShowDropboxPanel(false);
  };

  const handleGoogleDriveImport = async () => {
    setCloudLoading('google');
    setCloudError(null);
    setShowDropboxPanel(false);
    try {
      const token = googleToken || await googleAuth();
      setGoogleToken(token);
      setShowGooglePanel(true);
    } catch (err: any) {
      setCloudError(err?.message || 'Google Drive sign-in failed');
    } finally {
      setCloudLoading(null);
    }
  };

  const handleGoogleFiles = (files: File[]) => {
    if (files.length > 0) handleFiles(files);
    setShowGooglePanel(false);
  };

  /* ── drag & drop ─────────────────────────────────────────────────────── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  /* ── remove / cancel ─────────────────────────────────────────────────── */
  const removeTask = (task: UploadTask) => {
    if (task.status === 'uploading' || task.status === 'processing') {
      task.abortController.abort();
    } else {
      URL.revokeObjectURL(task.localPreview);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  /* ── close ───────────────────────────────────────────────────────────── */
  const handleClose = () => {
    if (hasActive) return;
    tasks.forEach(t => URL.revokeObjectURL(t.localPreview));
    setTasks([]);
    if (anySuccess) onUploadComplete();
    onClose();
  };

  if (!visible) return null;

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,16,36,.72)', backdropFilter: 'blur(10px)', padding: 20, animation: 'upl-fadeIn .18s ease' }}
      onClick={e => { if (e.target === e.currentTarget && !hasActive) handleClose(); }}
    >
      <style>{`
        @keyframes upl-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes upl-slideUp { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes upl-spin    { to{transform:rotate(360deg)} }
        @keyframes upl-pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
        .upl-scroll::-webkit-scrollbar       { width:4px }
        .upl-scroll::-webkit-scrollbar-track { background:transparent }
        .upl-scroll::-webkit-scrollbar-thumb { background:#d1d5db;border-radius:4px }
        .upl-card  { transition:box-shadow .2s,transform .2s; }
        .upl-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.09)!important; }
        .upl-rm    { opacity:0; transition:opacity .15s; }
        .upl-card:hover .upl-rm { opacity:1; }
      `}</style>

      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.28)', animation: 'upl-slideUp .22s cubic-bezier(.25,.8,.25,1)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div style={{ background: `linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%)`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.18)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>Upload Images</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 }}>
                {library === 'temporary' ? 'Temporary' : 'Inventory'} library · up to {UPLOAD_CONFIG.MAX_UPLOADS} files · {UPLOAD_CONFIG.MAX_FILE_SIZE_MB} MB max
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={hasActive}
            style={{ background: hasActive ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.16)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: hasActive ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, opacity: hasActive ? 0.5 : 1 }}
            onMouseEnter={e => { if (!hasActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = hasActive ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.16)'; }}
          >×</button>
        </div>

        {/* ── Progress bar (overall) ── */}
        {tasks.length > 0 && (
          <div style={{ height: 3, background: '#e5e7eb', flexShrink: 0 }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg,${BRAND},${BRAND_DARK})`, width: `${overallPct}%`, transition: 'width .4s ease', borderRadius: '0 2px 2px 0' }} />
          </div>
        )}

        {/* ── Body ── */}
        <div className="upl-scroll" style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? BRAND : '#d1d5db'}`,
              borderRadius: 16,
              background: dragging ? `rgba(7,163,195,.05)` : '#fff',
              padding: '28px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer', userSelect: 'none', flexShrink: 0,
              transition: 'border-color .2s, background .2s',
            }}
          >
            <div style={{ width: 52, height: 52, background: `rgba(7,163,195,.09)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" fill="none" stroke={BRAND} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e2a3b' }}>
                Drag & drop files here, or <span style={{ color: BRAND }}>click to browse</span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {UPLOAD_CONFIG.ALLOWED_EXT_LABELS} · max {UPLOAD_CONFIG.MAX_FILE_SIZE_MB} MB per file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={onInputChange}
            />
          </div>

          {/* ── Cloud import ── */}
          {showDropboxPanel && dropboxToken ? (
            <DropboxBrowser
              token={dropboxToken}
              onFiles={handleDropboxFiles}
              onClose={() => setShowDropboxPanel(false)}
            />
          ) : showGooglePanel && googleToken ? (
            <GoogleDriveBrowser
              token={googleToken}
              onFiles={handleGoogleFiles}
              onClose={() => setShowGooglePanel(false)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>or import from cloud</span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Dropbox */}
                <button
                  onClick={handleDropboxImport}
                  disabled={!!cloudLoading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', background: cloudLoading === 'dropbox' ? '#f0f6ff' : '#fff', color: '#0061FE', fontWeight: 600, fontSize: 13, cursor: cloudLoading ? 'not-allowed' : 'pointer', opacity: cloudLoading && cloudLoading !== 'dropbox' ? 0.5 : 1, transition: 'all .18s ease' }}
                  onMouseEnter={e => { if (!cloudLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#0061FE'; }}
                  onMouseLeave={e => { if (!cloudLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; }}
                >
                  {cloudLoading === 'dropbox'
                    ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #0061FE', borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="#0061FE"><path d="M6 2L12 6.5 6 11 0 6.5 6 2zm12 0l6 4.5-6 4.5-6-4.5L18 2zM6 13l6 4.5-6 4.5-6-4.5L6 13zm12 0l6 4.5-6 4.5-6-4.5 6-4.5zM12 12.272L6.273 8 12 3.728 17.727 8 12 12.272z"/></svg>}
                  Dropbox
                </button>

                {/* Google Drive */}
                <button
                  onClick={handleGoogleDriveImport}
                  disabled={!!cloudLoading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', background: cloudLoading === 'google' ? '#fff8f6' : '#fff', color: '#4285F4', fontWeight: 600, fontSize: 13, cursor: cloudLoading ? 'not-allowed' : 'pointer', opacity: cloudLoading && cloudLoading !== 'google' ? 0.5 : 1, transition: 'all .18s ease' }}
                  onMouseEnter={e => { if (!cloudLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#4285F4'; }}
                  onMouseLeave={e => { if (!cloudLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; }}
                >
                  {cloudLoading === 'google'
                    ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #4285F4', borderTopColor: 'transparent', animation: 'upl-spin 0.8s linear infinite' }} />
                    : <svg width="18" height="18" viewBox="0 0 87.3 78" fill="none"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9 9 0 000 53h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5a9 9 0 000-9L59.8 1.2C59 .4 57.9 0 56.7 0H30.6l-.1.2 13.15 22.8z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.5 1.2z" fill="#00832d"/><path d="M59.8 53H27.5L13.75 76.8c1.4.8 2.95 1.2 4.5 1.2h50.8c1.55 0 3.1-.4 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.5l-12.7-22C59.85 3.1 58.7 2 57.35 1.2L43.6 25 59.75 53h26.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>}
                  Google Drive
                </button>
              </div>

              {cloudError && (
                <p style={{ margin: 0, fontSize: 12, color: '#ef4444', textAlign: 'center', padding: '4px 8px', background: '#fef2f2', borderRadius: 8 }}>
                  ⚠ {cloudError}
                </p>
              )}
            </div>
          )}

          {/* Task cards */}
          {tasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="upl-card"
                  style={{
                    background: '#fff', borderRadius: 14, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,.06)', position: 'relative',
                    border: task.status === 'complete'
                      ? `1.5px solid rgba(7,163,195,.3)`
                      : task.status === 'failed'
                        ? '1.5px solid #fca5a5'
                        : '1.5px solid transparent',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0f2f5', border: '1.5px solid #e5e7eb' }}>
                    <img
                      src={task.proofUrl || task.localPreview}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e2a3b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.fileName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtSize(task.fileSize)}</span>
                      {task.status === 'uploading' && <span style={{ fontSize: 11, color: BRAND, fontWeight: 600 }}>Uploading {task.progress}%</span>}
                      {task.status === 'processing' && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, animation: 'upl-pulse 1.4s ease infinite' }}>Processing…</span>}
                      {task.status === 'complete' && <span style={{ fontSize: 11, color: BRAND, fontWeight: 600 }}>Complete ✓</span>}
                      {task.status === 'failed' && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{task.errorMsg || 'Failed'}</span>}
                      {task.status === 'queued' && <span style={{ fontSize: 11, color: '#9ca3af' }}>Queued…</span>}
                    </div>
                    {(task.status === 'uploading' || task.status === 'processing') && (
                      <div style={{ height: 3, background: '#e5e7eb', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg,${BRAND},${BRAND_DARK})`, width: `${task.progress}%`, transition: 'width .3s ease' }} />
                      </div>
                    )}
                  </div>

                  <StatusIcon status={task.status} progress={task.progress} />

                  {/* Remove button */}
                  <button
                    className="upl-rm"
                    onClick={() => removeTask(task)}
                    title={task.status === 'uploading' ? 'Cancel upload' : 'Remove'}
                    style={{ position: 'absolute', top: 8, right: 8, background: '#f3f4f6', border: 'none', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14, fontWeight: 700, lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, margin: 0 }}>
              No files selected yet — click the drop zone above to add images.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 24px', background: '#fff', borderTop: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
            {tasks.length > 0
              ? <><b style={{ color: '#374151' }}>{tasks.filter(t => t.status === 'complete').length}/{tasks.length}</b> uploaded{hasActive && <> · <span style={{ color: BRAND }}>in progress…</span></>}</>
              : 'Select files to begin'}
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            {allDone ? (
              <button
                onClick={handleClose}
                style={{ padding: '9px 26px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%)`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 16px rgba(7,163,195,.35)` }}
              >
                Finish &amp; Refresh
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            ) : (
              <button
                onClick={handleClose}
                disabled={hasActive}
                style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e0e4ea', background: '#fff', color: hasActive ? '#c0c6d0' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: hasActive ? 'not-allowed' : 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => { if (!hasActive) (e.currentTarget as HTMLButtonElement).style.background = '#f5f7fa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
              >
                {hasActive ? 'Uploading…' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiUploadModal;
