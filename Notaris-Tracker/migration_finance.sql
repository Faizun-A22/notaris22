-- ============================================================
-- MIGRATION: Keuangan & Status Pembayaran Berkas
-- Jalankan query ini di Supabase SQL Editor Anda
-- ============================================================

-- 1. Tambah kolom ke tabel cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Belum Lunas', 'DP', 'Lunas')) DEFAULT 'Belum Lunas';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS paid_amount BIGINT DEFAULT 0;

-- 2. Tambah kolom ke tabel cases_history
ALTER TABLE public.cases_history ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.cases_history ADD COLUMN IF NOT EXISTS paid_amount BIGINT;

-- 3. Update fungsi log_case_history() untuk menyertakan kolom baru
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
      assigned_staff_id, created_by_id, updated_by_id, change_type, old_data,
      payment_status, paid_amount
    ) VALUES (
      OLD.id, OLD.case_number, OLD.client_name, OLD.client_id, OLD.client_phone, OLD.client_email,
      OLD.category, OLD.service_type, OLD.status, OLD.current_stage_id, OLD.is_complete, OLD.documents_ready,
      OLD.notes, OLD.fees, OLD.property_location, OLD.bank_partner, OLD.entry_date, OLD.estimation_date,
      OLD.assigned_staff_id, OLD.created_by_id, current_user_id, 'DELETE', to_jsonb(OLD),
      OLD.payment_status, OLD.paid_amount
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.cases_history (
      case_id, case_number, client_name, client_id, client_phone, client_email,
      category, service_type, status, current_stage_id, is_complete, documents_ready,
      notes, fees, property_location, bank_partner, entry_date, estimation_date,
      assigned_staff_id, created_by_id, updated_by_id, change_type, old_data, new_data,
      payment_status, paid_amount
    ) VALUES (
      NEW.id, NEW.case_number, NEW.client_name, NEW.client_id, NEW.client_phone, NEW.client_email,
      NEW.category, NEW.service_type, NEW.status, NEW.current_stage_id, NEW.is_complete, NEW.documents_ready,
      NEW.notes, NEW.fees, NEW.property_location, NEW.bank_partner, NEW.entry_date, NEW.estimation_date,
      NEW.assigned_staff_id, NEW.created_by_id, current_user_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      NEW.payment_status, NEW.paid_amount
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.cases_history (
      case_id, case_number, client_name, client_id, client_phone, client_email,
      category, service_type, status, current_stage_id, is_complete, documents_ready,
      notes, fees, property_location, bank_partner, entry_date, estimation_date,
      assigned_staff_id, created_by_id, updated_by_id, change_type, new_data,
      payment_status, paid_amount
    ) VALUES (
      NEW.id, NEW.case_number, NEW.client_name, NEW.client_id, NEW.client_phone, NEW.client_email,
      NEW.category, NEW.service_type, NEW.status, NEW.current_stage_id, NEW.is_complete, NEW.documents_ready,
      NEW.notes, NEW.fees, NEW.property_location, NEW.bank_partner, NEW.entry_date, NEW.estimation_date,
      NEW.assigned_staff_id, NEW.created_by_id, current_user_id, 'INSERT', to_jsonb(NEW),
      NEW.payment_status, NEW.paid_amount
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update fungsi track_case() untuk menyertakan kolom client_name, fees, payment_status, paid_amount
CREATE OR REPLACE FUNCTION public.track_case(p_case_number TEXT)
RETURNS TABLE (
  id UUID,
  case_number TEXT,
  client_name TEXT,
  category TEXT,
  service_type TEXT,
  status TEXT,
  current_stage_id INTEGER,
  is_complete BOOLEAN,
  documents_ready BOOLEAN,
  entry_date DATE,
  estimation_date DATE,
  fees BIGINT,
  payment_status TEXT,
  paid_amount BIGINT,
  checklist JSONB,
  logs JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.case_number,
    c.client_name,
    c.category,
    c.service_type,
    c.status,
    c.current_stage_id,
    c.is_complete,
    c.documents_ready,
    c.entry_date,
    c.estimation_date,
    c.fees,
    c.payment_status,
    c.paid_amount,
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

SELECT 'Migration completed successfully!' AS status;
