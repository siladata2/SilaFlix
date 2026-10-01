'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Check, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  folder?: string;
  aspectHint?: string;
}

export function ImageInput({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  folder = 'images',
  aspectHint,
}: ImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-ink-dim font-medium">
          {label} {aspectHint && <span className="text-ink-faint">({aspectHint})</span>}
        </label>
        <div className="flex items-center bg-bg border border-line rounded-md p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'url' ? 'bg-gold text-[#171412] font-semibold' : 'text-ink-faint hover:text-ink'
            }`}
          >
            <LinkIcon size={12} /> Image URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'upload' ? 'bg-gold text-[#171412] font-semibold' : 'text-ink-faint hover:text-ink'
            }`}
          >
            <Upload size={12} /> Upload Image
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-line hover:border-gold/50 rounded-lg p-3 text-center cursor-pointer transition-colors bg-bg/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-ink-dim py-1">
                <Loader2 size={16} className="animate-spin text-gold" /> Uploading image to SilaFlix...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-ink-dim py-1">
                <ImageIcon size={16} className="text-gold" />
                <span>Click to select an image from your device</span>
              </div>
            )}
          </div>
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        </div>
      )}

      {value && (
        <div className="flex items-center gap-3 bg-bg/80 border border-line rounded-lg p-2 mt-1">
          <img
            src={value}
            alt="Preview"
            className="w-12 h-12 object-cover rounded bg-black/40 border border-line"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink font-mono truncate">{value}</p>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <Check size={10} /> Image source set
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-ink-faint hover:text-red-400 px-2 py-1"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
