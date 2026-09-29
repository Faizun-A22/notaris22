import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useCases } from '../../hooks/useCases';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';
import { uploadDocumentFile, getSignedDocumentUrl } from '../../lib/storage';
import { getStagesForCase } from '../../utils/getStagesForCase';
import { LocationSearchInput } from '../../components/common/LocationSearchInput';

const DocThumbnail = ({ fileUrl, fileName, onClick }) => {
  const [resolvedUrl, setResolvedUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!fileUrl) {
      setResolvedUrl('');
      return;
    }
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
      setResolvedUrl(fileUrl);
    } else {
      getSignedDocumentUrl(fileUrl, 3600).then((url) => {
        if (isMounted) setResolvedUrl(url || fileUrl);
      });
    }
    return () => { isMounted = false; };
  }, [fileUrl]);

  const cleanUrl = (fileUrl || '').split('?')[0].toLowerCase();
  const cleanName = (fileName || '').toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'];
  const isImg = imageExtensions.some(ext => cleanUrl.endsWith('.' + ext) || cleanName.endsWith('.' + ext)) || fileUrl?.startsWith('data:image/') || fileUrl?.startsWith('blob:');

  if (isImg && resolvedUrl) {
    return (
      <div 
        onClick={onClick}
        className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs group relative"
        title="Klik untuk memperbesar gambar (Pratinjau Layar Penuh)"
      >
        <img src={resolvedUrl} alt={fileName || 'Thumbnail'} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[20px]">fullscreen</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-100 transition-all shadow-xs"
      title="Klik untuk pratinjau dokumen"
    >
      <span className="material-symbols-outlined text-[24px]">
        {fileName?.toLowerCase().endsWith('.pdf') || fileUrl?.toLowerCase().includes('.pdf') ? 'picture_as_pdf' : 'description'}
      </span>
    </div>
  );
};

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

