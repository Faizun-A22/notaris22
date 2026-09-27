import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useCases } from '../../hooks/useCases';
import { formatDate } from '../../utils/formatDate';
import { uploadDocumentFile } from '../../lib/storage';

const formatNumberWithDots = (num) => {
  if (num === undefined || num === null || num === '') return '';
  const clean = String(num).replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
};

const parseDotsToNumber = (str) => {
  if (!str) return 0;
  
  let clean = String(str).toLowerCase().trim();
  
  let multiplier = 1;
  if (clean.includes('jt') || clean.includes('juta')) {
    multiplier = 1000000;
    clean = clean.replace(/jt|juta/g, '').trim();
  } else if (clean.includes('m') || clean.includes('miliar') || clean.includes('milyar')) {
    multiplier = 1000000000;
    clean = clean.replace(/miliar|milyar|m/g, '').trim();
  } else if (clean.includes('rb') || clean.includes('ribu')) {
    multiplier = 1000;
    clean = clean.replace(/rb|ribu/g, '').trim();
  }
  
  clean = clean.replace(/,/g, '.');
  
  const dotCount = (clean.match(/\./g) || []).length;
  if (dotCount > 1) {
    clean = clean.replace(/\./g, '');
  } else if (dotCount === 1) {
    const parts = clean.split('.');
    if (multiplier === 1) {
      if (parts[1].length === 3) {
        clean = clean.replace(/\./g, '');
      }
    }
  }
  
  clean = clean.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean) || 0;
  return Math.round(parsed * multiplier);
};

