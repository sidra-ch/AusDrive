"use client";

import { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";

type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
};

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Upload failed";
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText) as { error?: string };
          message = errorData.error || message;
        } catch {
          if (errorText.trim()) {
            message = errorText;
          }
        }
        throw new Error(message);
      }

      const data = await response.json();
      setPreview(data.url);
      onChange(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Failed to upload image";
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    setPreview("");
    setError("");
    if (onRemove) onRemove();
    onChange("");
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-white/8 dark:border-white/8 border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="border-2 border-dashed border-white/20 dark:border-white/20 border-gray-300 rounded-xl p-8 text-center hover:border-cyan-500/40 transition">
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
                <p className="text-white dark:text-white text-gray-900 font-medium">Uploading...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground dark:text-muted-foreground text-gray-400 mx-auto mb-3" />
                <p className="text-white dark:text-white text-gray-900 font-medium">
                  Click to upload car image
                </p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
