import { createFileRoute } from "@tanstack/react-router";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/save-address")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          const { flatNo, floor, locality, landmark, lat, lng, addressTag, name, phone } = payload;

          if (!flatNo || !locality || !name) {
            return new Response(
              JSON.stringify({ error: "Missing required fields: flatNo, locality, or name" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Fetch existing saved addresses from metadata store
          let existingList;
          try {
            existingList = await getMetadataFromDb("global_saved_addresses");
          } catch (dbErr) {
            console.warn("[api-save-address] Metadata retrieve warning, starting fresh list:", dbErr);
          }
          
          const addressList = Array.isArray(existingList) ? existingList : [];

          // Package the new address record
          const newAddress = {
            id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            flatNo,
            floor: floor || "",
            locality,
            landmark: landmark || "",
            lat: lat != null ? Number(lat) : null,
            lng: lng != null ? Number(lng) : null,
            addressTag: addressTag || "Other",
            name,
            phone: phone || "",
            createdAt: new Date().toISOString()
          };

          // Append address to list
          addressList.push(newAddress);

          // Save the updated list back to the DB metadata slot
          const success = await saveMetadataToDb("global_saved_addresses", addressList);

          if (!success) {
            return new Response(
              JSON.stringify({ error: "Failed to save address to database." }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          console.log("[api-save-address] Successfully saved address:", newAddress.id, "Total addresses saved:", addressList.length);

          return new Response(JSON.stringify(newAddress), {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
          });
        } catch (error: any) {
          console.error("[api-save-address] Unexpected error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to parse address data." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