const CurrencyInput = ({ id, value, onChange, className, placeholder, required = false }) => {
  const [tempValue, setTempValue] = useState(formatNumberWithDots(value));

  useEffect(() => {
    setTempValue(formatNumberWithDots(value));
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setTempValue('');
      onChange(0);
      return;
    }
    const numVal = parseInt(rawVal, 10);
    setTempValue(numVal.toLocaleString('id-ID'));
    onChange(numVal);
  };

  return (
    <input
      id={id}
      type="text"
      required={required}
      value={tempValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
};

export const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, updateCase, updateCaseStatus, updateCaseStage } = useCases();

  const isImageFile = (url, name) => {
    if (!url) return false;
    if (url.startsWith('blob:')) {
      const ext = name?.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    }
    const ext = url.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  // Find the current case
  const activeCase = cases.find((c) => c.id === id);

  // States for modals
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!selectedDocForUpload) {
      setUploadFile(null);
    }
  }, [selectedDocForUpload]);
  
  // Share link states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNum, setPhoneNum] = useState('');

  // Edit remarks state
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  // Update remarks when activeCase loads
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editFees, setEditFees] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editEstimationDate, setEditEstimationDate] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Belum Lunas');
  const [editPaidAmount, setEditPaidAmount] = useState(0);

  useEffect(() => {
    if (activeCase) {
      setRemarksText(activeCase.notes || '');
      setEditNotes(activeCase.notes || '');
      setEditFees(activeCase.fees || '');
      setEditLocation(activeCase.propertyLocation || '');
      setEditBank(activeCase.bankPartner || '');
      setEditEstimationDate(activeCase.estimationDate || '');
      setEditPaymentStatus(activeCase.paymentStatus || 'Belum Lunas');
      setEditPaidAmount(activeCase.paidAmount || 0);
    }
  }, [activeCase]);

  const handlePublishDraft = async () => {
    try {
      await updateCase(activeCase.id, { isDraft: false });
      toast.success('Berkas berhasil diterbitkan dari draf!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menerbitkan berkas.');
    }
  };

  const handleSaveDetails = async () => {
    try {
      await updateCase(activeCase.id, {
        notes: editNotes,
        fees: Number(editFees) || 0,
        propertyLocation: editLocation,
        bankPartner: editBank,
        estimationDate: editEstimationDate,
        paymentStatus: editPaymentStatus,
        paidAmount: Number(editPaidAmount) || 0
      });
      setShowEditDetailsModal(false);
      toast.success('Detail berkas berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui detail berkas!');
    }
  };

  if (!activeCase) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center text-left">
        <span className="material-symbols-outlined text-[64px] text-error mb-4">folder_off</span>
        <h2 className="text-headline-md font-bold text-on-surface">Berkas Tidak Ditemukan</h2>
        <p className="text-body-lg text-on-surface-variant mt-2">
          Maaf, berkas dengan ID "{id}" tidak dapat ditemukan dalam sistem.
        </p>
        <button
          onClick={() => navigate('/staff/dashboard')}
          className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-bold hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Dasbor
        </button>
      </div>
    );
  }

  // Fallbacks for default checklists
  const getSKMHTChecklistFallback = () => {
    return [
      { id: 1, name: 'SERTIFIKAT ASLI', desc: 'Must be physical original document', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP AN. PEMEGANG HAK', desc: 'Valid E-KTP photocopy or scan', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP PERSETUJUAN PEMEGANG HAK', desc: 'Required for married individuals', status: 'Belum Ada' },
      { id: 4, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Family Registry card', status: 'Sudah Diterima' },
      { id: 5, name: 'FOTOKOPI SURAT NIKAH', desc: 'Marriage certificate', status: 'Perlu Verifikasi' },
      { id: 6, name: 'FOTOKOPI PBB TAHUN BERJALAN', desc: 'Latest property tax receipt', status: 'Sudah Diterima' },
      { id: 7, name: 'FOTOKOPI PERJANJIAN KREDIT', desc: 'Credit agreement from bank', status: 'Sudah Diterima' },
      { id: 8, name: 'FOTOKOPI KTP PIHAK BANK', desc: 'Bank officer representative ID', status: 'Belum Ada' },
      { id: 9, name: 'FOTOKOPI SK PIHAK BANK', desc: 'Officer\'s letter of appointment', status: 'Belum Ada' },
    ];
  };

  const getAJBChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat asli (HM/HGB/HP) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Valid E-KTP photocopy or scan of seller', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KTP Persetujuan Pemegang Hak', desc: 'Required for married individuals', status: 'Belum Ada' },
      { id: 4, name: 'Fotokopi Surat Nikah Pemegang Hak', desc: 'Marriage certificate of seller', status: 'Sudah Diterima' },
      { id: 5, name: 'Fotokopi KK Pemegang Hak', desc: 'Family Registry card of seller', status: 'Sudah Diterima' },
      { id: 6, name: 'Fotokopi KTP Pembeli', desc: 'Valid E-KTP photocopy or scan of buyer', status: 'Perlu Verifikasi' },
      { id: 7, name: 'Fotokopi KK Pembeli', desc: 'Family Registry card of buyer', status: 'Sudah Diterima' },
      { id: 8, name: 'Nomor Telepon dan Email Pembeli', desc: 'Contact details of buyer', status: 'Sudah Diterima' },
      { id: 9, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Latest property tax receipt', status: 'Belum Ada' },
      { id: 10, name: 'Share Lokasi Tanah', desc: 'Location coordinates or map link', status: 'Sudah Diterima' },
      { id: 11, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Physical photo with coordinate stamp', status: 'Belum Ada' },
    ];
  };

  const getHIBAHChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat asli tanah/bangunan', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Fotokopi KTP pemberi hibah', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KTP Persetujuan Istri Pemegang Hak', desc: 'Persetujuan istri pemberi hibah', status: 'Belum Ada' },
      { id: 4, name: 'Fotokopi Surat Nikah Pemegang Hak', desc: 'Surat nikah pemberi hibah', status: 'Sudah Diterima' },
      { id: 5, name: 'Fotokopi KK Pemegang Hak', desc: 'Kartu Keluarga pemberi hibah', status: 'Sudah Diterima' },
      { id: 6, name: 'Fotokopi KTP Persetujuan Seluruh Anak', desc: 'Fotokopi KTP persetujuan seluruh anak kandung', status: 'Belum Ada' },
      { id: 7, name: 'Fotokopi KK Persetujuan Seluruh Anak', desc: 'Kartu Keluarga persetujuan anak', status: 'Belum Ada' },
      { id: 8, name: 'Fotokopi Akta Kelahiran Seluruh Anak', desc: 'Akta kelahiran anak kandung', status: 'Belum Ada' },
      { id: 9, name: 'Surat Keterangan Anak dari Desa', desc: 'Surat keterangan anak/silsilah waris', status: 'Belum Ada' },
      { id: 10, name: 'Fotokopi KTP Penerima Hibah', desc: 'Fotokopi KTP penerima hibah', status: 'Belum Ada' },
      { id: 11, name: 'Fotokopi KK Penerima Hibah', desc: 'Kartu Keluarga penerima hibah', status: 'Belum Ada' },
      { id: 12, name: 'Fotokopi Akta Kelahiran Penerima Hibah', desc: 'Akta kelahiran penerima hibah', status: 'Belum Ada' },
      { id: 13, name: 'Nomor Telepon dan Email Penerima Hibah', desc: 'Kontak penerima hibah', status: 'Sudah Diterima' },
      { id: 14, name: 'Fotokopi PBB Tahun Berjalan', desc: 'PBB tahun berjalan pemberi hibah', status: 'Belum Ada' },
      { id: 15, name: 'Share Lokasi Tanah', desc: 'Share lokasi tanah/objek hibah', status: 'Sudah Diterima' },
      { id: 16, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto objek hibah dari kamera GPS', status: 'Belum Ada' }
    ];
  };

  const getAPHBChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat tanah asli HM/HGB/HP', status: 'Sudah Diterima' },
      { id: 2, name: 'Surat Keterangan Ahli Waris Asli', desc: 'Surat keterangan ahli waris asli', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi Legalisir Kepala Desa untuk surat keterangan ahli waris', desc: 'Fotokopi legalisir Kades untuk surat keterangan ahli waris', status: 'Belum Ada' },
      { id: 4, name: 'Fotokopi Surat/Akta Kematian', desc: 'Fotokopi surat/akta kematian pewaris', status: 'Sudah Diterima' },
      { id: 5, name: 'Surat Nikah atau Surat Keterangan Nikah dari desa (alm)', desc: 'Surat nikah alm atau surat keterangan nikah desa', status: 'Sudah Diterima' },
      { id: 6, name: 'Surat Keterangan Anak dari Desa', desc: 'Surat keterangan anak/silsilah waris', status: 'Belum Ada' },
      { id: 7, name: 'Fotokopi KTP Seluruh Ahli Waris', desc: 'KTP seluruh ahli waris', status: 'Belum Ada' },
      { id: 8, name: 'Fotokopi KK Seluruh Ahli Waris', desc: 'KK seluruh ahli waris', status: 'Belum Ada' },
      { id: 9, name: 'Nomor Telepon dan Email Penerima APHB', desc: 'Kontak penerima APHB', status: 'Sudah Diterima' },
      { id: 10, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Fotokopi PBB tahun berjalan', status: 'Belum Ada' },
      { id: 11, name: 'Share Lokasi Tanah', desc: 'Share lokasi tanah/objek APHB', status: 'Sudah Diterima' },
      { id: 12, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto objek APHB dari kamera GPS', status: 'Belum Ada' }
    ];
  };

  const getAPHTChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat tanah asli HM/HGB/HP', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP Pemegang Hak', desc: 'Valid E-KTP photocopy or scan of owner', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP Persetujuan Pemegang Hak', desc: 'Required for married individuals', status: 'Belum Ada' },
      { id: 4, name: 'Fotokopi KK', desc: 'Family Registry card', status: 'Sudah Diterima' },
      { id: 5, name: 'Fotokopi Surat Nikah', desc: 'Marriage certificate', status: 'Sudah Diterima' },
      { id: 6, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Latest property tax receipt', status: 'Belum Ada' },
      { id: 7, name: 'Fotokopi Perjanjian Kredit', desc: 'Credit agreement from bank', status: 'Sudah Diterima' },
      { id: 8, name: 'Fotokopi KTP Pihak Bank', desc: 'Bank officer representative ID', status: 'Belum Ada' },
      { id: 9, name: 'Fotokopi SK Pihak Bank', desc: 'Officer\'s letter of appointment', status: 'Belum Ada' },
      { id: 10, name: 'Kode Bank', desc: 'Unique bank code identifier', status: 'Sudah Diterima' }
    ];
  };

  const getWARISChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat tanah asli HM/HGB/HP', status: 'Sudah Diterima' },
      { id: 2, name: 'Surat Keterangan Ahli Waris Asli', desc: 'Surat keterangan ahli waris asli', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi Legalisir Kepala Desa untuk surat ahli waris', desc: 'Fotokopi legalisir Kades untuk surat keterangan ahli waris', status: 'Belum Ada' },
      { id: 4, name: 'Fotokopi Surat/Akta Kematian', desc: 'Fotokopi surat/akta kematian pewaris', status: 'Sudah Diterima' },
      { id: 5, name: 'Surat Nikah atau Surat Keterangan Nikah dari desa (alm)', desc: 'Surat nikah alm atau surat keterangan nikah desa', status: 'Sudah Diterima' },
      { id: 6, name: 'Surat Keterangan Anak dari Desa', desc: 'Surat keterangan anak/silsilah waris', status: 'Belum Ada' },
      { id: 7, name: 'Fotokopi KTP Seluruh Ahli Waris', desc: 'KTP seluruh ahli waris', status: 'Belum Ada' },
      { id: 8, name: 'Surat Pernyataan Pembagian Hak Waris', desc: 'Surat pernyataan pembagian hak waris ahli waris', status: 'Belum Ada' },
      { id: 9, name: 'Fotokopi KK Seluruh Ahli Waris', desc: 'KK seluruh ahli waris', status: 'Belum Ada' },
      { id: 10, name: 'Nomor Telepon dan Email Salah Satu Ahli Waris', desc: 'Kontak salah satu ahli waris', status: 'Sudah Diterima' },
      { id: 11, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Fotokopi PBB tahun berjalan', status: 'Belum Ada' },
      { id: 12, name: 'Share Lokasi Tanah', desc: 'Share lokasi tanah/objek waris', status: 'Sudah Diterima' },
      { id: 13, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto objek waris dari kamera GPS', status: 'Belum Ada' }
    ];
  };

  const getROYAChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat tanah asli HM/HGB/HP', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Fotokopi KTP pemegang hak', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KK Pemegang Hak', desc: 'Fotokopi KK pemegang hak', status: 'Sudah Diterima' },
      { id: 4, name: 'Surat Roya Asli dari Bank', desc: 'Surat roya asli dari bank kreditur', status: 'Sudah Diterima' },
      { id: 5, name: 'Sertifikat Hak Tanggungan Asli', desc: 'Sertifikat Hak Tanggungan asli', status: 'Sudah Diterima' },
      { id: 6, name: 'Share Lokasi Tanah', desc: 'Share lokasi tanah/objek roya', status: 'Sudah Diterima' },
      { id: 7, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto objek roya dari kamera GPS', status: 'Belum Ada' }
    ];
  };

  const getPECAHChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat asli (HM/HGB/HP) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Fotokopi KTP pemegang hak milik', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KK Pemegang Hak', desc: 'Fotokopi Kartu Keluarga pemegang hak milik', status: 'Sudah Diterima' },
      { id: 4, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' },
      { id: 5, name: 'Share Lokasi Tanah', desc: 'Titik koordinat share lokasi tanah objek pemecahan', status: 'Sudah Diterima' },
      { id: 6, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto lokasi tanah fisik menggunakan kamera GPS Maps', status: 'Belum Ada' }
    ];
  };

  const getGANTIChecklistFallback = () => {
    return [
      { id: 1, name: 'Sertifikat Asli', desc: 'Sertifikat asli (HM/HGB/HP) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Fotokopi KTP pemegang hak milik', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KK Pemegang Hak', desc: 'Fotokopi Kartu Keluarga pemegang hak milik', status: 'Sudah Diterima' },
      { id: 4, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' },
      { id: 5, name: 'Share Lokasi Tanah', desc: 'Titik koordinat share lokasi tanah objek pengganti', status: 'Sudah Diterima' },
      { id: 6, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto lokasi tanah fisik menggunakan kamera GPS Maps', status: 'Belum Ada' }
    ];
  };

  const getKONVERSIChecklistFallback = () => {
    return [
      { id: 1, name: 'Fotokopi Legalisir Letter C Desa', desc: 'Fotokopi Letter C desa dilegalisir', status: 'Sudah Diterima' },
      { id: 2, name: 'Fotokopi KTP Pemegang Hak', desc: 'Fotokopi KTP pemegang hak milik', status: 'Sudah Diterima' },
      { id: 3, name: 'Fotokopi KK Pemegang Hak', desc: 'Fotokopi Kartu Keluarga pemegang hak milik', status: 'Sudah Diterima' },
      { id: 4, name: 'Fotokopi PBB Tahun Berjalan', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' },
      { id: 5, name: 'Share Lokasi Tanah', desc: 'Titik koordinat share lokasi tanah objek', status: 'Sudah Diterima' },
      { id: 6, name: 'Foto Lokasi Tanah (GPS Maps Camera)', desc: 'Foto lokasi tanah fisik menggunakan kamera GPS Maps', status: 'Belum Ada' },
      { id: 7, name: 'Blangko Konversi', desc: 'Formulir blangko konversi resmi', status: 'Sudah Diterima' },
      { id: 8, name: 'Fotokopi KTP Carik/Lurah/Polo', desc: 'Fotokopi KTP pejabat desa Carik/Lurah/Polo', status: 'Belum Ada' },
      { id: 9, name: 'Surat Keterangan Riwayat Tanah', desc: 'Surat keterangan riwayat kepemilikan tanah asli', status: 'Belum Ada' },
      { id: 10, name: 'Fotokopi Bukti Perolehan Hak Letter C Sejak Tahun 1960', desc: 'Fotokopi bukti perolehan hak Letter C runut sejak tahun 1960', status: 'Sudah Diterima' }
    ];
  };

  const getFIDUSIAChecklistFallback = () => {
    return [
      { id: 1, name: 'FOTOKOPI BPKB KENDARAAN BERMOTOR', desc: 'Fotokopi Bukti Pemilik Kendaraan Bermotor', status: 'Sudah Diterima' },
      { id: 2, name: 'FOTOKOPI STNK KENDARAAN BERMOTOR', desc: 'Fotokopi Surat Tanda Nomor Kendaraan', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP DEBITUR', desc: 'Kartu Tanda Penduduk pihak Debitur', status: 'Sudah Diterima' },
      { id: 4, name: 'KTP PERSETUJUAN DEBITUR', desc: 'Fotokopi KTP penjamin persetujuan debitur', status: 'Belum Ada' },
      { id: 5, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Fotokopi Kartu Keluarga debitur', status: 'Sudah Diterima' },
      { id: 6, name: 'FOTOKOPI SURAT NIKAH', desc: 'Fotokopi Surat Nikah/Buku Nikah debitur', status: 'Sudah Diterima' },
      { id: 7, name: 'FOTOKOPI PERJANJIAN KREDIT', desc: 'Fotokopi Perjanjian Kredit pendukung', status: 'Sudah Diterima' },
      { id: 8, name: 'FOTOKOPI KWITANSI PEMBELIAN KENDARAAN', desc: 'Diperlukan apabila BPKB + STNK bukan atas nama debitur', status: 'Belum Ada' },
      { id: 9, name: 'SURAT PERNYATAAN KEPEMILIKAN JAMINAN', desc: 'Diperlukan apabila BPKB + STNK bukan atas nama debitur', status: 'Belum Ada' },
      { id: 10, name: 'FOTOKOPI KTP PIHAK BANK', desc: 'ID perwakilan pejabat bank', status: 'Belum Ada' },
      { id: 11, name: 'FOTOKOPI SK PIHAK BANK', desc: 'Surat Keputusan perwakilan pejabat bank', status: 'Belum Ada' }
    ];
  };

  const getAPJBChecklistFallback = () => {
    return [
      { id: 1, name: 'SERTIFIKAT ASLI', desc: 'Sertifikat tanah asli (HM/HGB) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP AN. PEMEGANG HAK', desc: 'Kartu Tanda Penduduk atas nama pemegang hak', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP PERSETUJUAN PEMEGANG HAK', desc: 'Fotokopi KTP persetujuan suami/istri pemegang hak', status: 'Sudah Diterima' },
      { id: 4, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Fotokopi Kartu Keluarga pemegang hak', status: 'Sudah Diterima' },
      { id: 5, name: 'FOTOKOPI SURAT NIKAH', desc: 'Fotokopi Surat Nikah pemegang hak', status: 'Sudah Diterima' },
      { id: 6, name: 'FOTOKOPI PBB TAHUN BERJALAN', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' },
      { id: 7, name: 'FOTOKOPI KTP PEMBELI', desc: 'Fotokopi Kartu Tanda Penduduk pihak pembeli', status: 'Sudah Diterima' },
      { id: 8, name: 'FOTOKOPI KARTU KELUARGA PEMBELI', desc: 'Fotokopi Kartu Keluarga pihak pembeli', status: 'Sudah Diterima' },
      { id: 9, name: 'NOMOR TELEPON + EMAIL PEMBELI', desc: 'Nomor telepon dan email aktif pembeli', status: 'Sudah Diterima' },
      { id: 10, name: 'SHARELOKASI TANAH', desc: 'Titik koordinat share lokasi tanah objek', status: 'Sudah Diterima' },
      { id: 11, name: 'FOTO LOKASI', desc: 'Foto fisik lokasi tanah objek', status: 'Belum Ada' }
    ];
  };

  const getSKUMChecklistFallback = () => {
    return [
      { id: 1, name: 'SERTIFIKAT ASLI', desc: 'Sertifikat tanah asli (HM/HGB) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP AN. PEMEGANG HAK', desc: 'Kartu Tanda Penduduk atas nama pemegang hak', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP PERSETUJUAN PEMEGANG HAK', desc: 'Fotokopi KTP persetujuan suami/istri pemegang hak', status: 'Sudah Diterima' },
      { id: 4, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Fotokopi Kartu Keluarga pemegang hak', status: 'Sudah Diterima' }
    ];
  };

  const getSEWAChecklistFallback = () => {
    return [
      { id: 1, name: 'SERTIFIKAT ASLI', desc: 'Sertifikat tanah asli (HM/HGB) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP AN. PEMEGANG HAK', desc: 'Kartu Tanda Penduduk atas nama pemegang hak', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP PERSETUJUAN PEMEGANG HAK', desc: 'Fotokopi KTP persetujuan suami/istri pemegang hak', status: 'Sudah Diterima' },
      { id: 4, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Fotokopi Kartu Keluarga pemegang hak', status: 'Sudah Diterima' },
      { id: 5, name: 'FOTOKOPI SURAT NIKAH', desc: 'Fotokopi Surat Nikah pemegang hak', status: 'Sudah Diterima' },
      { id: 6, name: 'FOTOKOPI KTP PIHAK PENYEWA', desc: 'Fotokopi Kartu Tanda Penduduk pihak penyewa', status: 'Sudah Diterima' },
      { id: 7, name: 'FOTOKOPI KARTU KELUARGA PIHAK PENYEWA', desc: 'Fotokopi Kartu Keluarga pihak penyewa', status: 'Sudah Diterima' },
      { id: 8, name: 'FOTOKOPI PBB TAHUN BERJALAN', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' }
    ];
  };

  const getCONSENChecklistFallback = () => {
    return [
      { id: 1, name: 'SERTIFIKAT ASLI', desc: 'Sertifikat tanah asli (HM/HGB) dari BPN', status: 'Sudah Diterima' },
      { id: 2, name: 'KTP AN. PEMEGANG HAK', desc: 'Kartu Tanda Penduduk atas nama pemegang hak', status: 'Sudah Diterima' },
      { id: 3, name: 'KTP PERSETUJUAN PEMEGANG HAK', desc: 'Fotokopi KTP persetujuan suami/istri pemegang hak', status: 'Sudah Diterima' },
      { id: 4, name: 'FOTOKOPI KARTU KELUARGA', desc: 'Fotokopi Kartu Keluarga pemegang hak', status: 'Sudah Diterima' },
      { id: 5, name: 'FOTOKOPI SURAT NIKAH', desc: 'Fotokopi Surat Nikah pemegang hak', status: 'Sudah Diterima' },
      { id: 6, name: 'SURAT KETERANGAN LUNAS DARI BANK', desc: 'Surat keterangan lunas pelunasan hutang asli dari bank', status: 'Sudah Diterima' },
      { id: 7, name: 'SURAT KEHILANGAN DARI DESA', desc: 'Surat keterangan kehilangan resmi dari desa setempat', status: 'Sudah Diterima' },
      { id: 8, name: 'SURAT KEHILANGAN DARI POLRES SESUAI DOMISILI OBYEK', desc: 'Surat keterangan kehilangan dari Kepolisian Resor (Polres)', status: 'Sudah Diterima' },
      { id: 9, name: 'PENGANTAR ROYA DARI BANK', desc: 'Surat pengantar roya resmi asli dari bank', status: 'Sudah Diterima' },
      { id: 10, name: 'FOTOKOPI PBB TAHUN BERJALAN', desc: 'Fotokopi Pajak Bumi dan Bangunan tahun berjalan', status: 'Belum Ada' }
    ];
  };

  const getYAYASANChecklistFallback = () => {
    return [
      { id: 1, name: 'FOTOKOPI KTP SELURUH ANGGOTA', desc: 'Fotokopi KTP pendiri, pembina, pengurus, dan pengawas yayasan', status: 'Sudah Diterima' },
      { id: 2, name: 'FOTOKOPI KARTU KELUARGA SELURUH ANGGOTA', desc: 'Fotokopi Kartu Keluarga seluruh pendiri/pengurus', status: 'Sudah Diterima' },
      { id: 3, name: 'SUSUNAN/DAFTAR PENGURUS', desc: 'Susunan Pengurus (Ketua Pembina, Anggota, Ketua Pengurus, Sekretaris, Bendahara, Ketua Pengawas, Anggota)', status: 'Sudah Diterima' },
      { id: 4, name: 'SURAT KETERANGAN DOMISILI (DIBUAT SETELAH AKTA JADI)', desc: 'Surat keterangan domisili yayasan dari kelurahan setempat', status: 'Belum Ada' },
      { id: 5, name: 'FOTOKOPI NPWP PRIBADI MASING MASING PENGURUS', desc: 'Fotokopi Kartu NPWP masing-masing pengurus aktif', status: 'Sudah Diterima' },
      { id: 6, name: 'BERGERAK DALAM BIDANG APA YAYASAN TERSEBUT', desc: 'Penjelasan bidang kegiatan yayasan (Sosial, Keagamaan, Kemanusiaan)', status: 'Sudah Diterima' },
      { id: 7, name: 'NAMA YAYASAN (TERDIRI DARI 3 KATA DAN TIDAK BOLEH SINGKATAN SERTA EJAAN)', desc: 'Pengecekan nama yayasan minimal 3 kata tanpa singkatan', status: 'Sudah Diterima' },
      { id: 8, name: 'FOTOKOPI NPWP YAYASAN', desc: 'Fotokopi NPWP atas nama yayasan yang telah terdaftar', status: 'Belum Ada' },
      { id: 9, name: 'FOTOKOPI BUKU TABUNGAN AN. YAYASAN', desc: 'Fotokopi buku rekening bank atas nama yayasan', status: 'Belum Ada' }
    ];
  };

  const getPTChecklistFallback = () => {
    return [
      { id: 1, name: 'FOTOKOPI KTP DIREKTUR, KOMISARIS, PEMEGANG SAHAM', desc: 'Fotokopi Kartu Tanda Penduduk pendiri/pengurus PT', status: 'Sudah Diterima' },
      { id: 2, name: 'FOTOKOPI KARTU KELUARGA DIREKTUR, KOMISARIS, PEMEGANG SAHAM', desc: 'Fotokopi Kartu Keluarga pendiri/pengurus PT', status: 'Sudah Diterima' },
      { id: 3, name: 'FOTOKOPI NPWP DIREKTUR, KOMISARIS, PEMEGANG SAHAM', desc: 'Fotokopi NPWP pribadi pendiri/pengurus PT', status: 'Sudah Diterima' },
      { id: 4, name: 'NOMOR TELEPON + EMAIL DIREKTUR, KOMISARIS, PEMEGANG SAHAM', desc: 'Kontak aktif telepon dan email para pengurus PT', status: 'Sudah Diterima' },
      { id: 5, name: 'MODAL AWAL', desc: 'Detail nominal modal dasar perseroan terbatas', status: 'Sudah Diterima' },
      { id: 6, name: 'MODAL YANG DITEMPATKAN', desc: 'Detail nominal modal ditempatkan dan disetor penuh', status: 'Sudah Diterima' },
      { id: 7, name: 'JUMLAH SAHAM', desc: 'Jumlah total lembar saham perseroan', status: 'Sudah Diterima' },
      { id: 8, name: 'JUMLAH SAHAM YANG DITEMPATKAN', desc: 'Jumlah lembar saham disetor/ditempatkan', status: 'Sudah Diterima' },
      { id: 9, name: 'NAMA PT. (TERDIRI DARI 3 KATA)', desc: 'Pengecekan nama PT minimal 3 kata bahasa Indonesia resmi', status: 'Sudah Diterima' },
      { id: 10, name: 'ALAMAT LENGKAP PT', desc: 'Alamat lengkap kedudukan dan kantor PT', status: 'Sudah Diterima' },
      { id: 11, name: 'KEGIATAN USAHA (SESUAI KBLI 2021)', desc: 'Penentuan kode bidang usaha sesuai Klasifikasi Baku Lapangan Usaha Indonesia 2021', status: 'Sudah Diterima' },
      { id: 12, name: 'FOTOKOPI NPWP PT', desc: 'Fotokopi Nomor Pokok Wajib Pajak atas nama perseroan', status: 'Belum Ada' },
      { id: 13, name: 'FOTOKOPI BUKTI SETOR MODAL (BUKU TABUNGAN, REKENING KORAN, BUKTI TRANSFER KE REKENING AN. PERSERO)', desc: 'Bukti penyetoran modal ke rekening koran atas nama PT', status: 'Belum Ada' },
      { id: 14, name: 'SURAT KETERANGAN DOMISILI DARI DESA (SETELAH AKTA JADI)', desc: 'Surat keterangan domisili PT dari pemerintah desa setempat', status: 'Belum Ada' }
    ];
  };

  const getCVChecklistFallback = () => {
    return [
      { id: 1, name: 'FOTOKOPI KTP DIREKTUR, KOMANDITER', desc: 'Fotokopi Kartu Tanda Penduduk pendiri/pengurus CV', status: 'Sudah Diterima' },
      { id: 2, name: 'FOTOKOPI KARTU KELUARGA DIREKTUR, KOMANDITER', desc: 'Fotokopi Kartu Keluarga pendiri/pengurus CV', status: 'Sudah Diterima' },
      { id: 3, name: 'FOTOKOPI NPWP DIREKTUR, KOMANDITER', desc: 'Fotokopi NPWP pribadi pendiri/pengurus CV', status: 'Sudah Diterima' },
      { id: 4, name: 'NOMOR TELEPON + EMAIL CV.', desc: 'Kontak aktif telepon dan email CV', status: 'Sudah Diterima' },
      { id: 5, name: 'ALAMAT LENGKAP', desc: 'Alamat lengkap kedudukan dan kantor CV', status: 'Sudah Diterima' },
      { id: 6, name: 'NAMA CV (TERDIRI DARI 3 KATA)', desc: 'Pengecekan nama CV minimal 3 kata', status: 'Sudah Diterima' },
      { id: 7, name: 'MODAL AWAL USAHA', desc: 'Detail nominal modal awal usaha CV', status: 'Sudah Diterima' },
      { id: 8, name: 'KONTRIBUSI MODAL MASING PERSERO', desc: 'Detail kontribusi modal masing-masing sekutu/persero', status: 'Sudah Diterima' },
      { id: 9, name: 'KEGIATAN USAHA (SESUAI KBLI 2021 DI GOOGLE)', desc: 'Klasifikasi Baku Lapangan Usaha Indonesia CV', status: 'Sudah Diterima' },
      { id: 10, name: 'SURAT KETERANGAN DOMISILI (SETELAH AKTA JADI)', desc: 'Surat keterangan domisili CV setelah akta terbit', status: 'Belum Ada' },
      { id: 11, name: 'FOTOKOPI NPWP CV', desc: 'Fotokopi Nomor Pokok Wajib Pajak atas nama CV', status: 'Belum Ada' }
    ];
  };

  // Determine checklist based on serviceType
  let checklist = activeCase.checklist || [];
  if (checklist.length === 0) {
    const rawFallback = activeCase.serviceType === 'AJB' 
      ? getAJBChecklistFallback() 
      : activeCase.serviceType === 'HIBAH' 
      ? getHIBAHChecklistFallback() 
      : activeCase.serviceType === 'APHB'
      ? getAPHBChecklistFallback()
      : activeCase.serviceType === 'APHT'
      ? getAPHTChecklistFallback()
      : activeCase.serviceType === 'WARIS'
      ? getWARISChecklistFallback()
      : activeCase.serviceType === 'ROYA'
      ? getROYAChecklistFallback()
      : activeCase.serviceType === 'PECAH'
      ? getPECAHChecklistFallback()
      : activeCase.serviceType === 'GANTI'
      ? getGANTIChecklistFallback()
      : activeCase.serviceType === 'KONVERSI'
      ? getKONVERSIChecklistFallback()
      : activeCase.serviceType === 'FIDUSIA'
      ? getFIDUSIAChecklistFallback()
      : activeCase.serviceType === 'APJB' || activeCase.serviceType === 'APPJB'
      ? getAPJBChecklistFallback()
      : activeCase.serviceType === 'SKUM' || activeCase.serviceType === 'APK'
      ? getSKUMChecklistFallback()
      : activeCase.serviceType === 'SEWA'
      ? getSEWAChecklistFallback()
      : activeCase.serviceType === 'CONSEN'
      ? getCONSENChecklistFallback()
      : activeCase.serviceType === 'YAYASAN'
      ? getYAYASANChecklistFallback()
      : activeCase.serviceType === 'PT'
      ? getPTChecklistFallback()
      : activeCase.serviceType === 'CV'
      ? getCVChecklistFallback()
      : getSKMHTChecklistFallback();

    checklist = rawFallback.map(item => ({
      ...item,
      status: 'Belum Ada',
      fileName: null,
      fileUrl: null
    }));
  }

  const receivedCount = checklist.filter((item) => item.status === 'Sudah Diterima').length;
  const totalCount = checklist.length;

  // Retrieve timeline stages dynamically based on serviceType
  const getStagesForCase = () => {
    const isPPAT = activeCase.category?.toLowerCase() === 'ppat' || ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'SKMHT', 'HT', 'HGB', 'HAK_PAKAI'].includes(activeCase.serviceType);

    if (activeCase.serviceType === 'APHT') {
      return [
        { id: 1, label: '1. Pengecekan kelengkapan Berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pengetikan akta', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Tanda tangan akta', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. Penomoran akta', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 6, label: '6. Pendaftaran akta pada aplikasi mitra kerja atr bpn dan spa', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Backup pada aplikasi bank', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Verifikasi berkas oleh bpn melalui aplikasi mutra kerja atr bpn', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Berkas dikembalikan atau telah diverifikasi oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Verifikasi oleh bpn pada aplikasi bank', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Penerbitan sht', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Penyerahan berkas kepada pihak bank', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'AJB' || activeCase.serviceType === 'HIBAH' || activeCase.serviceType === 'APHB' || isPPAT) {
      // Check if it matches other specific PPAT services first
      if (activeCase.serviceType === 'WARIS' || activeCase.serviceType === 'ROYA') {
        return [
          { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
          { id: 2, label: '2. Proses validasi sertifikat', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
          { id: 3, label: '3. Proses pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
          { id: 4, label: '4. Pembayaran pajak peralihan', statusKey: 'Validasi Pajak', date: '' },
          { id: 5, label: '5. Validasi pajak peralihan', statusKey: 'Validasi Pajak', date: '' },
          { id: 6, label: '6. Pendaftaran pada atr bpn', statusKey: 'Proses BPN', date: '' },
          { id: 7, label: '7. Pemeriksaaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
          { id: 8, label: '8. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
          { id: 9, label: '9. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
          { id: 10, label: '10. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
          { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
          { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
        ];
      }
      if (activeCase.serviceType === 'PECAH') {
        return [
          { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
          { id: 2, label: '2. Pengecekan ke bpn status tanah yang kan dipecah', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
          { id: 3, label: '3. Pendaftaran ukur pemechan', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
          { id: 4, label: '4. Pengajuan tapak kapling', statusKey: 'Penyusunan Draf', date: '' },
          { id: 5, label: '5. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
          { id: 6, label: '6. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
          { id: 7, label: '7. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
          { id: 8, label: '8. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
          { id: 9, label: '9. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
          { id: 10, label: '10. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
          { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
          { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
        ];
      }
      if (activeCase.serviceType === 'GANTI') {
        return [
          { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
          { id: 2, label: '2. Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
          { id: 3, label: '3. Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
          { id: 4, label: '4. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
          { id: 5, label: '5. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
          { id: 6, label: '6. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
          { id: 7, label: '7. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
          { id: 8, label: '8. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
          { id: 9, label: '9. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
          { id: 10, label: '10. Pemriksaaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 11, label: '11. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 12, label: '12. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 13, label: '13. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
          { id: 14, label: '14. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
        ];
      }
      if (activeCase.serviceType === 'KONVERSI') {
        return [
          { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
          { id: 2, label: '2. Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
          { id: 3, label: '3. Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
          { id: 4, label: '4. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
          { id: 5, label: '5. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
          { id: 6, label: '6. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
          { id: 7, label: '7. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
          { id: 8, label: '8. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
          { id: 9, label: '9. Panitia lapang oleh petugas bpn', statusKey: 'Proses BPN', date: '' },
          { id: 10, label: '10. pengumuman', statusKey: 'Proses BPN', date: '' },
          { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
          { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
          { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
        ];
      }

      // Default PPAT stages (AJB/HIBAH/APHB/SKMHT/HT/HGB/HAK_PAKAI)
      return [
        { id: 1, label: '1. Pengecekan Berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Validasi Sertifikat', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pengecekan Sertifikat', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Pengetikan Akta', statusKey: 'Penyusunan Draf', date: '' },
        { id: 5, label: '5. Tanda Tangan Akta', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 6, label: '6. Pembayaran Pajak Peralihan', statusKey: 'Validasi Pajak', date: '' },
        { id: 7, label: '7. Validasi Pajak Peralihan (PPH Final)', statusKey: 'Validasi Pajak', date: '' },
        { id: 8, label: '8. Penomoran Akta', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Pendaftaran Akta', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Masuk Berkas Fisik ke BPN', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Pemeriksaan Berkas oleh BPN', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Pencarian Buku Tanah', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Pembayaran SPS', statusKey: 'Proses BPN', date: '' },
        { id: 14, label: '14. Pemeriksaan Draft Sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 15, label: '15. Draft Sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 16, label: '16. Penerbitan Sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 17, label: '17. Loket Penyerahan Produk', statusKey: 'Proses BPN', date: '' },
        { id: 18, label: '18. Penyerahan kepada Pemohon', statusKey: 'Selesai', date: '' },
      ];
    }

    if (activeCase.serviceType === 'APHT') {
      return [
        { id: 1, label: '1. Pengecekan kelengkapan Berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pengetikan akta', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Tanda tangan akta', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. Penomoran akta', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 6, label: '6. Pendaftaran akta pada aplikasi mitra kerja atr bpn dan spa', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Backup pada aplikasi bank', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Verifikasi berkas oleh bpn melalui aplikasi mutra kerja atr bpn', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Berkas dikembalikan atau telah diverifikasi oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Verifikasi oleh bpn pada aplikasi bank', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Penerbitan sht', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Penyerahan berkas kepada pihak bank', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'WARIS' || activeCase.serviceType === 'ROYA') {
      return [
        { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Proses validasi sertifikat', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Proses pengecekan sertifikat', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Pembayaran pajak peralihan', statusKey: 'Validasi Pajak', date: '' },
        { id: 5, label: '5. Validasi pajak peralihan', statusKey: 'Validasi Pajak', date: '' },
        { id: 6, label: '6. Pendaftaran pada atr bpn', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Pemeriksaaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
        { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'PECAH') {
      return [
        { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Pengecekan ke bpn status tanah yang kan dipecah', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pendaftaran ukur pemechan', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Pengajuan tapak kapling', statusKey: 'Penyusunan Draf', date: '' },
        { id: 5, label: '5. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
        { id: 6, label: '6. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
        { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'GANTI') {
      return [
        { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
        { id: 5, label: '5. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 6, label: '6. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Cari buku tanah di warkah bpn', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. Pemriksaaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
        { id: 14, label: '14. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'KONVERSI') {
      return [
        { id: 1, label: '1. Pengecekan berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. Pengecekan ke bpn status tanah yang akan diproses', statusKey: 'Verifikasi Sertifikat', date: '14 Oct' },
        { id: 3, label: '3. Pendaftaran ukur', statusKey: 'Verifikasi Sertifikat', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. Masuk berkas fisik ke bpn', statusKey: 'Proses BPN', date: '' },
        { id: 5, label: '5. Pemeriksaan berkas oleh bpn', statusKey: 'Proses BPN', date: '' },
        { id: 6, label: '6. Berkas dikembalikan atau telah sesuai', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. Pembayaran sps', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. Ruang pengukuran untuk gambar, pemetaan, cetak su', statusKey: 'Proses BPN', date: '' },
        { id: 9, label: '9. Panitia lapang oleh petugas bpn', statusKey: 'Proses BPN', date: '' },
        { id: 10, label: '10. pengumuman', statusKey: 'Proses BPN', date: '' },
        { id: 11, label: '11. Pemeriksaan draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 12, label: '12. Draft sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 13, label: '13. Penerbitan sertifikat', statusKey: 'Proses BPN', date: '' },
        { id: 14, label: '14. Loket penyerahan produk', statusKey: 'Proses BPN', date: '' },
        { id: 15, label: '15. Penyerahan kepada pemohon', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'FIDUSIA') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: '15 Oct' },
        { id: 3, label: '3. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. PENOMORAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 6, label: '6. PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. PENYERAHAN AKTA KE PIHAK BANK', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'APJB' || activeCase.serviceType === 'SKUM') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PEMBAYARAN PAJAK PERALIHAN', statusKey: 'Validasi Pajak', date: '' },
        { id: 6, label: '6. PENOMORAN AKTA', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'SEWA' || activeCase.serviceType === 'CONSEN') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: '15 Oct' },
        { id: 3, label: '3. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. PENOMORAN AKTA', statusKey: 'Proses BPN', date: '' },
        { id: 5, label: '5. PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'APPJB') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENOMORAN AKTA', statusKey: 'Proses BPN', date: '' }
      ];
    }

    if (activeCase.serviceType === 'APK') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. PENGECEKKAN SERTIFIKAT', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENOMORAN AKTA', statusKey: 'Proses BPN', date: '' },
        { id: 6, label: '6. PENYERAHAN AKTA KE PIHAK BANK', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'YAYASAN') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. DAFTAR NAMA YAYASAN PADA AHU', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENOMORAN AKTA', statusKey: 'Validasi Pajak', date: '' },
        { id: 6, label: '6. PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'PT') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. DAFTAR NAMA PT PADA AHU', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENOMORAN AKTA', statusKey: 'Validasi Pajak', date: '' },
        { id: 6, label: '6. PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. PENERBITAN SK KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai', date: '' }
      ];
    }

    if (activeCase.serviceType === 'CV') {
      return [
        { id: 1, label: '1. PENGECEKKAN KELENGKAPAN BERKAS', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
        { id: 2, label: '2. DAFTAR NAMA CV PADA AHU', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
        { id: 3, label: '3. PENGETIKKAN AKTA', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
        { id: 4, label: '4. TANDA TANGAN AKTA', statusKey: 'Tanda Tangan Akta', date: '' },
        { id: 5, label: '5. PENOMORAN AKTA', statusKey: 'Validasi Pajak', date: '' },
        { id: 6, label: '6. PENDAFTARAN KE KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 7, label: '7. PENERBITAN SKT KEMENKUMHAM', statusKey: 'Proses BPN', date: '' },
        { id: 8, label: '8. PENYERAHAN AKTA KE PEMOHON', statusKey: 'Selesai', date: '' }
      ];
    }

    // 6 Stages for SKMHT and other services
    return [
      { id: 1, label: '1. Pengecekkan Berkas', statusKey: 'Pemeriksaan Dokumen', date: '12 Oct' },
      { id: 2, label: '2. Pengecekkan Sertifikat', statusKey: 'Verifikasi Sertifikat', date: '15 Oct' },
      { id: 3, label: '3. Pengetikkan Akta', statusKey: 'Penyusunan Draf', date: 'Sedang Berlangsung' },
      { id: 4, label: '4. Tanda Tangan Akta', statusKey: 'Tanda Tangan Akta', date: '' },
      { id: 5, label: '5. Penomoran Akta', statusKey: 'Proses BPN', date: '' },
      { id: 6, label: '6. Penyelesaian Berkas', statusKey: 'Selesai', date: '' },
    ];
  };

  const stages = getStagesForCase();

  // Get active stage ID with fallback to match status
  const getActiveStageId = () => {
    if (activeCase.status === 'Selesai') {
      return stages.length + 1; // All completed
    }
    
    if (activeCase.currentStageId !== undefined && activeCase.currentStageId !== null && activeCase.currentStageId !== 0) {
      return activeCase.currentStageId;
    }
    
    const isPPAT = activeCase.category?.toLowerCase() === 'ppat' || ['AJB', 'HIBAH', 'APHB', 'APHT', 'WARIS', 'ROYA', 'PECAH', 'GANTI', 'KONVERSI', 'SKMHT', 'HT', 'HGB', 'HAK_PAKAI'].includes(activeCase.serviceType);

    if (isPPAT) {
      if (activeCase.serviceType === 'APHT') {
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Penyusunan Draf': 3,
          'Tanda Tangan Akta': 4,
          'Proses BPN': 6,
        };
        return statusMap[activeCase.status] || 1;
      } else if (activeCase.serviceType === 'WARIS' || activeCase.serviceType === 'ROYA') {
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Validasi Pajak': 4,
          'Proses BPN': 6,
        };
        return statusMap[activeCase.status] || 1;
      } else if (activeCase.serviceType === 'PECAH') {
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Penyusunan Draf': 4,
          'Tanda Tangan Akta': 4,
          'Validasi Pajak': 5,
          'Proses BPN': 5,
        };
        return statusMap[activeCase.status] || 1;
      } else if (activeCase.serviceType === 'GANTI') {
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Penyusunan Draf': 4,
          'Tanda Tangan Akta': 4,
          'Validasi Pajak': 4,
          'Proses BPN': 4,
        };
        return statusMap[activeCase.status] || 1;
      } else if (activeCase.serviceType === 'KONVERSI') {
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Penyusunan Draf': 4,
          'Tanda Tangan Akta': 4,
          'Validasi Pajak': 4,
          'Proses BPN': 4,
        };
        return statusMap[activeCase.status] || 1;
      } else {
        // Standard PPAT stages (AJB/HIBAH/APHB/HT/HGB/HAK_PAKAI/SKMHT)
        const statusMap = {
          'Pemeriksaan Dokumen': 1,
          'Verifikasi Sertifikat': 2,
          'Penyusunan Draf': 4,
          'Tanda Tangan Akta': 5,
          'Validasi Pajak': 6,
          'Proses BPN': 8,
        };
        return statusMap[activeCase.status] || 1;
      }
    } else if (activeCase.serviceType === 'FIDUSIA') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 1,
        'Penyusunan Draf': 2,
        'Tanda Tangan Akta': 3,
        'Validasi Pajak': 5,
        'Proses BPN': 5,
      };
      return statusMap[activeCase.status] || 1;
    } else if (activeCase.serviceType === 'APJB' || activeCase.serviceType === 'SKUM') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 5,
        'Proses BPN': 6,
      };
      return statusMap[activeCase.status] || 1;
    } else if (activeCase.serviceType === 'SEWA' || activeCase.serviceType === 'CONSEN') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 1,
        'Penyusunan Draf': 2,
        'Tanda Tangan Akta': 3,
        'Validasi Pajak': 3,
        'Proses BPN': 4,
      };
      return statusMap[activeCase.status] || 1;
    } else if (activeCase.serviceType === 'APPJB') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 5,
      };
      return statusMap[activeCase.status] || 1;
    } else if (activeCase.serviceType === 'APK') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 4,
        'Proses BPN': 5,
      };
      return statusMap[activeCase.status] || 1;
    } else if (activeCase.serviceType === 'YAYASAN' || activeCase.serviceType === 'PT' || activeCase.serviceType === 'CV') {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Validasi Pajak': 5,
        'Proses BPN': 6,
      };
      return statusMap[activeCase.status] || 1;
    } else {
      const statusMap = {
        'Pemeriksaan Dokumen': 1,
        'Verifikasi Sertifikat': 2,
        'Penyusunan Draf': 3,
        'Tanda Tangan Akta': 4,
        'Proses BPN': 5,
      };
      return statusMap[activeCase.status] || 1;
    }
  };

  // Helper to determine status for each stage reactive to case status & stage ID
  const getStageStatus = (stageId) => {
    const activeStageId = getActiveStageId();
    
    if (activeCase.status === 'Selesai') return 'Selesai';
    if (stageId < activeStageId) return 'Selesai';
    if (stageId === activeStageId) return 'Proses';
    return 'Belum';
  };

  const handleUpdateChecklistStatus = (itemId, newStatus, fileData = null) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId 
        ? { 
            ...item, 
            status: newStatus,
            fileName: fileData ? fileData.name : (newStatus === 'Belum Ada' ? null : item.fileName),
            fileUrl: fileData ? fileData.url : (newStatus === 'Belum Ada' ? null : item.fileUrl)
          } 
        : item
    );
    const isDocReady = updatedChecklist.every((item) => item.status === 'Sudah Diterima');
    updateCase(activeCase.id, {
      checklist: updatedChecklist,
      documentsReady: isDocReady,
    });

    if (isDocReady && !activeCase.documentsReady) {
      toast.success('Semua berkas persyaratan lengkap! Berkas siap diproses.');
      setTimeout(() => {
        document.getElementById('workflow-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  const handleAdvanceStage = () => {
    const activeStageId = getActiveStageId();
    const nextStage = stages.find((s) => s.id === activeStageId + 1);
    if (nextStage) {
      updateCaseStage(activeCase.id, nextStage.id, nextStage.statusKey);
      toast.success(`Berhasil melanjutkan ke tahap: ${nextStage.label}`);
    } else {
      updateCaseStatus(activeCase.id, 'Selesai');
      toast.success('Semua tahapan selesai! Berkas berhasil diselesaikan.');
    }
  };

  const handleSaveRemarks = () => {
    updateCase(activeCase.id, { notes: remarksText });
    setIsEditingRemarks(false);
  };

  const handleSubmitCase = () => {
    updateCaseStatus(activeCase.id, 'Selesai');
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowSubmitModal(false);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = (caseNumber) => {
    const svgId = `qr-svg-${caseNumber.replace(/\//g, '-')}`;
    const svg = document.getElementById(svgId);
    if (!svg) {
      toast.error('Gagal menemukan elemen QR Code!');
      return;
    }
    
    try {
      const svgSerializer = new XMLSerializer();
      const svgString = svgSerializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const context = canvas.getContext('2d');
        
        // Draw crisp solid white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render QR Code onto the canvas
        context.drawImage(image, 25, 25, 450, 450);
        
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `QR-Code-Pelacakan-${caseNumber.replace(/\//g, '-')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast.success('QR Code berhasil diunduh!');
      };
      image.src = blobURL;
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh QR Code!');
    }
  };

  const getStageMetadata = (statusKey) => {
    switch (statusKey) {
      case 'Pemeriksaan Dokumen':
        return {
          executor: 'Staf Administrasi (Ani Lestari, S.H.)',
          note: 'Pemeriksaan kelengkapan dokumen persyaratan dan validasi berkas fisik awal.'
        };
      case 'Verifikasi Sertifikat':
        return {
          executor: 'Ketua Notaris (Bambang Wijaya, S.H., M.Kn.)',
          note: 'Pengecekan keaslian dan status hukum sertifikat tanah di Kantor Pertanahan (BPN).'
        };
      case 'Penyusunan Draf':
        return {
          executor: 'Staf Administrasi (Ani Lestari, S.H.)',
          note: 'Pembuatan draf awal salinan akta sesuai jenis layanan dan kesepakatan transaksi.'
        };
      case 'Tanda Tangan Akta':
        return {
          executor: 'Ketua Notaris (Bambang Wijaya, S.H., M.Kn.)',
          note: 'Pembacaan akta dan penandatanganan oleh para pihak, saksi-saksi, serta Notaris.'
        };
      case 'Validasi Pajak':
        return {
          executor: 'Staf Keuangan & Administrasi',
          note: 'Validasi setoran SSP/PPh Final dan BPHTB ke Kantor Pajak Daerah.'
        };
      case 'Proses BPN':
        return {
          executor: 'Staf Lapangan & BPN',
          note: 'Proses pendaftaran, pencarian warkah, dan balik nama di Kantor Pertanahan.'
        };
      case 'Selesai':
        return {
          executor: 'Sistem & Penerima Tamu',
          note: 'Akta dan produk sertifikat telah siap diambil atau diserahkan kepada pemohon.'
        };
      default:
        return {
          executor: 'Staf Notaris Penanggung Jawab',
          note: 'Pengerjaan berkas sesuai prosedur operasional standar.'
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-stack-lg text-left print:p-0 print:space-y-4">
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 print:hidden">
        <div>
          <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
            <span
              onClick={() => navigate('/staff/documents')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Documents
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-medium">{activeCase.serviceType} Tracking</span>
          </nav>
          <h2 className="text-headline-lg font-headline-lg text-on-surface font-extrabold">
            Kelengkapan & Pelacakan Berkas: {activeCase.serviceType}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-outline-variant rounded-lg text-label-bold font-label-bold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Summary
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-bold font-label-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Selesaikan Berkas
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-2xl font-bold text-primary">NOTARIS DIGITAL & PPAT</h1>
        <p className="text-sm text-on-surface-variant">Laporan Kelengkapan Dokumen & Pelacakan Berkas</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><strong>Nomor Berkas:</strong> {activeCase.caseNumber}</p>
            <p><strong>Nama Klien:</strong> {activeCase.clientName}</p>
            <p><strong>ID Klien:</strong> {activeCase.clientId}</p>
          </div>
          <div className="text-right">
            <p><strong>Layanan:</strong> {activeCase.serviceType}</p>
            <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
            <p><strong>Status Terakhir:</strong> {activeCase.status}</p>
          </div>
        </div>
      </div>

      {/* Unified Premium Client Card */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] print:mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined !text-4xl">person</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                {activeCase.clientName}
              </h3>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-label-bold uppercase ${
                activeCase.isDraft ? 'bg-amber-100 text-amber-800' : 'bg-primary-container text-on-primary-container'
              }`}>
                {activeCase.isComplete ? 'Selesai' : activeCase.isDraft ? 'Draf' : 'Aktif'}
              </span>
            </div>
            <p className="text-on-surface-variant flex items-center gap-1.5 text-body-md mt-1 font-medium">
              <span className="material-symbols-outlined !text-sm">gavel</span>
              {activeCase.serviceType === 'AJB' ? 'Akta Jual Beli (AJB)' : activeCase.serviceType === 'SKMHT' ? 'Surat Kuasa Membebankan Hak Tanggungan (SKMHT)' : activeCase.serviceType} • #{activeCase.caseNumber} • ID: {activeCase.clientId || 'NOTARY-2023-0892'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <div className="text-right mr-4 hidden md:block select-none">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Kondisi Berkas</p>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
              activeCase.isComplete 
                ? 'bg-secondary-container text-on-secondary-container' 
                : activeCase.isDraft
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : !activeCase.documentsReady 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-green-100 text-green-800 border border-green-300'
            }`}>
              {activeCase.isComplete ? 'Selesai' : activeCase.isDraft ? 'Menunggu Diterbitkan' : !activeCase.documentsReady ? 'Menunggu Klien' : 'Aktif Diproses'}
            </span>
          </div>
          {activeCase.isDraft && (
            <button
              onClick={handlePublishDraft}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-label-bold transition-colors text-[13px] font-semibold flex items-center gap-1.5 shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span>Terbitkan Berkas</span>
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 border border-primary text-primary rounded-lg font-label-bold hover:bg-primary/5 transition-colors text-[13px] font-semibold bg-white flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Bagikan Link</span>
          </button>
          <button
            onClick={() => setShowEditDetailsModal(true)}
            className="px-4 py-2 border border-outline-variant rounded-lg text-primary font-label-bold hover:bg-surface-container-low transition-colors text-[13px] font-semibold bg-white flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Ubah Detail & Biaya</span>
          </button>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold hover:opacity-90 transition-opacity text-[13px] font-semibold"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </section>

      {/* Grid Data Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] print:mb-4">
        {[
          { label: 'Tanggal Registrasi', value: formatDate(activeCase.entryDate), icon: 'calendar_today', color: 'text-primary' },
          { label: 'Estimasi Selesai', value: formatDate(activeCase.estimationDate), icon: 'event_available', color: 'text-error' },
          { label: 'Biaya Akta', value: `Rp ${(activeCase.fees || 0).toLocaleString('id-ID')}`, icon: 'payments', color: 'text-primary' },
          { 
            label: 'Status Pembayaran', 
            value: `${activeCase.paymentStatus || 'Belum Lunas'} (Dibayar: Rp ${(activeCase.paidAmount || 0).toLocaleString('id-ID')})`, 
            icon: 'credit_card', 
            color: activeCase.paymentStatus === 'Lunas' ? 'text-secondary' : activeCase.paymentStatus === 'DP' ? 'text-primary' : 'text-error' 
          },
          { label: 'Lokasi Objek', value: activeCase.propertyLocation || 'Jakarta Selatan', icon: 'location_on', color: 'text-primary' },
          { label: 'Bank Rekanan', value: activeCase.bankPartner || 'Bank Mandiri', icon: 'corporate_fare', color: 'text-primary' },
          { label: 'Staf Penanggung Jawab', value: activeCase.assignedStaff || 'Ani Lestari, S.H.', icon: 'engineering', color: 'text-primary' },
          { label: 'Status Kelengkapan', value: `${receivedCount} dari ${totalCount} Dokumen Diterima`, icon: 'checklist', color: 'text-primary' }
        ].map((item, index) => (
          <div key={index} className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center shrink-0">
              <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{item.label}</p>
              <p className="font-semibold text-on-surface text-[12.5px] mt-0.5 truncate" title={item.value}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Workflow Step Controller */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4 text-left print:hidden">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            !activeCase.documentsReady 
              ? 'bg-amber-100 text-amber-800' 
              : activeCase.status === 'Selesai' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-primary-soft text-primary'
          }`}>
            <span className="material-symbols-outlined text-[26px]">
              {!activeCase.documentsReady 
                ? 'rule' 
                : activeCase.status === 'Selesai' 
                ? 'check_circle' 
                : 'trending_up'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-[15px]">
              {!activeCase.documentsReady 
                ? 'Persyaratan Dokumen Belum Lengkap' 
                : activeCase.status === 'Selesai' 
                ? 'Semua Proses Pengerjaan Selesai' 
                : 'Progres Alur Kerja Aktif'}
            </h4>
            <p className="text-[12.5px] text-on-surface-variant font-medium mt-1">
              {!activeCase.documentsReady 
                ? 'Selesaikan checklist dokumen di bawah terlebih dahulu untuk mengaktifkan alur kerja.' 
                : activeCase.status === 'Selesai' 
                ? 'Seluruh tahapan telah berhasil diselesaikan dan produk siap diserahkan kepada klien.' 
                : `Tahap Aktif Saat Ini: ${stages.find(s => s.id === getActiveStageId())?.label || '-'}`}
            </p>
          </div>
        </div>

        {activeCase.documentsReady && activeCase.status !== 'Selesai' && (
          <button
            onClick={handleAdvanceStage}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold hover:opacity-95 shadow-md flex items-center gap-1.5 transition-all active:scale-[0.97] shrink-0"
          >
            <span>
              {getActiveStageId() === stages.length 
                ? 'Selesaikan Berkas' 
                : `Lanjutkan ke Tahap ${getActiveStageId() + 1}: ${stages.find((s) => s.id === getActiveStageId() + 1)?.label.replace(/^\d+\.\s*/, '') || ''}`}
            </span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Grid Layout (Left lg:col-span-7, Right lg:col-span-5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        
        {/* Left Column - Checklist & Property Location (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-stack-lg print:col-span-12">
          
          {/* Document Checklist Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-stack-md border-b pb-3 border-outline-variant/60">
              <h4 className="font-headline-sm text-headline-sm font-bold flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">description</span>
                Kelengkapan Berkas {activeCase.serviceType}
              </h4>
              <span className="text-label-bold font-extrabold text-on-surface-variant bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px]">
                {receivedCount} / {totalCount} TERIMA
              </span>
            </div>
            <div className="flex flex-col gap-base">
              {checklist.map((item, idx) => {
                const isReceived = item.status === 'Sudah Diterima';
                const isPending = item.status === 'Belum Ada';
                const isReview = item.status === 'Perlu Verifikasi';
                
                // Determine mandatory vs optional
                const isMandatory = idx < 3 || item.name.toLowerCase().includes('ktp') || item.name.toLowerCase().includes('sertifikat');
                const verifierInitials = isReceived ? (activeCase.assignedStaff ? activeCase.assignedStaff.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AL') : null;
                const dateNote = isReceived ? formatDate(activeCase.entryDate) : isReview ? 'Sedang ditinjau' : 'Belum diunggah';

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors rounded-xl text-body-md gap-3 text-left"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {isReceived ? (
                        <div
                          onClick={() => handleUpdateChecklistStatus(item.id, 'Belum Ada')}
                          className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary cursor-pointer active:scale-95 transition-transform mt-0.5 shrink-0"
                          title="Tandai belum diterima"
                        >
                          <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        </div>
                      ) : isReview ? (
                        <div
                          onClick={() => setSelectedDocForReview(item)}
                          className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-700 cursor-pointer active:scale-95 transition-transform mt-0.5 shrink-0"
                          title="Klik untuk verifikasi"
                        >
                          <span className="material-symbols-outlined !text-xl animate-pulse">priority_high</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setSelectedDocForUpload(item)}
                          className="w-8 h-8 rounded-lg bg-error-container/20 flex items-center justify-center text-error cursor-pointer active:scale-95 transition-transform hover:bg-primary/10 hover:text-primary mt-0.5 shrink-0"
                          title="Tandai diterima/Upload"
                        >
                          <span className="material-symbols-outlined !text-xl">pending</span>
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <p className="text-on-surface font-semibold text-[13.5px] leading-tight">
                          {idx + 1}. {item.name}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-normal truncate">{item.desc}</p>
                        
                        {/* Meta indicators for Checklist Attributes */}
                        <div className="flex flex-wrap gap-2 items-center mt-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${isMandatory ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {isMandatory ? 'Wajib' : 'Opsional'}
                          </span>
                          
                          {isReceived && (
                            <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Pemeriksa: <strong className="text-primary font-bold">{verifierInitials}</strong> • Tgl: {dateNote}
                            </span>
                          )}
                          
                          {isReview && (
                            <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                              Status: {dateNote}
                            </span>
                          )}

                          {isPending && (
                            <span className="text-[10px] text-error font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">hourglass_empty</span>
                              Status: {dateNote}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 print:hidden ml-11 sm:ml-0">
                      {isReceived ? (
                        <>
                          <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                            SUDAH DITERIMA
                          </span>
                          <button
                            onClick={() => setSelectedDocForPreview(item)}
                            className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                            title="Lihat"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </>
                      ) : isReview ? (
                        <>
                          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-lg uppercase">
                            PERLU VERIFIKASI
                          </span>
                          <button
                            onClick={() => setSelectedDocForReview(item)}
                            className="text-secondary hover:bg-secondary/10 p-1.5 rounded-lg transition-colors"
                            title="Tinjau"
                          >
                            <span className="material-symbols-outlined text-[18px]">fact_check</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 bg-error-container text-on-error-container text-[10px] font-bold rounded-lg uppercase">
                            BELUM DIUNGGAH
                          </span>
                          <button
                            onClick={() => setSelectedDocForUpload(item)}
                            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[10.5px] font-bold hover:opacity-90 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[13px]">upload</span>
                            Upload
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Remarks Section */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant flex gap-4 items-start print:p-4">
            <span className="material-symbols-outlined text-primary text-[24px]">info</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-on-surface text-[13px] uppercase tracking-wider">
                  Catatan Notaris / Remarks:
                </h4>
                {!isEditingRemarks ? (
                  <button
                    onClick={() => setIsEditingRemarks(true)}
                    className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1 print:hidden"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRemarks}
                      className="text-[12px] font-bold text-secondary hover:underline"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => {
                        setRemarksText(activeCase.notes || '');
                        setIsEditingRemarks(false);
                      }}
                      className="text-[12px] font-bold text-error hover:underline"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
              {!isEditingRemarks ? (
                <p className="text-body-md text-on-surface-variant mt-1.5 italic">
                  "{activeCase.notes || 'Belum ada catatan khusus untuk berkas ini.'}"
                </p>
              ) : (
                <textarea
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  className="w-full mt-2 p-2 bg-white border border-outline-variant rounded-lg text-[12.5px] focus:outline-none focus:border-primary focus:border-2"
                  rows="3"
                />
              )}
            </div>
          </div>

          {/* Activity Logs History */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <h4 className="font-headline-sm text-headline-sm font-bold flex items-center gap-2 mb-4 text-on-surface border-b pb-3 border-outline-variant/60">
              <span className="material-symbols-outlined text-primary">history</span>
              Riwayat Aktivitas Berkas
            </h4>
            
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {((activeCase.logs && activeCase.logs.length > 0) ? activeCase.logs : [
                { timestamp: new Date(activeCase.id ? Number(activeCase.id) : Date.now()).toISOString(), user: 'Sistem', action: 'Berkas didaftarkan / berkas masuk ke dalam sistem' }
              ]).map((log, idx) => (
                <div key={idx} className="flex gap-3 text-body-md border-b border-outline-variant/40 pb-3 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-[12.5px] leading-normal">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-on-surface-variant font-medium">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {log.user}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {formatDate(log.timestamp)} pukul {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Timeline (lg:col-span-5) */}
        <div className="lg:col-span-5" id="workflow-section">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-card-padding shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sticky top-24 max-h-[calc(100vh-140px)] flex flex-col">
            <h4 className="font-headline-sm text-headline-sm font-bold flex items-center gap-2 mb-stack-md shrink-0 text-on-surface">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Workflow {activeCase.serviceType}
            </h4>
            
            {/* Legend */}
            <div className="flex gap-4 mb-stack-md px-2 shrink-0 border-b pb-3 border-outline-variant/60">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="text-[10px] font-label-bold uppercase text-on-surface-variant font-extrabold">Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-[10px] font-label-bold uppercase text-on-surface-variant font-extrabold">Proses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-error-container"></span>
                <span className="text-[10px] font-label-bold uppercase text-on-surface-variant font-extrabold">Belum</span>
              </div>
            </div>

            {/* Scrollable Workflow Timeline */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 scroll-smooth">
              <div className="flex flex-col">
                {stages.map((stage, idx) => {
                  const status = getStageStatus(stage.id);
                  const isCompleted = status === 'Selesai';
                  const isProcessing = status === 'Proses';
                  const isPending = status === 'Belum';
                  const { executor, note } = getStageMetadata(stage.statusKey);

                  return (
                    <div
                      key={stage.id}
                      className="relative flex gap-4 pb-8 cursor-pointer group text-left"
                      onClick={() => {
                        updateCaseStage(activeCase.id, stage.id, stage.statusKey);
                      }}
                    >
                      {/* Connecting Line */}
                      {idx !== stages.length - 1 && (
                        <div
                          className={`absolute left-[15px] top-8 bottom-0 w-[2px] z-0 ${
                            isCompleted ? 'bg-primary' : 'bg-outline-variant/50'
                          }`}
                        ></div>
                      )}

                      {/* Icon Circle */}
                      {isCompleted ? (
                        <div className="relative z-10 w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                          <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                        </div>
                      ) : isProcessing ? (
                        <div className="relative z-10 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 shrink-0 ring-2 ring-yellow-400/30 animate-pulse scale-105 shadow-sm">
                          <span className="material-symbols-outlined !text-[18px]">schedule</span>
                        </div>
                      ) : (
                        <div className="relative z-10 w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center text-error shrink-0 transition-all hover:bg-error/10 shadow-sm">
                          <span className="material-symbols-outlined !text-[18px]">close</span>
                        </div>
                      )}

                      {/* Content block */}
                      <div className="flex-1 border-b border-outline-variant/60 pb-3">
                        <div className="flex items-center justify-between">
                          <p className={`font-label-bold font-bold text-[13px] ${isPending ? 'text-on-surface-variant/70' : 'text-on-surface'}`}>
                            {stage.label}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-label-bold font-bold rounded uppercase ${
                              isCompleted
                                ? 'bg-primary-container/10 text-primary'
                                : isProcessing
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-error-container/20 text-error'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        
                        {/* Dynamic Executor and Processing Note */}
                        <div className="mt-2 space-y-1">
                          <p className="text-[10.5px] text-on-surface-variant flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[13px] text-on-surface-variant">person</span>
                            Pelaksana: <span className="text-on-surface font-bold">{executor}</span>
                          </p>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                            {note}
                          </p>
                        </div>

                        {isCompleted && stage.date && (
                          <p className="text-label-sm text-primary font-bold text-[10.5px] mt-1.5">{stage.date}</p>
                        )}
                        {isProcessing && (
                          <p className="text-label-sm text-yellow-700 italic text-[10.5px] mt-1.5">Sedang Berlangsung</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic modals block */}
      {renderModals()}
    </div>
  );

  // MOCK MODAL RENDERING HELPER
  function renderModals() {
    return (
      <>
        {/* === MODAL: PREVIEW DOCUMENT === */}
        {selectedDocForPreview && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-lg p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide border-b pb-2 mb-4">
                Pratinjau: {selectedDocForPreview.name}
              </h3>
              
              <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
                {selectedDocForPreview.name.includes('KTP') ? (
                  /* High-fidelity Blue E-KTP Render */
                  <div className="w-[360px] h-[220px] bg-gradient-to-r from-sky-400 to-sky-600 rounded-xl shadow-lg border border-sky-300 p-4 text-white font-mono text-[9px] relative overflow-hidden select-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none"></div>
                    <div className="flex justify-between items-start border-b border-white/30 pb-1 mb-2">
                      <p className="font-bold">PROVINSI DKI JAKARTA<br/>KOTA JAKARTA SELATAN</p>
                      <p className="text-[7px] text-right font-sans">REPUBLIK INDONESIA</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[12px] font-bold border-b border-white/20 pb-0.5 mb-1 text-yellow-200">NIK: 3174092408890001</p>
                      <div className="grid grid-cols-12 gap-x-1">
                        <span className="col-span-4">Nama</span>
                        <span className="col-span-8">: BAMBANG WIJAYA</span>
                      </div>
                      <div className="grid grid-cols-12 gap-x-1">
                        <span className="col-span-4">Tempat/Tgl Lahir</span>
                        <span className="col-span-8">: JAKARTA, 24-08-1989</span>
                      </div>
                      <div className="grid grid-cols-12 gap-x-1">
                        <span className="col-span-4">Alamat</span>
                        <span className="col-span-8">: JL. KEMANG RAYA NO. 12</span>
                      </div>
                      <div className="grid grid-cols-12 gap-x-1">
                        <span className="col-span-4">Agama</span>
                        <span className="col-span-8">: ISLAM</span>
                      </div>
                      <div className="grid grid-cols-12 gap-x-1">
                        <span className="col-span-4">Status Perkawinan</span>
                        <span className="col-span-8">: KAWIN</span>
                      </div>
                    </div>
                    <div className="absolute right-4 bottom-4 w-16 h-20 bg-sky-200 rounded border border-white/50 flex items-center justify-center text-sky-800">
                      <span className="material-symbols-outlined text-[32px]">person</span>
                    </div>
                    <div className="absolute right-24 bottom-4 text-[6px] font-sans text-center">
                      <p>JAKARTA SELATAN</p>
                      <p>25-05-2023</p>
                    </div>
                  </div>
                ) : selectedDocForPreview.name.includes('Sertifikat') || selectedDocForPreview.name.includes('SERTIFIKAT') ? (
                  /* High-fidelity Green BPN Certificate Render */
                  <div className="w-[320px] h-[240px] bg-[#eef7ef] border-4 border-[#417646] rounded-xl shadow-lg p-5 text-[#1b3d20] flex flex-col items-center justify-between relative overflow-hidden select-none">
                    <div className="absolute inset-0 border-2 border-dashed border-[#417646]/20 m-1 pointer-events-none"></div>
                    <div className="text-center">
                      <span className="material-symbols-outlined text-[32px] text-amber-600 mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                      <h4 className="font-serif text-[12px] font-bold tracking-wider">BADAN PERTANAHAN NASIONAL</h4>
                      <p className="text-[7px] tracking-widest font-sans font-bold">REPUBLIK INDONESIA</p>
                    </div>
                    <div className="text-center my-4 space-y-1">
                      <h5 className="font-serif text-[14px] font-bold border-b border-[#417646]/30 pb-1 px-4">SERTIFIKAT</h5>
                      <p className="text-[9px] font-bold font-mono">HAK MILIK No. 04892</p>
                      <p className="text-[8px] font-medium font-sans">DESA/KELURAHAN: KEBAYORAN BARU</p>
                    </div>
                    <div className="w-full flex justify-between items-end text-[7px] font-bold">
                      <p>LUAS: 250 M<sup>2</sup></p>
                      <div className="text-center font-sans border-t border-[#1b3d20]/30 pt-1 w-20">
                        <p>KEPALA KANTOR</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* General Document Render */
                  <div className="w-[300px] h-[200px] bg-white border border-outline-variant shadow rounded-lg p-4 flex flex-col justify-between text-on-surface select-none">
                    <div className="border-b pb-2 flex justify-between items-center">
                      <div className="flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{selectedDocForPreview.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[7px] font-bold">VERIFIED</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-2 py-4">
                      <div className="w-full h-2 bg-surface-container-high rounded"></div>
                    </div>
                    <div className="text-[8px] text-on-surface-variant font-medium flex justify-between border-t pt-2">
                      <span>Dokumen Digital Berlisensi</span>
                      <span>Tgl Diterima: {new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-bold hover:opacity-90 transition-all text-[13px]"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL: UPLOAD DOCUMENT === */}
        {selectedDocForUpload && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDocForUpload(null)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide mb-1">
                Upload Berkas
              </h3>
              <p className="text-[12px] text-on-surface-variant border-b pb-2 mb-4 font-medium">
                Persyaratan: <strong className="text-on-surface">{selectedDocForUpload.name}</strong>
              </p>

              <input
                 type="file"
                 id={`modal-file-${selectedDocForUpload.id}`}
                 className="opacity-0 absolute pointer-events-none w-0 h-0"
                 onChange={(e) => {
                   const file = e.target.files[0];
                   if (file) {
                     setUploadFile(file);
                   }
                 }}
               />

               {uploadFile ? (
                 <div className="border border-primary bg-primary/5 rounded-xl p-6 flex flex-col items-center justify-center text-center relative">
                   <button
                     onClick={() => setUploadFile(null)}
                     className="absolute top-3 right-3 text-on-surface-variant hover:text-error transition-colors p-1"
                     title="Hapus file"
                   >
                     <span className="material-symbols-outlined text-[20px]">delete</span>
                   </button>
                   <span className="material-symbols-outlined text-[48px] text-primary mb-2">
                     {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(uploadFile.name.toLowerCase().split('.').pop()) ? 'image' : 'picture_as_pdf'}
                   </span>
                   <p className="text-[13px] font-bold text-on-surface truncate w-full max-w-[260px]">{uploadFile.name}</p>
                   <p className="text-[10px] text-on-surface-variant mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>
               ) : (
                 <div
                   onClick={() => document.getElementById(`modal-file-${selectedDocForUpload.id}`).click()}
                   className="border-2 border-dashed border-primary/40 hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-primary/5 transition-all group hover:scale-[1.01]"
                 >
                   <span className="material-symbols-outlined text-[48px] text-primary mb-3 group-hover:scale-110 transition-transform">
                     cloud_upload
                   </span>
                   <h4 className="text-[13px] font-bold text-on-surface">
                     Tarik berkas ke sini atau <span className="text-primary underline">klik untuk mencari</span>
                   </h4>
                   <p className="text-[10px] text-on-surface-variant mt-2 max-w-xs leading-normal">
                     Mendukung format PDF, JPG, atau PNG dengan ukuran maksimal 10MB.
                   </p>
                 </div>
               )}

               <div className="mt-6 flex gap-3">
                 <button
                   onClick={() => setSelectedDocForUpload(null)}
                   className="flex-1 py-2 border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container-low transition-colors text-center"
                 >
                   Batal
                 </button>
                 <button
                    disabled={!uploadFile || isUploadingFile}
                    onClick={async () => {
                      if (!uploadFile) return;
                      setIsUploadingFile(true);
                      try {
                        const uploadRes = await uploadDocumentFile(
                          uploadFile, 
                          activeCase.id, 
                          selectedDocForUpload.name
                        );
                        const fileData = {
                          name: uploadRes.name || uploadFile.name,
                          url: uploadRes.path || uploadRes.url
                        };
                        handleUpdateChecklistStatus(selectedDocForUpload.id, 'Perlu Verifikasi', fileData);
                        toast.success('Dokumen fisik berhasil diunggah!');
                        setSelectedDocForUpload(null);
                      } catch (err) {
                        console.error(err);
                        toast.error('Gagal mengunggah dokumen: ' + err.message);
                      } finally {
                        setIsUploadingFile(false);
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      uploadFile && !isUploadingFile
                        ? 'bg-primary text-on-primary hover:opacity-90 cursor-pointer shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
                    }`}
                  >
                    {isUploadingFile ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">publish</span>
                        Unggah Dokumen
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* === MODAL: REVIEW / FACT-CHECK DOCUMENT === */}
        {selectedDocForReview && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-lg p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDocForReview(null)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide border-b pb-2 mb-4">
                Verifikasi Dokumen: {selectedDocForReview.name}
              </h3>

              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 flex flex-col items-center justify-center min-h-[300px] relative">
                {selectedDocForReview.fileUrl ? (
                  isImageFile(selectedDocForReview.fileUrl, selectedDocForReview.fileName) ? (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <img 
                        src={selectedDocForReview.fileUrl} 
                        className="max-h-[260px] max-w-full object-contain rounded-lg border border-outline-variant shadow-sm"
                        alt="Pratinjau Dokumen"
                      />
                      <p className="text-[11px] text-on-surface-variant font-medium truncate w-full text-center">
                        File: {selectedDocForReview.fileName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-white border border-outline-variant rounded-lg shadow-sm w-full max-w-[320px] text-center">
                      <span className="material-symbols-outlined text-[48px] text-primary mb-2">picture_as_pdf</span>
                      <p className="text-[12.5px] font-bold text-on-surface truncate w-full">{selectedDocForReview.fileName || 'Dokumen PDF'}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">Dokumen ini bertipe PDF. Klik tombol di bawah untuk membukanya.</p>
                      <a 
                        href={selectedDocForReview.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="mt-4 px-4 py-2 bg-primary text-white text-[11px] font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        Buka PDF di Tab Baru
                      </a>
                    </div>
                  )
                ) : (
                  <div className="w-[300px] h-[200px] bg-white border border-outline-variant shadow rounded-lg p-4 flex flex-col justify-between text-on-surface relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/5 z-0 flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-amber-600 text-[32px] mb-1">pending_actions</span>
                      <p className="text-[11px] font-bold text-amber-800">Menunggu Verifikasi Dokumen</p>
                      <p className="text-[9px] text-on-surface-variant mt-1 leading-tight">Dokumen diunggah tanpa lampiran file fisik atau lampiran tidak tersedia. Gunakan tombol verifikasi di bawah untuk menyetujui dokumen ini.</p>
                    </div>
                    <div className="border-b pb-2 flex justify-between items-center opacity-20 select-none">
                      <div className="flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{selectedDocForReview.name}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-2 py-4 opacity-20 select-none">
                      <div className="w-full h-2 bg-surface-container-high rounded"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    handleUpdateChecklistStatus(selectedDocForReview.id, 'Belum Ada');
                    setSelectedDocForReview(null);
                  }}
                  className="flex-1 py-2.5 border border-error/30 text-error rounded-lg text-[13px] font-bold hover:bg-error/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Tolak Dokumen
                </button>
                <button
                  onClick={() => {
                    handleUpdateChecklistStatus(selectedDocForReview.id, 'Sudah Diterima');
                    setSelectedDocForReview(null);
                  }}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Setujui & Verifikasi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL: CONFIRM SUBMIT / COMPLETE CASE === */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-sm p-6 relative shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>

              {submitSuccess ? (
                <div className="py-6 animate-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-[64px] text-secondary mb-3 animate-bounce">
                    check_circle
                  </span>
                  <h3 className="font-bold text-on-surface text-[18px] mb-2">Proses Selesai!</h3>
                  <p className="text-[13px] text-on-surface-variant font-semibold">
                    Status berkas berhasil diubah menjadi "Selesai".
                  </p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary text-[48px] mb-3">
                    task_alt
                  </span>
                  <h3 className="font-bold text-on-surface text-[16px] mb-2">Selesaikan Berkas?</h3>
                  <p className="text-[13px] text-on-surface-variant mb-6 leading-relaxed font-medium">
                    Apakah Anda yakin ingin menyelesaikan pemrosesan berkas ini? Tindakan ini akan mengubah status pengerjaan menjadi <strong>Selesai (100%)</strong>.
                  </p>

                  {receivedCount < totalCount && (
                    <div className="bg-error-container/20 border border-error-container rounded-lg p-3 text-left mb-6 flex gap-2.5 items-start">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0">warning</span>
                      <p className="text-error text-[11px] font-bold leading-normal">
                        Peringatan: Ada {totalCount - receivedCount} dokumen persyaratan yang belum lengkap! Tetap lanjutkan?
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-2.5 border border-outline-variant rounded-lg text-[13px] font-bold hover:bg-surface-container-low transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmitCase}
                      className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-md"
                    >
                      Ya, Selesaikan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* === MODAL: SHARE TRACKING LINK === */}
        {showShareModal && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setPhoneNum('');
                  setCopied(false);
                }}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[28px]">share</span>
                <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide">
                  Bagikan Link Pelacakan
                </h3>
              </div>
              <p className="text-[12.5px] text-on-surface-variant border-b pb-3 mb-4 font-medium leading-normal">
                Klien dapat memantau progres berkas secara real-time. Bagikan link pelacakan untuk berkas milik <strong className="text-on-surface">{activeCase.clientName}</strong>.
              </p>

              {/* Link Box */}
              <div className="space-y-2 mb-5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Link Pelacakan Klien</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/status?case=${activeCase.caseNumber}`}
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-[12px] font-mono text-on-surface select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/status?case=${activeCase.caseNumber}`;
                      copyToClipboard(link).then(() => {
                        setCopied(true);
                        toast.success('Link pelacakan berhasil disalin!');
                        setTimeout(() => setCopied(false), 2000);
                      }).catch(() => {
                        toast.error('Gagal menyalin link.');
                      });
                    }}
                    className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                      copied 
                        ? 'bg-secondary text-on-secondary shadow-sm' 
                        : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.97]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                  <span className="text-[12.5px] font-bold uppercase tracking-wider">Pindai QR Code Pelacakan</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-md border border-outline-variant/60 flex items-center justify-center animate-in zoom-in-95 duration-300">
                  <QRCodeSVG 
                    id={"qr-svg-" + activeCase.caseNumber.replace(/\//g, "-")}
                    value={`${window.location.origin}/status?case=${activeCase.caseNumber}`} 
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <button
                  onClick={() => handleDownloadQR(activeCase.caseNumber)}
                  className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 active:scale-[0.97] rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Unduh Gambar QR</span>
                </button>
                
                <p className="text-[11px] text-on-surface-variant text-center max-w-[280px] leading-normal font-medium">
                  Arahkan kamera smartphone Anda ke kode QR untuk langsung melihat progres pengerjaan akta klien secara real-time.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-outline-variant flex justify-end">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setCopied(false);
                  }}
                  className="px-5 py-2 border border-outline-variant rounded-lg text-[12px] font-bold hover:bg-surface-container-low transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL: EDIT CASE DETAILS & FEES === */}
        {showEditDetailsModal && (
          <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-outline-variant rounded-xl w-full max-w-md p-6 relative shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowEditDetailsModal(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[28px]">edit_document</span>
                <h3 className="font-bold text-[16px] text-primary uppercase tracking-wide">
                  Ubah Detail & Biaya Berkas
                </h3>
              </div>
              <p className="text-[12.5px] text-on-surface-variant border-b pb-3 mb-4 font-medium leading-normal">
                Perbarui informasi transaksi dan administrasi berkas milik <strong className="text-on-surface">{activeCase.clientName}</strong>.
              </p>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {/* Biaya Akta */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Biaya Akta (Rupiah)
                  </label>
                  <CurrencyInput
                    value={editFees}
                    onChange={(val) => {
                      setEditFees(val);
                      if (editPaidAmount >= val && val > 0) {
                        setEditPaymentStatus('Lunas');
                      } else if (editPaidAmount > 0) {
                        setEditPaymentStatus('DP');
                      } else {
                        setEditPaymentStatus('Belum Lunas');
                      }
                    }}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none font-semibold"
                    placeholder="Contoh: 12.000.000"
                  />
                </div>

                {/* Nominal Dibayar */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Nominal Dibayar (Rupiah)
                  </label>
                  <CurrencyInput
                    value={editPaidAmount}
                    onChange={(val) => {
                      setEditPaidAmount(val);
                      if (val >= editFees && editFees > 0) {
                        setEditPaymentStatus('Lunas');
                      } else if (val > 0) {
                        setEditPaymentStatus('DP');
                      } else {
                        setEditPaymentStatus('Belum Lunas');
                      }
                    }}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none font-semibold"
                    placeholder="Contoh: 5.000.000"
                  />
                </div>

                {/* Status Pembayaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Status Pembayaran
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none font-bold"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="DP">DP (Down Payment)</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                {/* Lokasi Objek */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Lokasi Objek
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none"
                    placeholder="Contoh: Jakarta Selatan"
                  />
                </div>

                {/* Bank Rekanan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Bank Rekanan
                  </label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none"
                    placeholder="Contoh: Bank Mandiri"
                  />
                </div>

                {/* Estimasi Selesai */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Estimasi Selesai
                  </label>
                  <input
                    type="date"
                    value={editEstimationDate}
                    onChange={(e) => setEditEstimationDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none"
                  />
                </div>

                {/* Catatan / Remarks */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Catatan Notaris / Remarks
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] text-on-surface focus:outline-none"
                    rows="3"
                    placeholder="Tulis catatan khusus berkas..."
                  />
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-outline-variant flex gap-3">
                <button
                  onClick={() => setShowEditDetailsModal(false)}
                  className="flex-1 py-2 border border-outline-variant rounded-lg text-[12.5px] font-bold hover:bg-surface-container-low transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-[12.5px] font-bold hover:opacity-90 transition-all shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};

export default DocumentDetailPage;
