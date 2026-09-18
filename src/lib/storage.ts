import { createClient } from "@supabase/supabase-js";

// Service-role client — used only on the server (Server Actions), never
// exposed to the browser. Bucket "resumes" should have RLS restricting
// object paths to `${userId}/...` if using the browser client anywhere.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const RESUME_BUCKET = "resumes";

export async function uploadResumeFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload resume: ${error.message}`);
  return path;
}

export async function getResumeSignedUrl(path: string, expiresInSeconds = 60 * 10): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) throw new Error("Failed to generate resume download link.");
  return data.signedUrl;
}

export async function downloadResumeBuffer(path: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(RESUME_BUCKET).download(path);
  if (error || !data) throw new Error("Failed to download resume file.");
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteResumeFile(path: string): Promise<void> {
  await supabaseAdmin.storage.from(RESUME_BUCKET).remove([path]);
}
