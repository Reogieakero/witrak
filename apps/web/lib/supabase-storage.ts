import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const TRANSPARENCY_BUCKET = "transparency";
export const ANNOUNCEMENTS_BUCKET = "announcements";
export const STUDENTS_BUCKET = "students";
export const FEE_PROOFS_BUCKET = "fee-proofs";

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
  await ensureBucket(supabase, TRANSPARENCY_BUCKET);

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

export async function uploadAnnouncementImage(
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = getSupabaseStorage();
  await ensureBucket(supabase, ANNOUNCEMENTS_BUCKET);

  const { error } = await supabase.storage
    .from(ANNOUNCEMENTS_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(ANNOUNCEMENTS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

export async function uploadStudentImage(
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = getSupabaseStorage();
  await ensureBucket(supabase, STUDENTS_BUCKET);

  const { error } = await supabase.storage
    .from(STUDENTS_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STUDENTS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

export async function uploadFeeProof(
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = getSupabaseStorage();
  await ensureBucket(supabase, FEE_PROOFS_BUCKET);

  const { error } = await supabase.storage
    .from(FEE_PROOFS_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(FEE_PROOFS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

async function ensureBucket(supabase: SupabaseClient, bucket: string) {
  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    console.warn("ensureBucket warning:", error.message);
  }
}
