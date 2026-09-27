-- ============================================================
-- SQL ALTER QUERY: Menambahkan kolom phone ke tabel profiles
-- Jalankan query ini di: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verifikasi kolom berhasil ditambahkan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'phone';
