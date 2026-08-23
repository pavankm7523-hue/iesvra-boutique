import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductMedia } from "@/lib/products";

// Compress large image files to prevent localStorage quota exhaustion
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === "image/png" ? "image/png" : "image/jpeg";
        const quality = 0.88;
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function MediaUploader({ 
  value = [], 
  onChange 
}: { 
  value?: ProductMedia[]; 
  onChange: (media: ProductMedia[]) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    console.log("[MediaUploader] processFiles invoked with count:", files.length);
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newMedia: ProductMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[MediaUploader] Processing file #${i + 1}:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });

      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        console.warn(`[MediaUploader] Rejected non-media file: ${file.name}`);
        toast.error(`File "${file.name}" is not a supported image or video.`);
        continue;
      }

      const type = file.type.startsWith("video/") ? "video" : "image";

      try {
        let mediaUrl: string;
        if (type === "image") {
          const compressedDataUrl = await compressImageFile(file);
          console.log(`[MediaUploader] Image compressed: ${file.name}, uploading to storage...`);
          
          // Upload to Supabase Storage
          try {
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileData: compressedDataUrl,
                fileName: file.name,
                contentType: file.type || "image/jpeg"
              })
            });
            if (uploadRes.ok) {
              const resData = await uploadRes.json();
              if (resData.url) {
                mediaUrl = resData.url;
                console.log(`[MediaUploader] Uploaded to cloud storage: ${mediaUrl}`);
              } else {
                mediaUrl = compressedDataUrl;
              }
            } else {
              console.warn("[MediaUploader] Upload API returned non-200, fallback to local data URL");
              mediaUrl = compressedDataUrl;
            }
          } catch (uploadErr) {
            console.warn("[MediaUploader] Upload API fetch failed, fallback to local data URL:", uploadErr);
            mediaUrl = compressedDataUrl;
          }
        } else {
          // Video: limit to 10MB
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`Video "${file.name}" is too large (max 10MB for video upload).`);
            continue;
          }
          const rawData = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(file);
          });

          try {
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileData: rawData,
                fileName: file.name,
                contentType: file.type || "video/mp4"
              })
            });
            if (uploadRes.ok) {
              const resData = await uploadRes.json();
              mediaUrl = resData.url || rawData;
            } else {
              mediaUrl = rawData;
            }
          } catch {
            mediaUrl = rawData;
          }
        }

        newMedia.push({
          id: "media_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          type,
          url: mediaUrl
        });
      } catch (err) {
        console.error(`[MediaUploader] Error reading file "${file.name}":`, err);
        toast.error(`Failed to process "${file.name}"`);
      }
    }

    setIsProcessing(false);
    console.log("[MediaUploader] Batch complete. New media items added:", newMedia.length);
    if (newMedia.length > 0) {
      onChange([...value, ...newMedia]);
      toast.success(`Attached ${newMedia.length} media item(s)`);
    }
  }, [value, onChange]);

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[MediaUploader] onDragEnter event fired", { types: e.dataTransfer.types });
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[MediaUploader] onDragOver event fired");
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      console.log("[MediaUploader] onDragLeave event fired (exited dropzone)");
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[MediaUploader] onDrop event fired. Files in dataTransfer:", e.dataTransfer.files?.length);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    } else {
      console.warn("[MediaUploader] onDrop received 0 files in dataTransfer");
    }
  };

  // Clipboard Paste Support (for both files and image URLs)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      // 1. Check for binary files in clipboard
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        console.log("[MediaUploader] Paste event with binary files:", e.clipboardData.files.length);
        processFiles(e.clipboardData.files);
        return;
      }

      // 2. Check for text/URL in clipboard
      const text = e.clipboardData.getData("text")?.trim();
      if (text && /^(https?:\/\/|data:image\/)/i.test(text)) {
        console.log("[MediaUploader] Paste event with URL:", text);
        setIsProcessing(true);
        try {
          const res = await fetch(text);
          if (!res.ok) throw new Error("Fetch failed");
          const blob = await res.blob();
          if (!blob.type.startsWith("image/") && !blob.type.startsWith("video/")) {
            toast.error("Pasted URL is not a supported image or video.");
            return;
          }
          const filename = text.split("/").pop()?.split("?")[0] || "pasted-image.jpg";
          const file = new File([blob], filename, { type: blob.type });
          await processFiles([file]);
        } catch {
          // Fallback: direct URL if CORS limits local fetch
          const isVideo = text.toLowerCase().includes(".mp4");
          const item: ProductMedia = {
            id: "media_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            type: isVideo ? "video" : "image",
            url: text
          };
          onChange([...value, item]);
          toast.success("Attached media URL directly");
        } finally {
          setIsProcessing(false);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFiles, value, onChange]);

  const removeMedia = (id: string) => {
    onChange(value.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
          isDragging 
            ? "border-gold bg-gold/10 scale-[1.01] shadow-md ring-2 ring-gold/20" 
            : "border-border/60 hover:border-gold/50 bg-secondary/5"
        } ${isProcessing ? "opacity-75 cursor-wait" : ""}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 mb-3 text-gold animate-spin" />
            <p className="text-sm font-semibold text-navy-deep text-center">
              Processing & optimizing media...
            </p>
          </>
        ) : (
          <>
            <Upload className={`h-10 w-10 mb-3 transition-transform duration-200 ${isDragging ? "text-gold scale-125" : "text-navy-deep/40"}`} />
            <p className="text-sm font-semibold text-navy-deep text-center">
              {isDragging ? "Release to drop files here" : "Click, drag & drop, or paste to upload"}
            </p>
            <p className="text-xs text-navy-deep/60 mt-1 text-center">
              Supports JPG, PNG, WEBP, MP4 (Auto-optimized)
            </p>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = ""; // Reset so same file can be re-selected
            }
          }} 
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
                <img src={media.url} alt={`Upload ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply p-1" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" muted loop autoPlay />
              )}
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-navy-deep/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                    className="p-1 bg-white/20 hover:bg-red-500 rounded text-white transition-colors cursor-pointer"
                    title="Remove image"
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
