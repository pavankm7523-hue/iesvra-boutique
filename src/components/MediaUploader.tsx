import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductMedia } from "@/lib/products";

type PreparedUpload = {
  dataUrl: string;
  fileName: string;
  contentType: string;
};



const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif", "bmp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function mediaKind(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const extension = extensionOf(file.name);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  return null;
}

function fileNameWithExtension(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "upload";
  return `${base}.${extension}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

async function prepareImageUpload(file: File): Promise<PreparedUpload> {
  const sourceDataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxDimension = 1600;
      let width = image.width;
      let height = image.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve({ dataUrl: sourceDataUrl, fileName: file.name, contentType: file.type || "image/jpeg" });
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const wantsPng = file.type === "image/png" || extensionOf(file.name) === "png";
      const wantsWebp = file.type === "image/webp" || extensionOf(file.name) === "webp";
      const requestedType = wantsPng ? "image/png" : wantsWebp ? "image/webp" : "image/jpeg";
      let dataUrl = canvas.toDataURL(requestedType, requestedType === "image/png" ? undefined : 0.88);
      let contentType = requestedType;
      if (!dataUrl.startsWith(`data:${requestedType}`)) {
        contentType = "image/jpeg";
        dataUrl = canvas.toDataURL(contentType, 0.88);
      }

      const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      resolve({ dataUrl, contentType, fileName: fileNameWithExtension(file.name, extension) });
    };
    image.onerror = () => {
      const contentType = file.type || "image/jpeg";
      const extension = extensionOf(file.name) || "jpg";
      resolve({ dataUrl: sourceDataUrl, contentType, fileName: fileNameWithExtension(file.name, extension) });
    };
    image.src = sourceDataUrl;
  });
}

async function uploadPreparedFile(prepared: PreparedUpload): Promise<string> {

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileData: prepared.dataUrl,
      fileName: prepared.fileName,
      contentType: prepared.contentType,
    }),
  });
  const responseText = await response.text();


  let responseData: { url?: string; error?: string } = {};
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Upload returned invalid JSON (HTTP ${response.status}).`);
  }
  if (!response.ok || !responseData.url) {
    throw new Error(responseData.error || `Upload failed with HTTP ${response.status}.`);
  }
  return responseData.url;
}

export function MediaUploader({ value = [], onChange }: {
  value?: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const processFiles = useCallback(async (files: FileList | File[]) => {

    if (!files.length) return;
    setIsProcessing(true);
    const newMedia: ProductMedia[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const kind = mediaKind(file);

        if (!kind) {
          console.warn("[MediaUploader] file rejected", { name: file.name, type: file.type });
          toast.error(`File "${file.name}" is not a supported image or video.`);
          continue;
        }
        if (kind === "video" && file.size > 10 * 1024 * 1024) {
          toast.error(`Video "${file.name}" is too large (maximum 10MB).`);
          continue;
        }

        try {
          const prepared = kind === "image"
            ? await prepareImageUpload(file)
            : {
                dataUrl: await readFileAsDataUrl(file),
                fileName: file.name,
                contentType: file.type || "video/mp4",
              };

          const mediaUrl = await uploadPreparedFile(prepared);
          newMedia.push({
            id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: kind,
            url: mediaUrl,
          });
        } catch (error) {
          console.error("[MediaUploader] file processing/upload failed", {
            name: file.name,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error(`Upload failed for "${file.name}": ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      if (newMedia.length > 0) {
        const nextValue = [...value, ...newMedia];

        onChange(nextValue);
        toast.success(`Uploaded ${newMedia.length} media item(s)`);
      }
    } finally {
      setIsProcessing(false);

    }
  }, [onChange, value]);

  const processDroppedUrl = useCallback(async (url: string) => {

    setIsProcessing(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not download dropped URL (HTTP ${response.status}).`);
      const blob = await response.blob();
      const pathName = new URL(url).pathname.split("/").pop() || "dropped-image.jpg";
      await processFiles([new File([blob], pathName, { type: blob.type })]);
    } catch (error) {
      console.error("[MediaUploader] dropped URL failed", error);
      toast.error(error instanceof Error ? error.message : "Could not use the dropped image URL.");
    } finally {
      setIsProcessing(false);
    }
  }, [processFiles]);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";

    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {

      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const filesFromItems = Array.from(event.dataTransfer.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    const files = event.dataTransfer.files.length > 0 ? Array.from(event.dataTransfer.files) : filesFromItems;
    const html = event.dataTransfer.getData("text/html");
    const htmlImageUrl = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
    const droppedUrl = event.dataTransfer.getData("text/uri-list").split("\n").find((line) => /^https?:\/\//i.test(line.trim()))?.trim()
      || htmlImageUrl
      || (/^https?:\/\//i.test(event.dataTransfer.getData("text/plain").trim()) ? event.dataTransfer.getData("text/plain").trim() : "");


    if (files.length > 0) void processFiles(files);
    else if (droppedUrl) void processDroppedUrl(droppedUrl);
    else {
      console.warn("[MediaUploader] onDrop contained no supported file or image URL");
      toast.error("Nothing uploadable was found in that drop. Drag an image file or image URL.");
    }
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      if (event.clipboardData.files.length > 0) {

        await processFiles(event.clipboardData.files);
        return;
      }
      const text = event.clipboardData.getData("text").trim();
      if (/^https?:\/\//i.test(text)) await processDroppedUrl(text);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processDroppedUrl, processFiles]);

  const removeMedia = (id: string) => onChange(value.filter((media) => media.id !== id));

  return (
    <div className="space-y-4">
      <div
        data-testid="media-dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${isDragging ? "border-gold bg-gold/10 scale-[1.01] shadow-md ring-2 ring-gold/20" : "border-border/60 hover:border-gold/50 bg-secondary/5"} ${isProcessing ? "opacity-75 cursor-wait" : ""}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 mb-3 text-gold animate-spin" />
            <p className="text-sm font-semibold text-navy-deep text-center">Reading and uploading media…</p>
          </>
        ) : (
          <>
            <Upload className={`h-10 w-10 mb-3 transition-transform duration-200 ${isDragging ? "text-gold scale-125" : "text-navy-deep/40"}`} />
            <p className="text-sm font-semibold text-navy-deep text-center">{isDragging ? "Release to upload" : "Click, drag & drop, or paste to upload"}</p>
            <p className="text-xs text-navy-deep/60 mt-1 text-center">JPG, PNG, WEBP, SVG, MP4 (images are optimized)</p>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(event) => {

            if (event.target.files?.length) void processFiles(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
          multiple
          accept="image/*,video/*"
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="Uploaded media previews">
          {value.map((media, index) => (
            <div key={media.id} className="relative group aspect-square rounded-lg border border-border/50 overflow-hidden bg-[#f4f2ef]">
              {media.type === "image" ? (
                <img src={media.url} alt={`Upload ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply p-1" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" muted loop autoPlay />
              )}
              <div className="absolute inset-0 bg-navy-deep/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button type="button" onClick={(event) => { event.stopPropagation(); removeMedia(media.id); }} className="p-1 bg-white/20 hover:bg-red-500 rounded text-white transition-colors cursor-pointer" title="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-1 items-center text-white/90">
                  {media.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  <span className="text-[10px] font-medium tracking-wide uppercase">{index === 0 ? "Primary" : media.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
