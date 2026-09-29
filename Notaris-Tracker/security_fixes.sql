-- ============================================================
-- SUPABASE DATABASE SECURITY & PRIVACY FIXES MIGRATION
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX PRIVASI PELACAKAN PUBLIK (RPC: track_case)
-- Menyembunyikan nama klien, nilai finansial, dan log staf internal dari publik
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.track_case(text);

CREATE OR REPLACE FUNCTION public.track_case(p_case_number TEXT)
RETURNS TABLE (
  id UUID,
  case_number TEXT,
  category TEXT,
  service_type TEXT,
  status TEXT,
  current_stage_id INTEGER,
  is_complete BOOLEAN,
  documents_ready BOOLEAN,
  entry_date DATE,
  estimation_date DATE,
  checklist JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.case_number,
    c.category,
    c.service_type,
    c.status,
    c.current_stage_id,
    c.is_complete,
    c.documents_ready,
    c.entry_date,
    c.estimation_date,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', ci.id,
          'order_num', ci.order_num,
          'name', ci.name,
          'description', ci.description,
          'status', ci.status
        ) ORDER BY ci.order_num)
        FROM public.checklist_items ci
        WHERE ci.case_id = c.id
      ),
      '[]'::jsonb
    ) AS checklist
  FROM public.cases c
  WHERE LOWER(TRIM(c.case_number)) = LOWER(TRIM(p_case_number));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------
-- 2. FIX PROTEKSI FINANSIAL SAAT INSERT MAUPUN UPDATE
-- Mencegah staf memanipulasi biaya/pembayaran saat membuat berkas baru maupun update
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_case_financial_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Jika staf mencoba mengeset biaya / status bayar lunas saat insert
    IF (COALESCE(NEW.fees, 0) > 0 OR COALESCE(NEW.paid_amount, 0) > 0 OR (NEW.payment_status IS NOT NULL AND NEW.payment_status <> 'Belum Lunas')) THEN
      IF auth.role() <> 'service_role' AND public.get_my_role() <> 'owner' THEN
        -- Izinkan default 0 / Belum Lunas, tetapi cegah pengisian nilai finansial oleh staf
        NEW.fees := 0;
        NEW.paid_amount := 0;
        NEW.payment_status := 'Belum Lunas';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.fees IS DISTINCT FROM OLD.fees) OR 
       (NEW.paid_amount IS DISTINCT FROM OLD.paid_amount) OR 
       (NEW.payment_status IS DISTINCT FROM OLD.payment_status) THEN
      IF auth.role() <> 'service_role' AND public.get_my_role() <> 'owner' THEN
        RAISE EXCEPTION 'Akses Ditolak: Hanya owner yang berhak mengubah biaya (fees), pembayaran (paid_amount), atau status pembayaran (payment_status).';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_case_financial_fields ON public.cases;
CREATE TRIGGER tr_protect_case_financial_fields
  BEFORE INSERT OR UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_case_financial_fields();


-- ------------------------------------------------------------
-- 3. FIX PENAMBAHAN AKUN STAF OLEH OWNER (RPC: create_staff_account)
-- Mencegah terhapusnya sesi login Owner di browser saat membuat staf baru
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_title TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  IF public.get_my_role() <> 'owner' AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya Ketua Notaris (Owner) yang berhak membuat akun staf baru.';
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', p_email, v_encrypted_pw, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', 'staff', 'title', p_title),
    NOW(), NOW(), 'authenticated', 'authenticated'
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email', NOW(), NOW(), NOW(), p_email
  );

  INSERT INTO public.profiles (id, full_name, role, title, email, is_active)
  VALUES (v_user_id, p_full_name, 'staff', p_title, p_email, TRUE)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name, title = EXCLUDED.title, email = EXCLUDED.email, is_active = TRUE;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------
-- 4. FIX DEAKTIVASI / PENGHAPUSAN STAF (RPC: deactivate_staff_account)
-- Menonaktifkan akun profil & menghapus entri auth agar tidak bisa login kembali
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deactivate_staff_account(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  IF public.get_my_role() <> 'owner' AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya Owner yang berhak menonaktifkan akun staf.';
  END IF;

  UPDATE public.profiles
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = p_user_id;

  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------
-- 5. FIX ISOLASI RLS AUDIT LOG (activity_logs)
-- Memastikan staf hanya bisa melihat log aktivitas berkas yang ditugaskan padanya
-- ------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth users view logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Owner and Assigned Staff view logs" ON public.activity_logs;

CREATE POLICY "Owner and Assigned Staff view logs" ON public.activity_logs FOR SELECT
  USING (
    public.get_my_role() = 'owner'
    OR
    EXISTS (
      SELECT 1 FROM public.cases c 
      WHERE c.id = activity_logs.case_id 
      AND c.assigned_staff_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 6. RLS DELETE POLICIES: KONTROL HAPUS BERKAS KHUSUS OWNER
-- Memastikan hanya Notaris Utama (Owner) yang berhak menghapus berkas & data terkait
-- ------------------------------------------------------------
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner delete cases" ON public.cases;
DROP POLICY IF EXISTS "Owner delete checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Owner delete activity_logs" ON public.activity_logs;

CREATE POLICY "Owner delete cases" ON public.cases FOR DELETE
  USING (public.get_my_role() = 'owner');

CREATE POLICY "Owner delete checklist_items" ON public.checklist_items FOR DELETE
  USING (public.get_my_role() = 'owner');

CREATE POLICY "Owner delete activity_logs" ON public.activity_logs FOR DELETE
  USING (public.get_my_role() = 'owner');

SELECT 'Semua perbaikan keamanan SQL berhasil diterapkan!' AS status;
