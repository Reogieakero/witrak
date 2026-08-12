import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const TRANSPARENCY_BUCKET = "transparency";

let client: SupabaseClient | null = null;

export function getSupabaseStorage(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function uploadTransparencyFile(
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = getSupabaseStorage();
  await ensureBucket(supabase);

  const { error } = await supabase.storage
    .from(TRANSPARENCY_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(TRANSPARENCY_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

async function ensureBucket(supabase: SupabaseClient) {
  const { error } = await supabase.storage.createBucket(TRANSPARENCY_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    console.warn("ensureBucket warning:", error.message);
  }
}
