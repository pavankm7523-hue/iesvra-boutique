import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Film } from "lucide-react";
import type { ProductMedia } from "@/lib/products";

export function MediaUploader({ 
  value = [], 
  onChange 
}: { 
  value?: ProductMedia[]; 
  onChange: (media: ProductMedia[]) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newMedia: ProductMedia[] = [];
    const promises: Promise<void>[] = [];

    Array.from(files).forEach((file) => {
      // Check if it's image or video
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Only images and videos are allowed.");
        return;
      }

      const type = file.type.startsWith("video/") ? "video" : "image";
      
      // Limit file size to 1.5MB to avoid local storage explosion
      if (file.size > 1024 * 1024 * 1.5) { 
        alert(`File ${file.name} is too large. Max size is 1.5MB to prevent local storage quota issues.`);
        return;
      }

      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            newMedia.push({
              id: "media_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              type,
              url: result
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      if (newMedia.length > 0) {
        onChange([...value, ...newMedia]);
      }
    });
  }, [value, onChange]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Handle Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        processFiles(e.clipboardData.files);
      }
    };
    // Bind to window to capture paste anywhere while the form is active
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFiles]);

  const removeMedia = (id: string) => {
    onChange(value.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? "border-gold bg-gold/5" : "border-border/60 hover:border-gold/50 bg-secondary/5"
        }`}
      >
        <Upload className={`h-10 w-10 mb-3 ${isDragging ? "text-gold" : "text-navy-deep/40"}`} />
        <p className="text-sm font-semibold text-navy-deep text-center">
          Click, drag & drop, or paste to upload
        </p>
        <p className="text-xs text-navy-deep/60 mt-1 text-center">
          Supports JPG, PNG, WEBP, MP4 (Max 1.5MB per file for local demo)
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && processFiles(e.target.files)} 
          className="hidden" 
          multiple 
          accept="image/*,video/*"
        />
      </div>

      {/* Gallery Preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {value.map((media, index) => (
            <div key={media.id} className="relative group aspect-square rounded-lg border border-border/50 overflow-hidden bg-[#f4f2ef]">
              {media.type === "image" ? (
                <img src={media.url} className="w-full h-full object-contain mix-blend-multiply p-1" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" muted loop autoPlay />
              )}
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-navy-deep/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                    className="p-1 bg-white/20 hover:bg-red-500 rounded text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-1 items-center text-white/90">
                  {media.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  <span className="text-[10px] font-medium tracking-wide uppercase">
                    {index === 0 ? "Primary" : media.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
