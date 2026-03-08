import { getSupabaseClient } from "@/lib/supabaseClient";

const AVATAR_BUCKET = "avatars";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Invalid file type. Please upload a PNG, JPG, or WEBP image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("File too large. Max size is 5MB.");
  }
}

export async function uploadProfileImage(userId: string, file: File) {
  const supabase = getSupabaseClient();
  validateImageFile(file);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) {
    throw error;
  }
  return path;
}

export function getProfileImageUrl(path: string) {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
