'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { uploadUnderlag } from '@/lib/bokforing-underlag';

/**
 * Uppladdning direkt på startsidan.
 *
 * Samma sak som `/bokforing/ladda-upp` gör, men utan guiderna omkring — den
 * som redan vet vilken fil hen ska skicka ska slippa ett extra sidbyte. Går
 * genom `uploadUnderlag`, så underlaget hamnar på samma ställe oavsett väg.
 *
 * Ligger på den mörkblå rutan, därför ljusa ramar och vit text rakt igenom.
 */

const NAV_BG = '#173b57';
const ACCEPT = '.csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg';

export default function UnderlagDropZone() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    // FileList:en töms när inputen nollställs, så läs ut filerna direkt
    const list = Array.from(incoming);
    if (list.length === 0) return;
    setFiles(prev => {
      const existing = new Set(prev.map(fileKey));
      return [...prev, ...list.filter(f => !existing.has(fileKey(f)))];
    });
    setError(null);
  }

  async function uploadAll() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadUnderlag(files, setUploadingFile);
      setUploadedCount(files.length);
      setFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel vid uppladdningen. Försök igen.');
    } finally {
      setUploading(false);
      setUploadingFile('');
    }
  }

  // ── Klart ─────────────────────────────────────────────────────────────────

  if (uploadedCount > 0) {
    return (
      <div className="mt-6 rounded-2xl bg-white/10 border border-white/20 p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold">Tack för ditt underlag!</p>
        <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
          Vi har tagit emot {uploadedCount === 1 ? 'din fil' : `dina ${uploadedCount} filer`} och går igenom{' '}
          {uploadedCount === 1 ? 'den' : 'dem'} åt dig.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <Link
            href="/bokforing"
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-center transition-opacity hover:opacity-90"
            style={{ color: NAV_BG }}
          >
            Gå till bokföringen
          </Link>
          <button
            onClick={() => setUploadedCount(0)}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-white/25 hover:bg-white/10 transition-colors"
          >
            Ladda upp mer
          </button>
        </div>
      </div>
    );
  }

  // ── Uppladdning pågår ─────────────────────────────────────────────────────

  if (uploading) {
    return (
      <div className="mt-6 rounded-2xl bg-white/10 border border-white/20 p-6 flex items-center gap-4">
        <svg className="w-6 h-6 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <div className="min-w-0">
          <p className="font-bold text-sm">Laddar upp underlaget...</p>
          {uploadingFile && <p className="text-xs text-white/60 truncate mt-0.5">{uploadingFile}</p>}
        </div>
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────

  return (
    <div className="mt-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-colors duration-150 ${
          dragging ? 'border-white/60 bg-white/10' : 'border-white/25 hover:border-white/40'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={fileKey(f)} className="flex items-center gap-3 bg-white/10 rounded-xl px-3.5 py-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium truncate flex-1">{f.name}</span>
                <span className="text-xs text-white/50 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, n) => n !== i)); }}
                  aria-label={`Ta bort ${f.name}`}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-colors flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <p className="text-xs text-white/50 text-center pt-1">Dra hit fler filer eller klicka för att lägga till</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Dra och släpp dina filer här</p>
              <p className="text-xs text-white/60 mt-0.5">eller klicka för att välja · CSV, XLSX, XLS, PDF, PNG, JPG</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-200 mt-3">{error}</p>}

      <button
        onClick={uploadAll}
        disabled={files.length === 0}
        className="w-full py-3.5 mt-3 text-sm font-bold rounded-2xl bg-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: NAV_BG }}
      >
        Skicka in underlaget
      </button>
    </div>
  );
}
