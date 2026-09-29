-- ============================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION (avatars)
-- Jalankan query ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Buat bucket public 'avatars' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Kebijakan Akses Baca Publik (Semua orang dapat melihat foto avatar)
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. Kebijakan Akses Unggah Bagi Pemilik Akun (Folder = auth.uid())
DROP POLICY IF EXISTS "Authenticated User Upload Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Upload Avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Kebijakan Akses Pembaruan Avatar Bagi Pemilik Akun (Update/Upsert)
DROP POLICY IF EXISTS "Authenticated User Update Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Update Avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Kebijakan Akses Hapus Avatar Bagi Pemilik Akun
DROP POLICY IF EXISTS "Authenticated User Delete Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Delete Avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

SELECT 'Bucket storage avatars dan kebijakan RLS aman berhasil disiapkan!' AS status;