const CurrencyInput = ({ id, value, onChange, className, placeholder, required = false, disabled = false }) => {
  const [tempValue, setTempValue] = useState(formatNumberWithDots(value));

  useEffect(() => {
    setTempValue(formatNumberWithDots(value));
  }, [value]);

  const handleChange = (e) => {
    if (disabled) return;
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
      disabled={disabled}
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
  const { profile } = useAuth();
  const isOwner = profile?.role === 'owner';

  // Find the current case
  const activeCase = cases.find((c) => c.id === id);

  // States for modals
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);

  // Zoom & Rotation state for document preview
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Share link states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNum, setPhoneNum] = useState('');

  // Edit remarks state
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  // Edit details state
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editFees, setEditFees] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editEstimationDate, setEditEstimationDate] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Belum Lunas');
  const [editPaidAmount, setEditPaidAmount] = useState(0);

  // Payment installment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Handle record payment installment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(newPaymentAmount) || 0;
    if (amountNum <= 0) {
      toast.error('Harap masukkan nominal pembayaran yang valid (lebih dari 0).');
      return;
    }

    try {
      const currentHistory = activeCase.paymentHistory || [];
      const newEntry = {
        id: `PAY-${Date.now()}`,
        amount: amountNum,
        note: newPaymentNote.trim() || `Cicilan ke-${currentHistory.length + 1}`,
        date: newPaymentDate || new Date().toISOString().split('T')[0],
        recordedBy: profile?.full_name || 'Staf',
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [newEntry, ...currentHistory];
      const newTotalPaid = updatedHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const totalFees = Number(activeCase.fees || 0);

      let newStatus = 'Belum Lunas';
      if (totalFees > 0 && newTotalPaid >= totalFees) {
        newStatus = 'Lunas';
      } else if (newTotalPaid > 0) {
        newStatus = 'DP / Cicilan';
      }

      await updateCase(activeCase.id, {
        paymentHistory: updatedHistory,
        paidAmount: newTotalPaid,
        paymentStatus: newStatus,
      });

      setNewPaymentAmount(0);
      setNewPaymentNote('');
      setNewPaymentDate(new Date().toISOString().split('T')[0]);
      toast.success(`Pembayaran cicilan Rp ${amountNum.toLocaleString('id-ID')} berhasil dicatat!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mencatat pembayaran cicilan.');
    }
  };

  // Handle remove payment entry
  const handleRemovePaymentEntry = async (entryId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan pembayaran cicilan ini?')) return;
    try {
      const currentHistory = activeCase.paymentHistory || [];
      const updatedHistory = currentHistory.filter(item => item.id !== entryId);
      const newTotalPaid = updatedHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const totalFees = Number(activeCase.fees || 0);

      let newStatus = 'Belum Lunas';
      if (totalFees > 0 && newTotalPaid >= totalFees) {
        newStatus = 'Lunas';
      } else if (newTotalPaid > 0) {
        newStatus = 'DP / Cicilan';
      }

      await updateCase(activeCase.id, {
        paymentHistory: updatedHistory,
        paidAmount: newTotalPaid,
        paymentStatus: newStatus,
      });

      toast.success('Catatan pembayaran cicilan berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus catatan pembayaran.');
    }
  };

  // Helper function for checking image file
  const isImageFile = (url, name) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    const cleanName = (name || '').toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    
    const urlExt = cleanUrl.split('.').pop();
    const nameExt = cleanName.split('.').pop();
    
    if (imageExtensions.includes(urlExt) || imageExtensions.includes(nameExt)) return true;
    if (url.startsWith('data:image/') || url.startsWith('blob:')) return true;
    return false;
  };

  // States for modal resolved URLs
  const [previewResolvedUrl, setPreviewResolvedUrl] = useState('');
  const [reviewResolvedUrl, setReviewResolvedUrl] = useState('');

  // Resolve preview document URL dynamically
  useEffect(() => {
    let mounted = true;
    const resolvePreviewUrl = async () => {
      if (!selectedDocForPreview?.fileUrl) {
        setPreviewResolvedUrl('');
        return;
      }
      const rawUrl = selectedDocForPreview.fileUrl;
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
        setPreviewResolvedUrl(rawUrl);
      } else {
        const signed = await getSignedDocumentUrl(rawUrl, 3600);
        if (mounted) setPreviewResolvedUrl(signed || rawUrl);
      }
    };

    resolvePreviewUrl();
    return () => { mounted = false; };
  }, [selectedDocForPreview]);

  // Resolve review document URL dynamically
  useEffect(() => {
    let mounted = true;
    const resolveReviewUrl = async () => {
      if (!selectedDocForReview?.fileUrl) {
        setReviewResolvedUrl('');
        return;
      }
      const rawUrl = selectedDocForReview.fileUrl;
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
        setReviewResolvedUrl(rawUrl);
      } else {
        const signed = await getSignedDocumentUrl(rawUrl, 3600);
        if (mounted) setReviewResolvedUrl(signed || rawUrl);
      }
    };

    resolveReviewUrl();
    return () => { mounted = false; };
  }, [selectedDocForReview]);

  // Reset zoom & rotation when preview target changes
  useEffect(() => {
    setZoomScale(1);
    setRotationAngle(0);
  }, [selectedDocForPreview]);

  useEffect(() => {
    if (!selectedDocForUpload) {
      setUploadFile(null);
    }
  }, [selectedDocForUpload]);

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

  // Download document handler
  const handleDownloadDocument = async (fileUrl, fileName) => {
    try {
      toast.loading('Mengunduh berkas...', { id: 'download-file-toast' });
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'dokumen';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Berkas berhasil diunduh!', { id: 'download-file-toast' });
    } catch (err) {
      console.error(err);
      window.open(fileUrl, '_blank');
      toast.dismiss('download-file-toast');
    }
  };

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
      const payload = {
        notes: editNotes,
        propertyLocation: editLocation,
        bankPartner: editBank,
        estimationDate: editEstimationDate,
      };

      if (isOwner) {
        payload.fees = Number(editFees) || 0;
        payload.paymentStatus = editPaymentStatus;
        payload.paidAmount = Number(editPaidAmount) || 0;
      }

      await updateCase(activeCase.id, payload);
      setShowEditDetailsModal(false);
      toast.success('Detail berkas berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui detail berkas: ' + (err.message || ''));
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
  const stages = getStagesForCase(activeCase);




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

  const checkIsPaymentLunas = () => {
    if (!activeCase) return false;
    const fees = Number(activeCase.fees || 0);
    const paid = Number(activeCase.paidAmount || 0);
    const status = activeCase.paymentStatus;
    if (status === 'Lunas') return true;
    if (fees > 0 && paid >= fees) return true;
    if (fees === 0 && paid >= 0) return true;
    return false;
  };

  const handleAdvanceStage = async () => {
    const activeStageId = getActiveStageId();
    const nextStage = stages.find((s) => s.id === activeStageId + 1);
    if (nextStage) {
      if (nextStage.statusKey === 'Selesai' && !checkIsPaymentLunas()) {
        toast.error('Gagal menyelesaikan berkas: Pembayaran belum LUNAS! Silakan lunasi cicilan pembayaran terlebih dahulu.', { duration: 5000 });
        setShowPaymentModal(true);
        return;
      }
      try {
        await updateCaseStage(activeCase.id, nextStage.id, nextStage.statusKey);
        toast.success(`Berhasil melanjutkan ke tahap: ${nextStage.label}`);
      } catch (err) {
        toast.error(err.message || 'Gagal memperbarui tahapan berkas.');
      }
    } else {
      if (!checkIsPaymentLunas()) {
        toast.error('Gagal menyelesaikan berkas: Pembayaran belum LUNAS! Silakan lunasi cicilan pembayaran terlebih dahulu.', { duration: 5000 });
        setShowPaymentModal(true);
        return;
      }
      try {
        await updateCaseStatus(activeCase.id, 'Selesai');
        toast.success('Semua tahapan selesai! Berkas berhasil diselesaikan.');
      } catch (err) {
        toast.error(err.message || 'Gagal menyelesaikan berkas.');
      }
    }
  };

  const handleSaveRemarks = () => {
    updateCase(activeCase.id, { notes: remarksText });
    setIsEditingRemarks(false);
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
        <div className="flex gap-2.5 items-center">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs bg-white text-[12.5px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak Ringkasan
          </button>

          {activeCase.status !== 'Selesai' ? (
            <button
              onClick={async () => {
                if (!checkIsPaymentLunas()) {
                  toast.error('Gagal menyelesaikan berkas: Pembayaran belum LUNAS! Silakan lunasi cicilan pembayaran terlebih dahulu.', { duration: 5000 });
                  setShowPaymentModal(true);
                  return;
                }
                if (window.confirm('Tandai berkas ini sebagai Selesai (100%)?')) {
                  try {
                    await updateCaseStatus(activeCase.id, 'Selesai');
                    toast.success('Berkas berhasil diselesaikan!');
                  } catch (err) {
                    toast.error(err.message || 'Gagal menyelesaikan berkas.');
                  }
                }
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[12.5px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Selesai</span>
            </button>
          ) : (
            <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-extrabold text-[12.5px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Selesai (100%)</span>
            </span>
          )}
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

      {/* DRAF NOTICE BANNER */}
      {activeCase.isDraft && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <span className="material-symbols-outlined text-[24px]">draft</span>
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-amber-900">Dokumen Berstatus DRAF</h4>
              <p className="text-[12px] text-amber-700 font-medium">Berkas ini disimpan sebagai draf dan belum masuk ke antrean kerja resmi staf.</p>
            </div>
          </div>
          <button
            onClick={handlePublishDraft}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-[12.5px] flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            <span>Terbitkan Berkas Resmi</span>
          </button>
        </div>
      )}

      {/* Unified Soft 3D Client Card */}
      <section className="bg-white rounded-[26px] border border-slate-200/80 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_10px_30px_rgba(112,144,176,0.06)] print:mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[28px]">person</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[20px] font-black text-slate-800 tracking-tight">
                {activeCase.clientName}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                activeCase.isDraft 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-[#F2F1FD] text-[#6366F1] border border-[#E0DDFB]'
              }`}>
                {activeCase.isComplete ? 'Selesai' : activeCase.isDraft ? 'Draf' : 'Aktif'}
              </span>
            </div>
            <p className="text-slate-400 flex items-center gap-1.5 text-[12.5px] mt-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">gavel</span>
              {activeCase.serviceType === 'AJB' ? 'Akta Jual Beli (AJB)' : activeCase.serviceType === 'SKMHT' ? 'Surat Kuasa Membebankan Hak Tanggungan (SKMHT)' : activeCase.serviceType} &bull; #{activeCase.caseNumber} &bull; ID: {activeCase.clientId || 'NOTARY-2024'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 print:hidden items-center">
          <div className="text-right mr-3 hidden md:block select-none">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Kondisi Berkas</p>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
              activeCase.isComplete 
                ? 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]' 
                : activeCase.isDraft
                ? 'bg-[#FEF8EB] text-[#D97706] border border-[#FDEECC]'
                : !activeCase.documentsReady 
                ? 'bg-[#FEF8EB] text-[#D97706] border border-[#FDEECC]' 
                : 'bg-[#EDFAF3] text-[#10B981] border border-[#D5F5E4]'
            }`}>
              {activeCase.isComplete ? 'Selesai' : activeCase.isDraft ? 'Menunggu Diterbitkan' : !activeCase.documentsReady ? 'Menunggu Klien' : 'Aktif Diproses'}
            </span>
          </div>
          {activeCase.isDraft && (
            <button
              onClick={handlePublishDraft}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all text-[12px] flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span>Terbitkan Berkas</span>
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2.5 border border-slate-200 text-[#6366F1] bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl font-bold transition-all text-[12px] flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Bagikan Link</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-2xl font-bold transition-all text-[12px] flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Kelola Cicilan</span>
          </button>
          <button
            onClick={() => setShowEditDetailsModal(true)}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-2xl font-bold transition-all text-[12px] flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Ubah Detail</span>
          </button>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="px-4 py-2.5 btn-primary-3d rounded-2xl font-bold text-[12px]"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </section>

      {/* Grid Data Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-[26px] border border-slate-200/80 shadow-[0_10px_30px_rgba(112,144,176,0.06)] print:mb-4">
        {[
          { label: 'Tanggal Registrasi', value: formatDate(activeCase.entryDate), icon: 'calendar_today', color: 'text-primary' },
          { label: 'Estimasi Selesai', value: formatDate(activeCase.estimationDate), icon: 'event_available', color: 'text-error' },
          { label: 'Biaya Akta', value: `Rp ${(activeCase.fees || 0).toLocaleString('id-ID')}`, icon: 'payments', color: 'text-primary', onClick: () => setShowPaymentModal(true) },
          { 
            label: 'Status Pembayaran', 
            value: `${activeCase.paymentStatus || 'Belum Lunas'} (Dibayar: Rp ${(activeCase.paidAmount || 0).toLocaleString('id-ID')})`, 
            icon: 'credit_card', 
            color: activeCase.paymentStatus === 'Lunas' ? 'text-secondary' : (activeCase.paymentStatus === 'DP' || activeCase.paymentStatus === 'DP / Cicilan') ? 'text-primary' : 'text-error',
            onClick: () => setShowPaymentModal(true)
          },
          { label: 'Lokasi Objek', value: activeCase.propertyLocation || 'Jakarta Selatan', icon: 'location_on', color: 'text-primary' },
          { label: 'Bank Rekanan', value: activeCase.bankPartner || 'Bank Mandiri', icon: 'corporate_fare', color: 'text-primary' },
          { label: 'Staf Penanggung Jawab', value: activeCase.assignedStaff || 'Ani Lestari, S.H.', icon: 'engineering', color: 'text-primary' },
          { label: 'Status Kelengkapan', value: `${receivedCount} dari ${totalCount} Dokumen Diterima`, icon: 'checklist', color: 'text-primary' }
        ].map((item, index) => (
          <div 
            key={index} 
            onClick={item.onClick}
            className={`p-4 rounded-xl flex items-start gap-3 text-left transition-all ${
              item.onClick 
                ? 'bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-200/60 cursor-pointer group shadow-2xs' 
                : 'bg-surface-container-low border border-transparent'
            }`}
            title={item.onClick ? 'Klik untuk mengelola cicilan & pembayaran' : undefined}
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-outline-variant/60 flex items-center justify-center shrink-0">
              <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{item.label}</span>
                {item.onClick && (
                  <span className="text-[9.5px] text-emerald-700 font-extrabold underline group-hover:text-emerald-900">Kelola</span>
                )}
              </p>
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
            <div className="flex flex-col gap-3">
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
                    className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 sm:p-4.5 transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {item.fileUrl ? (
                        <DocThumbnail 
                          fileUrl={item.fileUrl} 
                          fileName={item.fileName || item.name} 
                          onClick={() => setSelectedDocForPreview(item)} 
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isReview 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200/60' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200/60'
                        }`}>
                          <span className="material-symbols-outlined text-[22px]">
                            {isReview ? 'priority_high' : 'folder_open'}
                          </span>
                        </div>
                      )}

                      {/* Title, Subtitle, and Inline Tags */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-black text-[14.5px] text-slate-800 tracking-tight leading-snug">
                            {idx + 1}. {item.name}
                          </h5>
                          
                          {/* Wajib / Opsional Badge */}
                          <span className={`px-2 py-0.5 text-[9.5px] font-extrabold rounded-md uppercase tracking-wider ${
                            isMandatory 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                          }`}>
                            {isMandatory ? 'Wajib' : 'Opsional'}
                          </span>

                          {/* Status Pill Badge */}
                          {isReceived ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase">
                              Sudah Diterima
                            </span>
                          ) : isReview ? (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full uppercase">
                              Perlu Verifikasi
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full uppercase">
                              Belum Diunggah
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">
                          {item.desc}
                        </p>

                        {/* Verification / Upload metadata info */}
                        {isReceived && (
                          <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-emerald-500">verified</span>
                            <span>Pemeriksa: <strong className="text-slate-700 font-bold">{verifierInitials}</strong> &bull; Tgl: {dateNote}</span>
                          </p>
                        )}
                        {isReview && (
                          <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                            <span>Dokumen telah diunggah dan sedang dalam peninjauan.</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Icon-Only Action Buttons Row */}
                    <div className="flex items-center gap-1.5 shrink-0 print:hidden pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                      {isReceived ? (
                        <>
                          <button
                            onClick={() => setSelectedDocForPreview(item)}
                            className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6366F1] hover:bg-[#6366F1] hover:text-white border border-indigo-100 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Lihat Pratinjau Dokumen"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          <button
                            onClick={() => setSelectedDocForUpload(item)}
                            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Ganti / Upload Berkas Baru"
                          >
                            <span className="material-symbols-outlined text-[18px]">sync</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Batalkan upload berkas "${item.name}"? Status akan dikembalikan ke Belum Ada.`)) {
                                handleUpdateChecklistStatus(item.id, 'Belum Ada');
                              }
                            }}
                            className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/60 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Batalkan Upload / Hapus Lampiran"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </>
                      ) : isReview ? (
                        <>
                          <button
                            onClick={() => setSelectedDocForReview(item)}
                            className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Tinjau & Verifikasi Berkas"
                          >
                            <span className="material-symbols-outlined text-[18px]">fact_check</span>
                          </button>

                          <button
                            onClick={() => setSelectedDocForUpload(item)}
                            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Ganti / Upload Berkas Baru"
                          >
                            <span className="material-symbols-outlined text-[18px]">sync</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Batalkan upload berkas "${item.name}"? Status akan dikembalikan ke Belum Ada.`)) {
                                handleUpdateChecklistStatus(item.id, 'Belum Ada');
                              }
                            }}
                            className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/60 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Batalkan Upload / Hapus Lampiran"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedDocForUpload(item)}
                          className="h-9 px-3.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-[12px] font-extrabold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                          title="Upload Berkas"
                        >
                          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                          <span>Upload</span>
                        </button>
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
                { timestamp: activeCase.createdAt || new Date().toISOString(), user: 'Sistem', action: 'Berkas didaftarkan / berkas masuk ke dalam sistem' }
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
                            {stage.id}. {stage.label}
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
        {/* === MODAL: PREVIEW DOCUMENT WITH ZOOM, ROTATE, DOWNLOAD, EDIT === */}
        {selectedDocForPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none">
            <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-4xl p-5 sm:p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6366F1] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">visibility</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[16px] text-slate-800 truncate">
                      Pratinjau: {selectedDocForPreview.name}
                    </h3>
                    {selectedDocForPreview.fileName && (
                      <p className="text-[11.5px] text-slate-400 font-medium truncate">
                        File: {selectedDocForPreview.fileName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Action Toolbar */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedDocForPreview.fileUrl && (
                    <>
                      {/* Edit / Replace Button */}
                      <button
                        onClick={() => {
                          const targetDoc = selectedDocForPreview;
                          setSelectedDocForPreview(null);
                          setSelectedDocForUpload(targetDoc);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-[#6366F1] hover:bg-indigo-100 border border-indigo-100 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Ganti / Upload Ulang Dokumen Ini"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span className="hidden sm:inline">Ganti Dokumen</span>
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownloadDocument(selectedDocForPreview.fileUrl, selectedDocForPreview.fileName || selectedDocForPreview.name)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Unduh File Ke Komputer"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span className="hidden sm:inline">Unduh</span>
                      </button>

                      {/* Cancel Upload / Delete Attachment Button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Batalkan upload berkas "${selectedDocForPreview.name}"? Status akan dikembalikan ke Belum Ada.`)) {
                            handleUpdateChecklistStatus(selectedDocForPreview.id, 'Belum Ada');
                            setSelectedDocForPreview(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Batalkan Upload / Hapus Lampiran Ini"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span className="hidden sm:inline">Batal Upload</span>
                      </button>
                    </>
                  )}

                  {/* Close Modal Button */}
                  <button
                    onClick={() => setSelectedDocForPreview(null)}
                    className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Toolbar Controls for Images (Zoom In, Zoom Out, Rotate, Fit) */}
              {selectedDocForPreview.fileUrl && isImageFile(selectedDocForPreview.fileUrl, selectedDocForPreview.fileName) && (
                <div className="py-2.5 px-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[12px] font-bold text-slate-600 shrink-0 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-extrabold uppercase mr-1">Zoom:</span>
                    <button
                      onClick={() => setZoomScale(prev => Math.max(0.4, prev - 0.25))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-all cursor-pointer active:scale-95"
                      title="Perkecil (Zoom Out)"
                    >
                      <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                    </button>

                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-black text-[#6366F1] min-w-[54px] text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>

                    <button
                      onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-all cursor-pointer active:scale-95"
                      title="Perbesar (Zoom In)"
                    >
                      <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                    </button>

                    <button
                      onClick={() => {
                        setZoomScale(1);
                        setRotationAngle(0);
                      }}
                      className="px-2.5 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 text-[11.5px] text-slate-600 font-bold transition-all cursor-pointer"
                      title="Reset Zoom & Putar"
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
                      className="px-3 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 text-[11.5px] text-slate-700 font-bold transition-all cursor-pointer"
                      title="Putar Gambar 90 Derajat"
                    >
                      <span className="material-symbols-outlined text-[16px]">rotate_right</span>
                      <span>Putar 90°</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Viewer Canvas */}
              <div className="flex-1 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center min-h-[350px] overflow-auto relative my-4 custom-scrollbar">
                {(previewResolvedUrl || selectedDocForPreview.fileUrl) ? (
                  isImageFile(previewResolvedUrl || selectedDocForPreview.fileUrl, selectedDocForPreview.fileName) ? (
                    <div 
                      onClick={() => {
                        const targetUrl = previewResolvedUrl || selectedDocForPreview.fileUrl;
                        if (targetUrl) {
                          window.open(targetUrl, '_blank');
                        }
                      }}
                      className="flex flex-col items-center justify-center w-full h-full min-h-[320px] overflow-auto custom-scrollbar p-2 cursor-pointer group"
                      title="Klik untuk membuka gambar ukuran penuh di Tab Baru"
                    >
                      <div className="relative overflow-hidden rounded-xl shadow-lg border border-slate-200/80 group">
                        <img 
                          src={previewResolvedUrl || selectedDocForPreview.fileUrl} 
                          alt={selectedDocForPreview.name}
                          style={{
                            transform: `scale(${zoomScale}) rotate(${rotationAngle}deg)`,
                            transition: 'transform 0.2s ease-out'
                          }}
                          className="max-h-[60vh] max-w-full object-contain select-none transition-transform group-hover:scale-[1.01]"
                          onError={(e) => {
                            console.error('Image load failed');
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white pointer-events-none p-4 text-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-md">
                            <span className="material-symbols-outlined text-[28px]">open_in_new</span>
                          </div>
                          <span className="text-[12.5px] font-extrabold tracking-wide drop-shadow-md">Klik untuk Buka Gambar Penuh di Tab Baru</span>
                        </div>
                      </div>
                    </div>
                  ) : (previewResolvedUrl || selectedDocForPreview.fileUrl).toLowerCase().includes('.pdf') || (selectedDocForPreview.fileName && selectedDocForPreview.fileName.toLowerCase().endsWith('.pdf')) ? (
                    <div className="w-full h-[65vh] flex flex-col items-center justify-between">
                      <iframe 
                        src={previewResolvedUrl || selectedDocForPreview.fileUrl} 
                        className="w-full h-full rounded-xl border border-slate-200 shadow-sm" 
                        title={selectedDocForPreview.name}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-7 text-center shadow-sm space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center mx-auto shadow-xs">
                        <span className="material-symbols-outlined text-[36px]">description</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[15px] text-slate-800">{selectedDocForPreview.fileName || selectedDocForPreview.name}</h4>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">Berkas lampiran dokumen fisik tersedia dan siap diunduh.</p>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => handleDownloadDocument(previewResolvedUrl || selectedDocForPreview.fileUrl, selectedDocForPreview.fileName || selectedDocForPreview.name)}
                          className="w-full py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-bold text-[13px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                          <span>Unduh Berkas Ini</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <span className="material-symbols-outlined text-[36px]">folder_open</span>
                    </div>
                    <h4 className="font-extrabold text-slate-700 text-[15px]">Berkas Belum Diunggah</h4>
                    <p className="text-[12.5px] text-slate-400 mt-1 max-w-xs">
                      Dokumen fisik ini belum dilampirkan. Klik tombol 'Ganti / Upload Dokumen' untuk mengunggah berkas.
                    </p>
                    <button
                      onClick={() => {
                        const targetDoc = selectedDocForPreview;
                        setSelectedDocForPreview(null);
                        setSelectedDocForUpload(targetDoc);
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-50 text-[#6366F1] border border-indigo-100 hover:bg-indigo-100 rounded-xl font-bold text-[12.5px] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      <span>Upload Dokumen Sekarang</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
                {(previewResolvedUrl || selectedDocForPreview.fileUrl) ? (
                  <a
                    href={previewResolvedUrl || selectedDocForPreview.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>Buka Gambar Penuh di Tab Baru</span>
                  </a>
                ) : <div />}

                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[13px] transition-colors cursor-pointer"
                >
                  Tutup
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
                          url: uploadRes.url || uploadRes.path
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
                  isImageFile(reviewResolvedUrl || selectedDocForReview.fileUrl, selectedDocForReview.fileName) ? (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div 
                        onClick={() => {
                          const targetUrl = reviewResolvedUrl || selectedDocForReview.fileUrl;
                          if (targetUrl) {
                            window.open(targetUrl, '_blank');
                          }
                        }}
                        className="relative overflow-hidden rounded-xl border border-slate-200/90 shadow-md cursor-pointer group bg-slate-50 flex items-center justify-center max-h-[300px] w-full"
                        title="Klik untuk membuka gambar ukuran penuh di Tab Baru"
                      >
                        <img 
                          src={reviewResolvedUrl || selectedDocForReview.fileUrl} 
                          className="max-h-[280px] max-w-full object-contain transition-transform group-hover:scale-[1.02]"
                          alt="Pratinjau Dokumen"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-1.5 shadow-sm">
                            <span className="material-symbols-outlined text-[24px]">open_in_new</span>
                          </div>
                          <span className="text-[12px] font-extrabold tracking-wide drop-shadow-md">Klik untuk Buka Gambar Penuh di Tab Baru</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full px-1">
                        <p className="text-[11px] text-on-surface-variant font-medium truncate max-w-[240px]">
                          File: {selectedDocForReview.fileName}
                        </p>
                        <button
                          onClick={() => {
                            const targetUrl = reviewResolvedUrl || selectedDocForReview.fileUrl;
                            if (targetUrl) {
                              window.open(targetUrl, '_blank');
                            }
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          <span>Buka Tab Baru</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-white border border-outline-variant rounded-lg shadow-sm w-full max-w-[320px] text-center">
                      <span className="material-symbols-outlined text-[48px] text-primary mb-2">picture_as_pdf</span>
                      <p className="text-[12.5px] font-bold text-on-surface truncate w-full">{selectedDocForReview.fileName || 'Dokumen PDF'}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">Dokumen ini bertipe PDF. Klik tombol di bawah untuk membukanya.</p>
                      <a 
                        href={reviewResolvedUrl || selectedDocForReview.fileUrl} 
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
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Biaya Akta (Rupiah)
                    </label>
                    {!isOwner && (
                      <span className="text-[10px] text-amber-600 font-semibold">(Khusus Notaris Utama)</span>
                    )}
                  </div>
                  <CurrencyInput
                    value={editFees}
                    disabled={!isOwner}
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
                    className={`w-full border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] focus:outline-none font-semibold ${!isOwner ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#F8F9FA] text-on-surface'}`}
                    placeholder="Contoh: 12.000.000"
                  />
                </div>

                {/* Nominal Dibayar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Nominal Dibayar (Rupiah)
                    </label>
                    {!isOwner && (
                      <span className="text-[10px] text-amber-600 font-semibold">(Khusus Notaris Utama)</span>
                    )}
                  </div>
                  <CurrencyInput
                    value={editPaidAmount}
                    disabled={!isOwner}
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
                    className={`w-full border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] focus:outline-none font-semibold ${!isOwner ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#F8F9FA] text-on-surface'}`}
                    placeholder="Contoh: 5.000.000"
                  />
                </div>

                {/* Status Pembayaran */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Status Pembayaran
                    </label>
                    {!isOwner && (
                      <span className="text-[10px] text-amber-600 font-semibold">(Khusus Notaris Utama)</span>
                    )}
                  </div>
                  <select
                    value={editPaymentStatus}
                    disabled={!isOwner}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className={`w-full border border-outline-variant rounded-lg px-3 py-2 text-[12.5px] focus:outline-none font-bold ${!isOwner ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#F8F9FA] text-on-surface'}`}
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
                  <LocationSearchInput
                    value={editLocation}
                    onChange={setEditLocation}
                    placeholder="Contoh: Cafe Koa, Jakarta Selatan..."
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

        {/* === MODAL: KELOLA CICILAN & PEMBAYARAN === */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-2xl p-6 sm:p-7 relative shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">payments</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">
                      Kelola Cicilan & Pembayaran
                    </h3>
                    <p className="text-[12.5px] text-slate-500 font-medium">
                      {activeCase.clientName} &bull; #{activeCase.caseNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1 custom-scrollbar">
                
                {/* 4-Grid Financial Summary Cards */}
                {(() => {
                  const totalFees = Number(activeCase.fees || 0);
                  const totalPaid = Number(activeCase.paidAmount || 0);
                  const remaining = Math.max(0, totalFees - totalPaid);
                  const percentage = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : (totalPaid > 0 ? 100 : 0);

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                          <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Biaya Akta</p>
                          <p className="text-[15px] font-black text-slate-800 mt-1">Rp {totalFees.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/60">
                          <p className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider">Total Terbayar</p>
                          <p className="text-[15px] font-black text-emerald-700 mt-1">Rp {totalPaid.toLocaleString('id-ID')}</p>
                        </div>
                        <div className={`p-3.5 rounded-2xl border ${remaining === 0 && totalFees > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50/60 border-rose-200/60'}`}>
                          <p className={`text-[10.5px] font-bold uppercase tracking-wider ${remaining === 0 && totalFees > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Sisa Tagihan</p>
                          <p className={`text-[15px] font-black mt-1 ${remaining === 0 && totalFees > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Rp {remaining.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/60">
                          <p className="text-[10.5px] font-bold text-indigo-600 uppercase tracking-wider">Status Pelunasan</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${
                              activeCase.paymentStatus === 'Lunas'
                                ? 'bg-emerald-600 text-white'
                                : activeCase.paymentStatus === 'DP' || activeCase.paymentStatus === 'DP / Cicilan'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}>
                              {activeCase.paymentStatus || 'Belum Lunas'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200/70">
                        <div className="flex justify-between items-center text-[12px] font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">donut_large</span>
                            Progres Pembayaran Cicilan
                          </span>
                          <span className="text-emerald-700 font-extrabold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Form Input Record New Installment */}
                <form onSubmit={handleRecordPayment} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
                  <h4 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">add_card</span>
                    Tambah Pembayaran / Cicilan Baru
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Nominal */}
                    <div className="sm:col-span-1 space-y-1 text-left">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Nominal (Rp)
                      </label>
                      <CurrencyInput
                        value={newPaymentAmount}
                        onChange={(val) => setNewPaymentAmount(val)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-extrabold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                        placeholder="Contoh: 2.000.000"
                        required
                      />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div className="sm:col-span-1 space-y-1 text-left">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Keterangan / Catatan
                      </label>
                      <input
                        type="text"
                        value={newPaymentNote}
                        onChange={(e) => setNewPaymentNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                        placeholder="Contoh: DP 2 Juta, Cicilan 2, Pelunasan..."
                      />
                    </div>

                    {/* Tanggal Bayar */}
                    <div className="sm:col-span-1 space-y-1 text-left">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Tanggal Bayar
                      </label>
                      <input
                        type="date"
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12.5px] font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Catat Pembayaran</span>
                    </button>
                  </div>
                </form>

                {/* History Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">history</span>
                      Riwayat Cicilan Pembayaran
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {(activeCase.paymentHistory || []).length} Transaksi
                    </span>
                  </div>

                  {(!activeCase.paymentHistory || activeCase.paymentHistory.length === 0) ? (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[36px] mb-1 text-slate-300">receipt_long</span>
                      <p className="text-[13px] font-semibold">Belum ada riwayat cicilan pembayaran recorded.</p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">Gunakan formulir di atas untuk mencatat pembayaran pertama.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                      <table className="w-full text-left text-[12.5px]">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold text-[10.5px] uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Tgl Bayar</th>
                            <th className="py-3 px-4">Nominal</th>
                            <th className="py-3 px-4">Keterangan</th>
                            <th className="py-3 px-4">Pemeriksa</th>
                            <th className="py-3 px-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeCase.paymentHistory.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                                {formatDate(item.date)}
                              </td>
                              <td className="py-3 px-4 font-black text-emerald-600 whitespace-nowrap">
                                Rp {Number(item.amount || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-600">
                                {item.note || '-'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-500 text-[11.5px] whitespace-nowrap">
                                {item.recordedBy || 'Staf'}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleRemovePaymentEntry(item.id)}
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center cursor-pointer"
                                  title="Hapus Catatan Pembayaran Ini"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[12.5px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  Tutup
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
