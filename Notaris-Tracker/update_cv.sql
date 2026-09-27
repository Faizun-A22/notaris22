-- ============================================================
-- UPDATE CV: Nama Layanan & Checklist Template
-- Jalankan query ini jika database sudah pernah dimigrasikan
-- sebelum perubahan ini diterapkan.
-- ============================================================

-- 1. Update nama layanan CV di tabel services
UPDATE services
SET 
  name = 'Akta Pendirian/Perubahan CV',
  description = 'Akta pendirian atau perubahan Commanditaire Vennootschap dengan pendaftaran Kemenkumham.'
WHERE id = 'CV';

-- 2. Verifikasi perubahan
SELECT id, name, category FROM services WHERE id = 'CV';

-- ============================================================
-- Catatan: Checklist template CV sudah benar (11 item):
-- 1. Fotokopi KTP Direktur, Komanditer
-- 2. Fotokopi Kartu Keluarga Direktur, Komanditer
-- 3. Fotokopi NPWP Direktur, Komanditer
-- 4. Nomor Telepon + Email CV
-- 5. Alamat Lengkap
-- 6. Nama CV (minimal 3 kata)
-- 7. Modal Awal Usaha
-- 8. Kontribusi Modal Masing-Masing Persero
-- 9. Kegiatan Usaha (sesuai KBLI 2021)
-- 10. Surat Keterangan Domisili (setelah akta jadi)
-- 11. Fotokopi NPWP CV
--
-- Proses tracking CV (8 tahap) sudah benar:
-- 1. Pengecekkan Kelengkapan Berkas
-- 2. Daftar Nama CV pada AHU
-- 3. Pengetikkan Akta
-- 4. Tanda Tangan Akta
-- 5. Penomoran Akta
-- 6. Pendaftaran ke Kemenkumham
-- 7. Penerbitan SKT Kemenkumham
-- 8. Penyerahan Akta ke Pemohon
-- ============================================================

SELECT 'CV update completed!' AS status;
