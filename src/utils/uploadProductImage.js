import { supabase } from "../supabaseClient";

export async function uploadProductImage(file) {
  if (!file) return "";

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("products") // ✅ EXACT bucket name
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw error;
  }

  const { data } = supabase.storage.from("products").getPublicUrl(fileName);

  return data.publicUrl;
}
