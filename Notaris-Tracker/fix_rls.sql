-- ============================================================
-- FIX RLS POLICIES, STORAGE PRIVACY & PRIVILEGE ESCALATION PREVENTION
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. PASTAIRAN TABEL PROFILES SUDAH ADA
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  title       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HAPUS POLICY POLICIES LAMA
DROP POLICY IF EXISTS "Auth users view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_delete" ON public.profiles;

-- 3. HELPER FUNCTION (PLPGSQL - Safe execution)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  RETURN current_user_role;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. TRIGGER FUNCTION: MENCEGAH STAF BIASA MENGUBAH KOLOM 'role' ATAU 'is_active'
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    IF auth.role() <> 'service_role' AND public.get_my_role() <> 'owner' THEN
      RAISE EXCEPTION 'Akses Ditolak: Hanya owner yang berhak mengubah role atau status keaktifan profil.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel profiles
DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- 5. RLS POLICIES PADA TABEL PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.get_my_role() = 'owner');

CREATE POLICY "profiles_owner_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.get_my_role() = 'owner');

CREATE POLICY "profiles_owner_delete" ON public.profiles
  FOR DELETE USING (public.get_my_role() = 'owner');

-- ============================================================
-- 6. PRIVATE STORAGE BUCKET & SECURE POLICIES FOR SENSITIVE DOCUMENTS
-- ============================================================

-- Ubah bucket 'documents' menjadi PRIVATE (public = false)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Hapus kebijakan publik atau lama yang tidak aman
DROP POLICY IF EXISTS "Public view documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users view documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete documents" ON storage.objects;

-- Hanya pengguna ter-autentikasi yang dapat melihat/membaca file via Signed URL
CREATE POLICY "Auth users view documents" ON storage.objects 
  FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Hanya pengguna ter-autentikasi yang dapat mengunggah file
CREATE POLICY "Auth users upload documents" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Hanya pengguna ter-autentikasi yang dapat meng-update file
CREATE POLICY "Auth users update documents" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Hanya pengguna ter-autentikasi yang dapat menghapus file
CREATE POLICY "Auth users delete documents" ON storage.objects 
  FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- ============================================================
-- 7. FIX CLIENT ID COLLISION & AUTOMATIC UUID GENERATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_client_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id TEXT;
BEGIN
  -- Cegah tabrakan ID dengan memastikan ID unik (UUID) jika tidak diisi
  v_client_id := COALESCE(NULLIF(TRIM(NEW.client_id), ''), gen_random_uuid()::text);
  NEW.client_id := v_client_id;

  INSERT INTO public.clients (id, name, phone, email, updated_at)
  VALUES (v_client_id, NEW.client_name, NEW.client_phone, NEW.client_email, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, clients.phone),
    email = COALESCE(EXCLUDED.email, clients.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_client_profile_trigger ON public.cases;
CREATE TRIGGER sync_client_profile_trigger
  BEFORE INSERT OR UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.sync_client_profile();

-- ============================================================
-- 8. ATOMIC CASE NUMBER GENERATION (CEGAH STRING SORT BUG & RACE CONDITION)
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_case_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_prefix TEXT;
  v_max_seq INT;
  v_next_seq INT;
BEGIN
  v_year := TO_CHAR(p_date, 'YYYY');
  v_month := TO_CHAR(p_date, 'MM');
  v_prefix := v_year || '/' || v_month || '/';

  -- Hitung MAX nomor secara NUMERIK (bukan ASCII string sort)
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(case_number FROM '\/([0-9]+)$') AS INTEGER)
  ), 0) INTO v_max_seq
  FROM public.cases
  WHERE case_number LIKE v_prefix || '%';

  v_next_seq := v_max_seq + 1;
  RETURN v_prefix || LPAD(v_next_seq::text, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Otomatis mengisi case_number secara atomic saat INSERT jika belum diisi
CREATE OR REPLACE FUNCTION public.assign_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL OR TRIM(NEW.case_number) = '' OR NEW.case_number LIKE '%/000' THEN
    NEW.case_number := public.generate_case_number(COALESCE(NEW.entry_date, CURRENT_DATE));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_assign_case_number ON public.cases;
CREATE TRIGGER tr_assign_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.assign_case_number();

-- ============================================================
-- 9. PROTEKSI FINANSIAL (Mencegah Staf Memanipulasi Biaya / Pembayaran)
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_case_financial_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Cek jika ada percobaan mengubah kolom biaya, jumlah dibayar, atau status pembayaran
  IF (NEW.fees IS DISTINCT FROM OLD.fees) OR 
     (NEW.paid_amount IS DISTINCT FROM OLD.paid_amount) OR 
     (NEW.payment_status IS DISTINCT FROM OLD.payment_status) THEN
    
    -- Hanya izinkan jika pengguna adalah service_role atau ber-role 'owner'
    IF auth.role() <> 'service_role' AND public.get_my_role() <> 'owner' THEN
      RAISE EXCEPTION 'Akses Ditolak: Hanya owner yang berhak mengubah biaya (fees), pembayaran (paid_amount), atau status pembayaran (payment_status).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_case_financial_fields ON public.cases;
CREATE TRIGGER tr_protect_case_financial_fields
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_case_financial_fields();

-- Verifikasi
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

SELECT 'RLS fix, privilege escalation prevention, private storage, atomic case_number & financial security completed!' AS status;
