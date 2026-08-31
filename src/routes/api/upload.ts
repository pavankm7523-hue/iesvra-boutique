import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";
import { requireAdmin } from "@/lib/session.server";

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    throw new Error(
      "Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are missing."
    );
  }

  return { url, key };
}

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const forbidden = requireAdmin(request); if (forbidden) return forbidden;
        try {
          const body = await request.json();
          const { fileData, fileName, contentType } = body;



          if (!fileData) {
            return new Response(
              JSON.stringify({ error: "No fileData provided" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const { url, key } = getSupabaseConfig();
          const bucketName = "iesvra-media";

          // Extract base64 and clean up
          const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          const dataMimeType = fileData.match(/^data:([^;]+);base64,/)?.[1];
          const mimeType = dataMimeType || contentType || "application/octet-stream";
          const extensionByMime: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "image/svg+xml": ".svg",
            "video/mp4": ".mp4",
            "video/webm": ".webm",
          };
          const originalExtension = (fileName && fileName.includes("."))
            ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9.]/g, "")
            : "";
          const cleanExt = extensionByMime[mimeType] || originalExtension || ".bin";
          const uniqueFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${cleanExt}`;



          // Upload to Supabase Storage bucket
          const uploadRes = await fetch(
            `${url}/storage/v1/object/${bucketName}/${uniqueFileName}`,
            {
              method: "POST",
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                "Content-Type": mimeType,
                "x-upsert": "true",
              },
              body: buffer,
            }
          );



          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error("[upload API] Supabase storage upload failed:", uploadRes.status, errText);
            return new Response(
              JSON.stringify({ error: `Supabase Storage error: ${errText}` }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const publicUrl = `${url}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;



          return new Response(
            JSON.stringify({ success: true, url: publicUrl, fileName: uniqueFileName }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("[upload API] Unexpected error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to upload file" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
