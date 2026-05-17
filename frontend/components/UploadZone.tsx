"use client";

import { useState, useRef } from "react";

interface Props {
  onUploadSuccess: (noticeId: string, summary: any) => void;
  userEmail: string;
}

export default function UploadZone({ onUploadSuccess, userEmail }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // ── allow images AND PDFs ──
    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setError("Please upload an image (JPG, PNG) or a PDF file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file",  file);
      formData.append("email", userEmail);

      const response = await fetch("https://sushanSht-nepali-notice-reader.hf.space/upload", {
        method: "POST",
        body:   formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      onUploadSuccess(data.notice_id, data.summary);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }
      `}
    >
      {/* ── accept images + PDF ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">
            Reading notice... this may take a moment
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">📄</div>
          <p className="text-lg font-semibold text-gray-700">
            Upload Government Notice
          </p>
          <p className="text-sm text-gray-400">
            Drag & drop or click to select a file
          </p>
          {/* ── updated hint text ── */}
          <p className="text-xs text-gray-400">
            Supports JPG, PNG, PDF — Nepali notices only
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}