-- ============================================================
-- NOTARIS DIGITAL — SUPABASE DATABASE MIGRATION WITH HISTORY & BACKUP
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ============================================================
-- 1. EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================================
-- 2. TABEL PROFILES (Dibuat di awal agar fungsi get_my_role() dapat dikompilasi)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
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

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================
-- 3. HELPER FUNCTIONS & RPC (Dideklarasikan setelah tabel profiles terbentuk)
-- ============================================================
-- Fungsi helper untuk menghindari recursive loop RLS pada tabel profiles
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

-- Trigger Function: Mencegah staf biasa mengubah kolom 'role' atau 'is_active'
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

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();


-- RPC untuk tracking berkas secara publik (hanya mengembalikan info non-sensitif)
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
  checklist JSONB,
  logs JSONB
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
    ) AS checklist,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'timestamp', al.created_at,
          'user', al.user_name,
          'action', al.action
        ) ORDER BY al.created_at)
        FROM public.activity_logs al
        WHERE al.case_id = c.id
      ),
      '[]'::jsonb
    ) AS logs
  FROM public.cases c
  WHERE LOWER(TRIM(c.case_number)) = LOWER(TRIM(p_case_number));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. TABEL CLIENTS (Master data & Backup)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id           TEXT PRIMARY KEY, -- client_id (NIK / identifier)
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================
-- 5. TABEL CASES (berkas notaris)
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number       TEXT UNIQUE NOT NULL,
  client_name       TEXT NOT NULL,
  client_id         TEXT NOT NULL,
  client_phone      TEXT,
  client_email      TEXT,
  category          TEXT NOT NULL DEFAULT 'ppat' CHECK (category IN ('ppat', 'notaris')),
  service_type      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'Pemeriksaan Dokumen',
  current_stage_id  INTEGER DEFAULT 1,
  is_complete       BOOLEAN DEFAULT FALSE,
  documents_ready   BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  fees              BIGINT DEFAULT 0,
  property_location TEXT,
  bank_partner      TEXT,
  entry_date        DATE DEFAULT CURRENT_DATE,
  estimation_date   DATE,
  assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX IF NOT EXISTS idx_cases_assigned_staff ON cases(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_service_type ON cases(service_type);
CREATE INDEX IF NOT EXISTS idx_cases_is_complete ON cases(is_complete);

-- ============================================================
-- 6. TABEL CHECKLIST_TEMPLATES (default per service type)
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  order_num    INTEGER NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  UNIQUE(service_type, order_num)
);

-- ============================================================
-- 7. TABEL CHECKLIST_ITEMS (dokumen per berkas)
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  order_num   INTEGER NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'Belum Ada'
              CHECK (status IN ('Belum Ada', 'Sudah Diterima', 'Perlu Verifikasi')),
  file_url    TEXT,
  file_name   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checklist_case_id ON checklist_items(case_id);

-- ============================================================
-- 8. TABEL ACTIVITY_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID REFERENCES cases(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  user_role   TEXT,
  category    TEXT CHECK (category IN ('ppat', 'notaris', 'system')),
  action      TEXT NOT NULL,
  icon        TEXT DEFAULT 'history',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_case_id ON activity_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- 9. TABEL SERVICES (referensi jenis layanan)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('ppat', 'notaris')),
  average_time TEXT,
  base_fee     BIGINT DEFAULT 0,
  description  TEXT,
  is_active    BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 10. TABEL BACKUP / HISTORY (AUDIT TRAILS)
-- ============================================================
-- Tabel Backup Riwayat Berkas (Cases History)
CREATE TABLE IF NOT EXISTS cases_history (
  history_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id            UUID NOT NULL,
  case_number        TEXT NOT NULL,
  client_name        TEXT NOT NULL,
  client_id          TEXT NOT NULL,
  client_phone       TEXT,
  client_email       TEXT,
  category           TEXT NOT NULL,
  service_type       TEXT NOT NULL,
  status             TEXT NOT NULL,
  current_stage_id   INTEGER,
  is_complete        BOOLEAN,
  documents_ready    BOOLEAN,
  notes              TEXT,
  fees               BIGINT,
  property_location  TEXT,
  bank_partner       TEXT,
  entry_date         DATE,
  estimation_date    DATE,
  assigned_staff_id  UUID,
  created_by_id      UUID,
  updated_by_id      UUID, -- User yang mengubah
  change_type        TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_at         TIMESTAMPTZ DEFAULT NOW(),
  old_data           JSONB, -- Snapshot data lama
  new_data           JSONB  -- Snapshot data baru
);

CREATE INDEX IF NOT EXISTS idx_cases_hist_case_id ON cases_history(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_hist_changed_at ON cases_history(changed_at DESC);

-- Tabel Backup Riwayat Checklist Dokumen
CREATE TABLE IF NOT EXISTS checklist_items_history (
  history_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL,
  case_id         UUID NOT NULL,
  order_num       INTEGER NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL,
  file_url        TEXT,
  file_name       TEXT,
  updated_by      UUID, -- User yang mengubah
  change_type     TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_at      TIMESTAMPTZ DEFAULT NOW(),
  old_data        JSONB, -- Snapshot data lama
  new_data        JSONB  -- Snapshot data baru
);

CREATE INDEX IF NOT EXISTS idx_chk_items_hist_case_id ON checklist_items_history(case_id);

-- ============================================================
-- 11. TRIGGERS UNTUK SINKRONISASI & BACKUP OTOMATIS
-- ============================================================

-- A. Trigger untuk Sinkronisasi Otomatis Profil Klien ke Tabel Master 'clients'
CREATE OR REPLACE FUNCTION public.sync_client_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id TEXT;
BEGIN
  -- Pastikan client_id unik dan tidak null/kosong (Gunakan gen_random_uuid if missing)
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

-- B. Fungsi & Trigger untuk Penomoran Berkas Otomatis (Atomic & Numerik)
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

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(case_number FROM '\/([0-9]+)$') AS INTEGER)
  ), 0) INTO v_max_seq
  FROM public.cases
  WHERE case_number LIKE v_prefix || '%';

  v_next_seq := v_max_seq + 1;
  RETURN v_prefix || LPAD(v_next_seq::text, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- C. Trigger Proteksi Finansial (Mencegah Staf Memanipulasi Biaya & Pembayaran)
CREATE OR REPLACE FUNCTION public.protect_case_financial_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.fees IS DISTINCT FROM OLD.fees) OR 
     (NEW.paid_amount IS DISTINCT FROM OLD.paid_amount) OR 
     (NEW.payment_status IS DISTINCT FROM OLD.payment_status) THEN
    
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
  FOR EACH ROW EXECUTE FUNCTION public.protect_case_financial_fields();

-- B. Trigger untuk Backup Otomatis Kasus ke 'cases_history'
CREATE OR REPLACE FUNCTION public.log_case_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.cases_history (
      case_id, case_number, client_name, client_id, client_phone, client_email,
      category, service_type, status, current_stage_id, is_complete, documents_ready,
      notes, fees, property_location, bank_partner, entry_date, estimation_date,
      assigned_staff_id, created_by_id, updated_by_id, change_type, old_data
    ) VALUES (
      OLD.id, OLD.case_number, OLD.client_name, OLD.client_id, OLD.client_phone, OLD.client_email,
      OLD.category, OLD.service_type, OLD.status, OLD.current_stage_id, OLD.is_complete, OLD.documents_ready,
      OLD.notes, OLD.fees, OLD.property_location, OLD.bank_partner, OLD.entry_date, OLD.estimation_date,
      OLD.assigned_staff_id, OLD.created_by_id, current_user_id, 'DELETE', to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.cases_history (
      case_id, case_number, client_name, client_id, client_phone, client_email,
      category, service_type, status, current_stage_id, is_complete, documents_ready,
      notes, fees, property_location, bank_partner, entry_date, estimation_date,
      assigned_staff_id, created_by_id, updated_by_id, change_type, old_data, new_data
    ) VALUES (
      NEW.id, NEW.case_number, NEW.client_name, NEW.client_id, NEW.client_phone, NEW.client_email,
      NEW.category, NEW.service_type, NEW.status, NEW.current_stage_id, NEW.is_complete, NEW.documents_ready,
      NEW.notes, NEW.fees, NEW.property_location, NEW.bank_partner, NEW.entry_date, NEW.estimation_date,
      NEW.assigned_staff_id, NEW.created_by_id, current_user_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.cases_history (
      case_id, case_number, client_name, client_id, client_phone, client_email,
      category, service_type, status, current_stage_id, is_complete, documents_ready,
      notes, fees, property_location, bank_partner, entry_date, estimation_date,
      assigned_staff_id, created_by_id, updated_by_id, change_type, new_data
    ) VALUES (
      NEW.id, NEW.case_number, NEW.client_name, NEW.client_id, NEW.client_phone, NEW.client_email,
      NEW.category, NEW.service_type, NEW.status, NEW.current_stage_id, NEW.is_complete, NEW.documents_ready,
      NEW.notes, NEW.fees, NEW.property_location, NEW.bank_partner, NEW.entry_date, NEW.estimation_date,
      NEW.assigned_staff_id, NEW.created_by_id, current_user_id, 'INSERT', to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER log_case_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.log_case_history();

-- C. Trigger untuk Backup Otomatis Checklist Item ke 'checklist_items_history'
CREATE OR REPLACE FUNCTION public.log_checklist_item_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.checklist_items_history (
      item_id, case_id, order_num, name, description, status, file_url, file_name,
      updated_by, change_type, old_data
    ) VALUES (
      OLD.id, OLD.case_id, OLD.order_num, OLD.name, OLD.description, OLD.status, OLD.file_url, OLD.file_name,
      current_user_id, 'DELETE', to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.checklist_items_history (
      item_id, case_id, order_num, name, description, status, file_url, file_name,
      updated_by, change_type, old_data, new_data
    ) VALUES (
      NEW.id, NEW.case_id, NEW.order_num, NEW.name, NEW.description, NEW.status, NEW.file_url, NEW.file_name,
      current_user_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.checklist_items_history (
      item_id, case_id, order_num, name, description, status, file_url, file_name,
      updated_by, change_type, new_data
    ) VALUES (
      NEW.id, NEW.case_id, NEW.order_num, NEW.name, NEW.description, NEW.status, NEW.file_url, NEW.file_name,
      current_user_id, 'INSERT', to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER log_checklist_item_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.log_checklist_item_history();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid() OR public.get_my_role() = 'owner');

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.get_my_role() = 'owner');

CREATE POLICY "profiles_owner_delete" ON profiles
  FOR DELETE USING (public.get_my_role() = 'owner');

-- CLIENTS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

-- CASES
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select all cases" ON cases FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Staff select assigned cases" ON cases FOR SELECT
  USING (assigned_staff_id = auth.uid());

CREATE POLICY "Auth users insert cases" ON cases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner update all cases" ON cases FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Staff update assigned cases" ON cases FOR UPDATE
  USING (assigned_staff_id = auth.uid());

CREATE POLICY "Owner delete cases" ON cases FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- CHECKLIST_ITEMS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checklist access follows case" ON checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = checklist_items.case_id
      AND (
        c.assigned_staff_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
      )
    )
  );

-- CHECKLIST_TEMPLATES (read-only untuk semua authenticated)
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read templates" ON checklist_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owner manage templates" ON checklist_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- ACTIVITY_LOGS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view logs" ON activity_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users insert logs" ON activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- SERVICES (read-only untuk semua)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read services" ON services FOR SELECT
  USING (true);

CREATE POLICY "Owner manage services" ON services FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- CASES_HISTORY (read-only backup trail untuk Owner)
ALTER TABLE cases_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner view cases history" ON cases_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- CHECKLIST_ITEMS_HISTORY (read-only backup trail untuk Owner)
ALTER TABLE checklist_items_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner view checklist history" ON checklist_items_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- ============================================================
-- 13. SEED DATA — SERVICES
-- ============================================================
INSERT INTO services (id, name, category, average_time, base_fee, description) VALUES
  ('AJB',     'Akta Jual Beli',                              'ppat',    '3-5 Hari Kerja',   12000000, 'Akta otentik yang membuktikan peralihan hak atas tanah dan bangunan karena transaksi jual beli.'),
  ('SKMHT',   'Surat Kuasa Membebankan Hak Tanggungan',      'notaris', '2-3 Hari Kerja',    4500000, 'Surat kuasa untuk membebankan Hak Tanggungan guna jaminan pelunasan hutang debitur.'),
  ('HT',      'Hak Tanggungan',                              'ppat',    '5-7 Hari Kerja',    8000000, 'Pendaftaran hak jaminan atas tanah/bangunan untuk menjamin utang klien.'),
  ('APHT',    'Akta Pemberian Hak Tanggungan',               'ppat',    '5-7 Hari Kerja',    8000000, 'Akta pemberian hak tanggungan atas objek tanah/bangunan.'),
  ('HIBAH',   'Akta Hibah',                                  'ppat',    '3-5 Hari Kerja',   10000000, 'Akta pemberian hak atas tanah/bangunan kepada penerima hibah.'),
  ('APHB',    'Akta Pembagian Hak Bersama',                  'ppat',    '5-7 Hari Kerja',   10000000, 'Akta pembagian hak atas tanah/bangunan yang dimiliki secara bersama.'),
  ('WARIS',   'Waris',                                       'ppat',    '7-10 Hari Kerja',  12000000, 'Proses peralihan hak atas tanah kepada ahli waris yang sah.'),
  ('ROYA',    'Roya Hak Tanggungan',                         'ppat',    '3-5 Hari Kerja',    5000000, 'Penghapusan catatan hak tanggungan dari sertifikat tanah.'),
  ('PECAH',   'Pemecahan Sertifikat',                        'ppat',    '14-21 Hari Kerja',  8000000, 'Pemecahan satu sertifikat tanah menjadi beberapa sertifikat baru.'),
  ('GANTI',   'Sertifikat Pengganti',                        'ppat',    '14-21 Hari Kerja',  8000000, 'Penerbitan sertifikat tanah baru sebagai pengganti sertifikat yang hilang/rusak.'),
  ('KONVERSI','Konversi Letter C',                           'ppat',    '30-60 Hari Kerja', 10000000, 'Konversi bukti kepemilikan tanah lama (Letter C) menjadi sertifikat modern.'),
  ('FIDUSIA', 'Akta Jaminan Fidusia',                        'notaris', '3-5 Hari Kerja',    6000000, 'Akta penyerahan hak kepemilikan atas benda bergerak sebagai jaminan utang.'),
  ('APJB',    'Akta Pengikatan Jual Beli',                   'notaris', '3-5 Hari Kerja',    8000000, 'Akta perjanjian pengikatan jual beli sebelum AJB definitif.'),
  ('APPJB',   'Akta Perjanjian Pengikatan Jual Beli',        'notaris', '3-5 Hari Kerja',    8000000, 'Akta perjanjian lebih rinci sebelum proses AJB dilaksanakan.'),
  ('SKUM',    'Akta Surat Kuasa Untuk Menjual',              'notaris', '2-3 Hari Kerja',    5000000, 'Surat kuasa resmi yang memberikan kewenangan untuk menjual properti.'),
  ('SEWA',    'Akta Perjanjian Sewa Menyewa',                'notaris', '2-3 Hari Kerja',    5000000, 'Akta perjanjian sewa menyewa properti antara pemilik dan penyewa.'),
  ('CONSEN',  'Akta Consen Roya',                            'notaris', '3-5 Hari Kerja',    5000000, 'Akta persetujuan roya untuk penghapusan hak tanggungan.'),
  ('APK',     'Akta Perjanjian Kredit',                      'notaris', '3-5 Hari Kerja',    6000000, 'Akta perjanjian kredit antara debitur and kreditur.'),
  ('YAYASAN', 'Akta Pendirian Yayasan',                      'notaris', '7-10 Hari Kerja',  15000000, 'Akta pendirian yayasan lengkap dengan pengesahan Kemenkumham.'),
  ('PT',      'Akta Pendirian PT',                           'notaris', '7-10 Hari Kerja',  25000000, 'Akta pendirian Perseroan Terbatas lengkap dengan pengesahan Kemenkumham.'),
  ('CV',      'Akta Pendirian/Perubahan CV',                 'notaris', '5-7 Hari Kerja',   15000000, 'Akta pendirian atau perubahan Commanditaire Vennootschap dengan pendaftaran Kemenkumham.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. SEED DATA — CHECKLIST TEMPLATES (AJB)
-- ============================================================
INSERT INTO checklist_templates (service_type, order_num, name, description) VALUES
  ('AJB',  1,  'Sertifikat Asli',                        'Sertifikat asli (HM/HGB/HP) dari BPN'),
  ('AJB',  2,  'Fotokopi KTP Pemegang Hak',              'Valid E-KTP photocopy or scan of seller'),
  ('AJB',  3,  'Fotokopi KTP Persetujuan Pemegang Hak',  'Required for married individuals'),
  ('AJB',  4,  'Fotokopi Surat Nikah Pemegang Hak',      'Marriage certificate of seller'),
  ('AJB',  5,  'Fotokopi KK Pemegang Hak',               'Family Registry card of seller'),
  ('AJB',  6,  'Fotokopi KTP Pembeli',                   'Valid E-KTP photocopy or scan of buyer'),
  ('AJB',  7,  'Fotokopi KK Pembeli',                    'Family Registry card of buyer'),
  ('AJB',  8,  'Nomor Telepon dan Email Pembeli',         'Contact details of buyer'),
  ('AJB',  9,  'Fotokopi PBB Tahun Berjalan',            'Latest property tax receipt'),
  ('AJB', 10,  'Share Lokasi Tanah',                     'Location coordinates or map link'),
  ('AJB', 11,  'Foto Lokasi Tanah (GPS Maps Camera)',    'Physical photo with coordinate stamp'),

-- SKMHT
  ('SKMHT', 1, 'Sertifikat Asli',                        'Must be physical original document'),
  ('SKMHT', 2, 'KTP AN. Pemegang Hak',                   'Valid E-KTP photocopy or scan'),
  ('SKMHT', 3, 'KTP Persetujuan Pemegang Hak',           'Required for married individuals'),
  ('SKMHT', 4, 'Fotokopi Kartu Keluarga',                'Family Registry card'),
  ('SKMHT', 5, 'Fotokopi Surat Nikah',                   'Marriage certificate'),
  ('SKMHT', 6, 'Fotokopi PBB Tahun Berjalan',            'Latest property tax receipt'),
  ('SKMHT', 7, 'Fotokopi Perjanjian Kredit',             'Credit agreement from bank'),
  ('SKMHT', 8, 'Fotokopi KTP Pihak Bank',                'Bank officer representative ID'),
  ('SKMHT', 9, 'Fotokopi SK Pihak Bank',                 'Officer''s letter of appointment'),

-- HIBAH
  ('HIBAH',  1, 'Sertifikat Asli',                                  'Sertifikat asli tanah/bangunan'),
  ('HIBAH',  2, 'Fotokopi KTP Pemegang Hak',                        'Fotokopi KTP pemberi hibah'),
  ('HIBAH',  3, 'Fotokopi KTP Persetujuan Istri Pemegang Hak',      'Persetujuan istri pemberi hibah'),
  ('HIBAH',  4, 'Fotokopi Surat Nikah Pemegang Hak',                'Surat nikah pemberi hibah'),
  ('HIBAH',  5, 'Fotokopi KK Pemegang Hak',                         'Kartu Keluarga pemberi hibah'),
  ('HIBAH',  6, 'Fotokopi KTP Persetujuan Seluruh Anak',            'Fotokopi KTP persetujuan seluruh anak kandung'),
  ('HIBAH',  7, 'Fotokopi KK Persetujuan Seluruh Anak',             'Kartu Keluarga persetujuan anak'),
  ('HIBAH',  8, 'Fotokopi Akta Kelahiran Seluruh Anak',             'Akta kelahiran anak kandung'),
  ('HIBAH',  9, 'Surat Keterangan Anak dari Desa',                  'Surat keterangan anak/silsilah waris'),
  ('HIBAH', 10, 'Fotokopi KTP Penerima Hibah',                      'Fotokopi KTP penerima hibah'),
  ('HIBAH', 11, 'Fotokopi KK Penerima Hibah',                       'Kartu Keluarga penerima hibah'),
  ('HIBAH', 12, 'Fotokopi Akta Kelahiran Penerima Hibah',           'Akta kelahiran penerima hibah'),
  ('HIBAH', 13, 'Nomor Telepon dan Email Penerima Hibah',           'Kontak penerima hibah'),
  ('HIBAH', 14, 'Fotokopi PBB Tahun Berjalan',                      'PBB tahun berjalan pemberi hibah'),
  ('HIBAH', 15, 'Share Lokasi Tanah',                               'Share lokasi tanah/objek hibah'),
  ('HIBAH', 16, 'Foto Lokasi Tanah (GPS Maps Camera)',              'Foto objek hibah dari kamera GPS'),

-- APHB
  ('APHB',  1, 'Sertifikat Asli',                                          'Sertifikat tanah asli HM/HGB/HP'),
  ('APHB',  2, 'Surat Keterangan Ahli Waris Asli',                         'Surat keterangan ahli waris asli'),
  ('APHB',  3, 'Fotokopi Legalisir Kepala Desa untuk surat keterangan ahli waris', 'Fotokopi legalisir Kades'),
  ('APHB',  4, 'Fotokopi Surat/Akta Kematian',                             'Fotokopi surat/akta kematian pewaris'),
  ('APHB',  5, 'Surat Nikah atau Surat Keterangan Nikah dari desa (alm)',  'Surat nikah alm'),
  ('APHB',  6, 'Surat Keterangan Anak dari Desa',                          'Surat keterangan anak/silsilah waris'),
  ('APHB',  7, 'Fotokopi KTP Seluruh Ahli Waris',                          'KTP seluruh ahli waris'),
  ('APHB',  8, 'Fotokopi KK Seluruh Ahli Waris',                           'KK seluruh ahli waris'),
  ('APHB',  9, 'Nomor Telepon dan Email Penerima APHB',                    'Kontak penerima APHB'),
  ('APHB', 10, 'Fotokopi PBB Tahun Berjalan',                              'Fotokopi PBB tahun berjalan'),
  ('APHB', 11, 'Share Lokasi Tanah',                                       'Share lokasi tanah/objek APHB'),
  ('APHB', 12, 'Foto Lokasi Tanah (GPS Maps Camera)',                      'Foto objek APHB dari kamera GPS'),

-- APHT
  ('APHT',  1, 'Sertifikat Asli',                'Sertifikat tanah asli HM/HGB/HP'),
  ('APHT',  2, 'KTP Pemegang Hak',               'Valid E-KTP photocopy or scan of owner'),
  ('APHT',  3, 'KTP Persetujuan Pemegang Hak',   'Required for married individuals'),
  ('APHT',  4, 'Fotokopi KK',                    'Family Registry card'),
  ('APHT',  5, 'Fotokopi Surat Nikah',            'Marriage certificate'),
  ('APHT',  6, 'Fotokopi PBB Tahun Berjalan',    'Latest property tax receipt'),
  ('APHT',  7, 'Fotokopi Perjanjian Kredit',     'Credit agreement from bank'),
  ('APHT',  8, 'Fotokopi KTP Pihak Bank',        'Bank officer representative ID'),
  ('APHT',  9, 'Fotokopi SK Pihak Bank',         'Officer''s letter of appointment'),
  ('APHT', 10, 'Kode Bank',                      'Unique bank code identifier'),

-- WARIS
  ('WARIS',  1, 'Sertifikat Asli',                                         'Sertifikat tanah asli HM/HGB/HP'),
  ('WARIS',  2, 'Surat Keterangan Ahli Waris Asli',                        'Surat keterangan ahli waris asli'),
  ('WARIS',  3, 'Fotokopi Legalisir Kepala Desa untuk surat ahli waris',   'Fotokopi legalisir Kades'),
  ('WARIS',  4, 'Fotokopi Surat/Akta Kematian',                            'Fotokopi surat/akta kematian pewaris'),
  ('WARIS',  5, 'Surat Nikah atau Surat Keterangan Nikah dari desa (alm)', 'Surat nikah alm'),
  ('WARIS',  6, 'Surat Keterangan Anak dari Desa',                         'Surat keterangan anak/silsilah waris'),
  ('WARIS',  7, 'Fotokopi KTP Seluruh Ahli Waris',                         'KTP seluruh ahli waris'),
  ('WARIS',  8, 'Surat Pernyataan Pembagian Hak Waris',                    'Surat pernyataan pembagian hak waris'),
  ('WARIS',  9, 'Fotokopi KK Seluruh Ahli Waris',                          'KK seluruh ahli waris'),
  ('WARIS', 10, 'Nomor Telepon dan Email Salah Satu Ahli Waris',           'Kontak salah satu ahli waris'),
  ('WARIS', 11, 'Fotokopi PBB Tahun Berjalan',                             'Fotokopi PBB tahun berjalan'),
  ('WARIS', 12, 'Share Lokasi Tanah',                                      'Share lokasi tanah/objek waris'),
  ('WARIS', 13, 'Foto Lokasi Tanah (GPS Maps Camera)',                     'Foto objek waris dari kamera GPS'),

-- ROYA
  ('ROYA', 1, 'Sertifikat Asli',                  'Sertifikat tanah asli HM/HGB/HP'),
  ('ROYA', 2, 'Fotokopi KTP Pemegang Hak',        'Fotokopi KTP pemegang hak'),
  ('ROYA', 3, 'Fotokopi KK Pemegang Hak',         'Fotokopi KK pemegang hak'),
  ('ROYA', 4, 'Surat Roya Asli dari Bank',        'Surat roya asli dari bank kreditur'),
  ('ROYA', 5, 'Sertifikat Hak Tanggungan Asli',   'Sertifikat Hak Tanggungan asli'),
  ('ROYA', 6, 'Share Lokasi Tanah',               'Share lokasi tanah/objek roya'),
  ('ROYA', 7, 'Foto Lokasi Tanah (GPS Maps Camera)', 'Foto objek roya dari kamera GPS'),

-- PECAH
  ('PECAH', 1, 'Sertifikat Asli',                     'Sertifikat asli (HM/HGB/HP) dari BPN'),
  ('PECAH', 2, 'Fotokopi KTP Pemegang Hak',            'Fotokopi KTP pemegang hak milik'),
  ('PECAH', 3, 'Fotokopi KK Pemegang Hak',             'Fotokopi Kartu Keluarga pemegang hak milik'),
  ('PECAH', 4, 'Fotokopi PBB Tahun Berjalan',          'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),
  ('PECAH', 5, 'Share Lokasi Tanah',                   'Titik koordinat share lokasi tanah objek pemecahan'),
  ('PECAH', 6, 'Foto Lokasi Tanah (GPS Maps Camera)', 'Foto lokasi tanah fisik menggunakan kamera GPS Maps'),

-- GANTI
  ('GANTI', 1, 'Sertifikat Asli',                     'Sertifikat asli (HM/HGB/HP) dari BPN'),
  ('GANTI', 2, 'Fotokopi KTP Pemegang Hak',            'Fotokopi KTP pemegang hak milik'),
  ('GANTI', 3, 'Fotokopi KK Pemegang Hak',             'Fotokopi Kartu Keluarga pemegang hak milik'),
  ('GANTI', 4, 'Fotokopi PBB Tahun Berjalan',          'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),
  ('GANTI', 5, 'Share Lokasi Tanah',                   'Titik koordinat share lokasi tanah objek pengganti'),
  ('GANTI', 6, 'Foto Lokasi Tanah (GPS Maps Camera)', 'Foto lokasi tanah fisik menggunakan kamera GPS Maps'),

-- KONVERSI
  ('KONVERSI',  1, 'Fotokopi Legalisir Letter C Desa',                      'Fotokopi Letter C desa dilegalisir'),
  ('KONVERSI',  2, 'Fotokopi KTP Pemegang Hak',                             'Fotokopi KTP pemegang hak milik'),
  ('KONVERSI',  3, 'Fotokopi KK Pemegang Hak',                              'Fotokopi Kartu Keluarga pemegang hak milik'),
  ('KONVERSI',  4, 'Fotokopi PBB Tahun Berjalan',                           'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),
  ('KONVERSI',  5, 'Share Lokasi Tanah',                                    'Titik koordinat share lokasi tanah objek'),
  ('KONVERSI',  6, 'Foto Lokasi Tanah (GPS Maps Camera)',                  'Foto lokasi tanah fisik menggunakan kamera GPS Maps'),
  ('KONVERSI',  7, 'Blangko Konversi',                                      'Formulir blangko konversi resmi'),
  ('KONVERSI',  8, 'Fotokopi KTP Carik/Lurah/Polo',                        'Fotokopi KTP pejabat desa Carik/Lurah/Polo'),
  ('KONVERSI',  9, 'Surat Keterangan Riwayat Tanah',                       'Surat keterangan riwayat kepemilikan tanah asli'),
  ('KONVERSI', 10, 'Fotokopi Bukti Perolehan Hak Letter C Sejak Tahun 1960','Fotokopi bukti perolehan hak Letter C runut sejak 1960'),

-- FIDUSIA
  ('FIDUSIA',  1, 'Fotokopi BPKB Kendaraan Bermotor',        'Fotokopi Bukti Pemilik Kendaraan Bermotor'),
  ('FIDUSIA',  2, 'Fotokopi STNK Kendaraan Bermotor',        'Fotokopi Surat Tanda Nomor Kendaraan'),
  ('FIDUSIA',  3, 'KTP Debitur',                             'Kartu Tanda Penduduk pihak Debitur'),
  ('FIDUSIA',  4, 'KTP Persetujuan Debitur',                 'Fotokopi KTP penjamin persetujuan debitur'),
  ('FIDUSIA',  5, 'Fotokopi Kartu Keluarga',                 'Fotokopi Kartu Keluarga debitur'),
  ('FIDUSIA',  6, 'Fotokopi Surat Nikah',                    'Fotokopi Surat Nikah/Buku Nikah debitur'),
  ('FIDUSIA',  7, 'Fotokopi Perjanjian Kredit',              'Fotokopi Perjanjian Kredit pendukung'),
  ('FIDUSIA',  8, 'Fotokopi Kwitansi Pembelian Kendaraan',   'Diperlukan apabila BPKB + STNK bukan atas nama debitur'),
  ('FIDUSIA',  9, 'Surat Pernyataan Kepemilikan Jaminan',    'Diperlukan apabila BPKB + STNK bukan atas nama debitur'),
  ('FIDUSIA', 10, 'Fotokopi KTP Pihak Bank',                 'ID perwakilan pejabat bank'),
  ('FIDUSIA', 11, 'Fotokopi SK Pihak Bank',                  'Surat Keputusan perwakilan pejabat bank'),

-- APJB / APPJB
  ('APJB',  1, 'Sertifikat Asli',                    'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('APJB',  2, 'KTP AN. Pemegang Hak',               'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('APJB',  3, 'KTP Persetujuan Pemegang Hak',       'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('APJB',  4, 'Fotokopi Kartu Keluarga',            'Fotokopi Kartu Keluarga pemegang hak'),
  ('APJB',  5, 'Fotokopi Surat Nikah',               'Fotokopi Surat Nikah pemegang hak'),
  ('APJB',  6, 'Fotokopi PBB Tahun Berjalan',        'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),
  ('APJB',  7, 'Fotokopi KTP Pembeli',               'Fotokopi Kartu Tanda Penduduk pihak pembeli'),
  ('APJB',  8, 'Fotokopi Kartu Keluarga Pembeli',    'Fotokopi Kartu Keluarga pihak pembeli'),
  ('APJB',  9, 'Nomor Telepon + Email Pembeli',      'Nomor telepon dan email aktif pembeli'),
  ('APJB', 10, 'Share Lokasi Tanah',                 'Titik koordinat share lokasi tanah objek'),
  ('APJB', 11, 'Foto Lokasi',                        'Foto fisik lokasi tanah objek'),

  ('APPJB',  1, 'Sertifikat Asli',                    'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('APPJB',  2, 'KTP AN. Pemegang Hak',               'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('APPJB',  3, 'KTP Persetujuan Pemegang Hak',       'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('APPJB',  4, 'Fotokopi Kartu Keluarga',            'Fotokopi Kartu Keluarga pemegang hak'),
  ('APPJB',  5, 'Fotokopi Surat Nikah',               'Fotokopi Surat Nikah pemegang hak'),
  ('APPJB',  6, 'Fotokopi PBB Tahun Berjalan',        'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),
  ('APPJB',  7, 'Fotokopi KTP Pembeli',               'Fotokopi Kartu Tanda Penduduk pihak pembeli'),
  ('APPJB',  8, 'Fotokopi Kartu Keluarga Pembeli',    'Fotokopi Kartu Keluarga pihak pembeli'),
  ('APPJB',  9, 'Nomor Telepon + Email Pembeli',      'Nomor telepon dan email aktif pembeli'),
  ('APPJB', 10, 'Share Lokasi Tanah',                 'Titik koordinat share lokasi tanah objek'),
  ('APPJB', 11, 'Foto Lokasi',                        'Foto fisik lokasi tanah objek'),

-- SKUM / APK
  ('SKUM', 1, 'Sertifikat Asli',                  'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('SKUM', 2, 'KTP AN. Pemegang Hak',             'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('SKUM', 3, 'KTP Persetujuan Pemegang Hak',     'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('SKUM', 4, 'Fotokopi Kartu Keluarga',          'Fotokopi Kartu Keluarga pemegang hak'),

  ('APK', 1, 'Sertifikat Asli',                   'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('APK', 2, 'KTP AN. Pemegang Hak',              'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('APK', 3, 'KTP Persetujuan Pemegang Hak',      'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('APK', 4, 'Fotokopi Kartu Keluarga',           'Fotokopi Kartu Keluarga pemegang hak'),

-- SEWA
  ('SEWA', 1, 'Sertifikat Asli',                  'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('SEWA', 2, 'KTP AN. Pemegang Hak',             'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('SEWA', 3, 'KTP Persetujuan Pemegang Hak',     'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('SEWA', 4, 'Fotokopi Kartu Keluarga',          'Fotokopi Kartu Keluarga pemegang hak'),
  ('SEWA', 5, 'Fotokopi Surat Nikah',             'Fotokopi Surat Nikah pemegang hak'),
  ('SEWA', 6, 'Fotokopi KTP Pihak Penyewa',       'Fotokopi Kartu Tanda Penduduk pihak penyewa'),
  ('SEWA', 7, 'Fotokopi Kartu Keluarga Penyewa',  'Fotokopi Kartu Keluarga pihak penyewa'),
  ('SEWA', 8, 'Fotokopi PBB Tahun Berjalan',      'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),

-- CONSEN
  ('CONSEN',  1, 'Sertifikat Asli',                                         'Sertifikat tanah asli (HM/HGB) dari BPN'),
  ('CONSEN',  2, 'KTP AN. Pemegang Hak',                                    'Kartu Tanda Penduduk atas nama pemegang hak'),
  ('CONSEN',  3, 'KTP Persetujuan Pemegang Hak',                            'Fotokopi KTP persetujuan suami/istri pemegang hak'),
  ('CONSEN',  4, 'Fotokopi Kartu Keluarga',                                 'Fotokopi Kartu Keluarga pemegang hak'),
  ('CONSEN',  5, 'Fotokopi Surat Nikah',                                    'Fotokopi Surat Nikah pemegang hak'),
  ('CONSEN',  6, 'Surat Keterangan Lunas dari Bank',                        'Surat keterangan lunas pelunasan pinjaman asli'),
  ('CONSEN',  7, 'Surat Kehilangan dari Desa',                              'Surat keterangan kehilangan resmi dari desa'),
  ('CONSEN',  8, 'Surat Kehilangan dari Polres Sesuai Domisili Obyek',     'Surat keterangan kehilangan dari Polres'),
  ('CONSEN',  9, 'Pengantar Roya dari Bank',                                'Surat pengantar roya resmi asli dari bank'),
  ('CONSEN', 10, 'Fotokopi PBB Tahun Berjalan',                            'Fotokopi Pajak Bumi dan Bangunan tahun berjalan'),

-- YAYASAN
  ('YAYASAN', 1, 'Fotokopi KTP Seluruh Anggota',                               'Fotokopi KTP pendiri, pembina, pengurus, dan pengawas'),
  ('YAYASAN', 2, 'Fotokopi Kartu Keluarga Seluruh Anggota',                    'Fotokopi KK seluruh pendiri/pengurus'),
  ('YAYASAN', 3, 'Susunan/Daftar Pengurus',                                    'Susunan Pengurus lengkap'),
  ('YAYASAN', 4, 'Surat Keterangan Domisili (dibuat setelah akta jadi)',       'Surat keterangan domisili dari kelurahan'),
  ('YAYASAN', 5, 'Fotokopi NPWP Pribadi Masing-Masing Pengurus',              'Fotokopi NPWP pengurus aktif'),
  ('YAYASAN', 6, 'Bidang Kegiatan Yayasan',                                    'Penjelasan bidang kegiatan yayasan'),
  ('YAYASAN', 7, 'Nama Yayasan (minimal 3 kata, tidak boleh singkatan)',       'Pengecekan nama yayasan'),
  ('YAYASAN', 8, 'Fotokopi NPWP Yayasan',                                      'Fotokopi NPWP atas nama yayasan'),
  ('YAYASAN', 9, 'Fotokopi Buku Tabungan AN. Yayasan',                        'Fotokopi buku rekening bank atas nama yayasan'),

-- PT
  ('PT',  1, 'Fotokopi KTP Direktur, Komisaris, Pemegang Saham',                  'Fotokopi KTP pendiri/pengurus PT'),
  ('PT',  2, 'Fotokopi KK Direktur, Komisaris, Pemegang Saham',                   'Fotokopi KK pendiri/pengurus PT'),
  ('PT',  3, 'Fotokopi NPWP Direktur, Komisaris, Pemegang Saham',                 'Fotokopi NPWP pribadi pendiri/pengurus'),
  ('PT',  4, 'Nomor Telepon + Email Direktur, Komisaris, Pemegang Saham',         'Kontak aktif telepon dan email para pengurus'),
  ('PT',  5, 'Modal Awal',                                                         'Detail nominal modal dasar perseroan'),
  ('PT',  6, 'Modal yang Ditempatkan',                                             'Detail nominal modal ditempatkan dan disetor'),
  ('PT',  7, 'Jumlah Saham',                                                       'Jumlah total lembar saham perseroan'),
  ('PT',  8, 'Jumlah Saham yang Ditempatkan',                                      'Jumlah lembar saham disetor/ditempatkan'),
  ('PT',  9, 'Nama PT (minimal 3 kata)',                                            'Pengecekan nama PT'),
  ('PT', 10, 'Alamat Lengkap PT',                                                  'Alamat lengkap kedudukan dan kantor PT'),
  ('PT', 11, 'Kegiatan Usaha (sesuai KBLI 2021)',                                 'Kode bidang usaha sesuai KBLI 2021'),
  ('PT', 12, 'Fotokopi NPWP PT',                                                   'Fotokopi NPWP atas nama perseroan'),
  ('PT', 13, 'Fotokopi Bukti Setor Modal',                                         'Bukti penyetoran modal ke rekening PT'),
  ('PT', 14, 'Surat Keterangan Domisili dari Desa (setelah akta jadi)',           'Surat keterangan domisili PT'),

-- CV
  ('CV',  1, 'Fotokopi KTP Direktur, Komanditer',           'Fotokopi KTP pendiri/pengurus CV'),
  ('CV',  2, 'Fotokopi KK Direktur, Komanditer',            'Fotokopi KK pendiri/pengurus CV'),
  ('CV',  3, 'Fotokopi NPWP Direktur, Komanditer',          'Fotokopi NPWP pribadi pendiri/pengurus CV'),
  ('CV',  4, 'Nomor Telepon + Email CV',                    'Kontak aktif telepon dan email CV'),
  ('CV',  5, 'Alamat Lengkap',                              'Alamat lengkap kedudukan dan kantor CV'),
  ('CV',  6, 'Nama CV (minimal 3 kata)',                    'Pengecekan nama CV'),
  ('CV',  7, 'Modal Awal Usaha',                            'Detail nominal modal awal usaha CV'),
  ('CV',  8, 'Kontribusi Modal Masing-Masing Persero',      'Detail kontribusi modal masing-masing sekutu'),
  ('CV',  9, 'Kegiatan Usaha (sesuai KBLI 2021)',           'Klasifikasi Baku Lapangan Usaha Indonesia CV'),
  ('CV', 10, 'Surat Keterangan Domisili (setelah akta jadi)', 'Surat keterangan domisili CV'),
  ('CV', 11, 'Fotokopi NPWP CV',                           'Fotokopi NPWP atas nama CV'),

-- HT
  ('HT', 1, 'Sertifikat Tanah Asli',                    'Sertifikat asli (HM/HGB) dari BPN'),
  ('HT', 2, 'Surat Kuasa Membebankan Hak Tanggungan',   'SKMHT pendukung asli'),
  ('HT', 3, 'KTP Pemberi & Penerima Hak',               'Valid photocopy or scan of IDs'),
  ('HT', 4, 'Fotokopi Kartu Keluarga',                  'Family Registry card'),
  ('HT', 5, 'Perjanjian Kredit Asli & Salinan',         'Credit agreement from bank'),
  ('HT', 6, 'Bukti Validasi PBB',                       'Latest property tax receipt'),
  ('HT', 7, 'Surat Pernyataan Pemasangan APHT',         'Required statement form'),
  ('HT', 8, 'Dokumen Pendukung Lainnya',                'Other required attachments')
ON CONFLICT (service_type, order_num) DO NOTHING;

-- ============================================================
-- SELESAI! Semua tabel dan data berhasil dibuat.
-- ============================================================
SELECT 'Migration with Audit Trails completed successfully!' AS status;
