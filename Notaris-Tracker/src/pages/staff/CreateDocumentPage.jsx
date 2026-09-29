import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '../../hooks/useCases';
import { getDefaultChecklist } from '../../contexts/CasesContext';
import { uploadDocumentFile } from '../../lib/storage';
import { LocationSearchInput } from '../../components/common/LocationSearchInput';
import toast from 'react-hot-toast';

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

export const CreateDocumentPage = () => {
  const { addCase } = useCases();
  const navigate = useNavigate();

  const serviceOptions = {
    ppat: [
      "Akta Jual Beli", 
      "Akta Hibah", 
      "APHB (Akta Pembagian Hak Bersama)", 
      "APHT (Akta Pemberian Hak Tanggungan)", 
      "Waris", 
      "Roya Hak Tanggungan", 
      "Pemecahan", 
      "Sertifikat Pengganti", 
      "Konversi"
    ],
    notaris: [
      "SKMHT (Surat Kuasa Membebankan Hak Tanggungan)", 
      "Akta Jaminan Fidusia", 
      "Akta Pengikatan Jual Beli", 
      "Akta Surat Kuasa Untuk Menjual", 
      "Akta Perjanjian Sewa Menyewa", 
      "Akta Consen Roya", 
      "Akta Perjanjian Pengikatan Jual Beli", 
      "Akta Perjanjian Kredit", 
      "Akta Pendirian Yayasan", 
      "Akta Pendirian PT", 
      "Akta Pendirian/Perubahan CV"
    ]
  };

  const mapServiceTypeToAbbreviation = (type) => {
    if (type === "Akta Jual Beli") return "AJB";
    if (type === "Akta Hibah") return "HIBAH";
    if (type.includes("APHB")) return "APHB";
    if (type.includes("APHT")) return "APHT";
    if (type.includes("Waris")) return "WARIS";
    if (type.includes("Roya")) return "ROYA";
    if (type.includes("Pemecahan")) return "PECAH";
    if (type.includes("Sertifikat Pengganti")) return "GANTI";
    if (type.includes("Konversi")) return "KONVERSI";
    if (type.includes("Fidusia")) return "FIDUSIA";
    if (type.includes("Perjanjian Pengikatan Jual Beli")) return "APPJB";
    if (type.includes("Pengikatan Jual Beli")) return "APJB";
    if (type.includes("Surat Kuasa Untuk Menjual")) return "SKUM";
    if (type.includes("Sewa Menyewa")) return "SEWA";
    if (type.includes("Consen Roya")) return "CONSEN";
    if (type.includes("Perjanjian Kredit")) return "APK";
    if (type.includes("Yayasan")) return "YAYASAN";
    if (type.includes("SKMHT")) return "SKMHT";
    if (type.includes("HT") || type.includes("Hak Tanggungan")) return "HT";
    if (type.includes("Pendirian PT") || type.includes("PT")) return "PT";
    if (type.includes("Pendirian/Perubahan CV") || type.includes("CV")) return "CV";
    return "CV_PT";
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const calculateEstimationDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 14); // 14 days standard process time
    return date.toISOString().split('T')[0];
  };

  // Form State
  const [step, setStep] = useState(1);
  
  // Step 1: Data Klien
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Step 2: Jenis Layanan
  const [category, setCategory] = useState('ppat');
  const [serviceType, setServiceType] = useState(serviceOptions.ppat[0]);

  // Step 3: Data Objek / Akta
  const [propertyLocation, setPropertyLocation] = useState('');
  const [transactionValue, setTransactionValue] = useState('');
  const [bankPartner, setBankPartner] = useState('');

  // Step 4: Persyaratan (Dynamic Checklist & Uploads)
  const [checklist, setChecklist] = useState([]);
  const [uploads, setUploads] = useState({}); // { docId: { file, name, size, progress, status, previewUrl } }

  // Step 5: Jadwal / Deadline
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [estimationDate, setEstimationDate] = useState(calculateEstimationDate(getTodayDateString()));
  const [hasEstimationDate, setHasEstimationDate] = useState(false);
  const [fees, setFees] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Belum Lunas');
  const [paidAmount, setPaidAmount] = useState(0);

  // Update default fees when serviceType changes
  useEffect(() => {
    const abbrev = mapServiceTypeToAbbreviation(serviceType);
    let defaultFee = 25000000;
    if (abbrev === 'AJB') defaultFee = 12000000;
    else if (abbrev === 'SKMHT') defaultFee = 4500000;
    else if (abbrev === 'HT') defaultFee = 8000000;
    else if (abbrev === 'APHT') defaultFee = 8000000;
    
    setFees(defaultFee);
  }, [serviceType]);

  const handlePaidAmountChange = (val) => {
    const amt = Number(val) || 0;
    setPaidAmount(amt);
    
    if (amt >= fees && fees > 0) {
      setPaymentStatus('Lunas');
    } else if (amt > 0) {
      setPaymentStatus('DP');
    } else {
      setPaymentStatus('Belum Lunas');
    }
  };

  const handleFeesChange = (val) => {
    const f = Number(val) || 0;
    setFees(f);
    
    if (paidAmount >= f && f > 0) {
      setPaymentStatus('Lunas');
    } else if (paidAmount > 0) {
      setPaymentStatus('DP');
    } else {
      setPaymentStatus('Belum Lunas');
    }
  };

  // Step 6: Catatan & State Loading/Modal
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savedDraftData, setSavedDraftData] = useState(null);

  // Initialize and update checklist based on Service Type
  useEffect(() => {
    const abbrev = mapServiceTypeToAbbreviation(serviceType);
    const defaultList = getDefaultChecklist(abbrev) || [];
    setChecklist(defaultList);
  }, [serviceType]);

  // Automatically update estimation date when entry date changes
  useEffect(() => {
    if (entryDate) {
      setEstimationDate(calculateEstimationDate(entryDate));
    }
  }, [entryDate]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setServiceType(serviceOptions[cat][0]);
  };

  // Real Upload via Supabase Storage
  const handleFileChange = async (docId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const uploadId = docId;
    
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        name: file.name,
        size: sizeStr,
        progress: 40,
        status: 'uploading',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        rawFile: file
      }
    }));

    try {
      const uploadRes = await uploadDocumentFile(file, 'new_cases', file.name);
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          name: uploadRes.name || file.name,
          size: sizeStr,
          progress: 100,
          status: 'success',
          url: uploadRes.path || uploadRes.url,
          previewUrl: uploadRes.url,
          rawFile: file
        }
      }));
    } catch (err) {
      console.error('File upload error:', err);
      toast.error(`Gagal mengunggah file ${file.name}: ${err.message}`);
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 100,
          status: 'failed'
        }
      }));
    }
  };

  const handleRetryUpload = async (docId) => {
    const item = uploads[docId];
    if (!item || !item.rawFile) return;

    setUploads(prev => ({
      ...prev,
      [docId]: { ...prev[docId], progress: 40, status: 'uploading' }
    }));

    try {
      const uploadRes = await uploadDocumentFile(item.rawFile, 'new_cases', item.name);
      setUploads(prev => ({
        ...prev,
        [docId]: {
          name: uploadRes.name || item.name,
          size: item.size,
          progress: 100,
          status: 'success',
          url: uploadRes.path || uploadRes.url,
          previewUrl: uploadRes.url,
          rawFile: item.rawFile
        }
      }));
    } catch (err) {
      console.error('Retry upload error:', err);
      toast.error(`Gagal mengunggah file ${item.name}: ${err.message}`);
      setUploads(prev => ({
        ...prev,
        [docId]: { ...prev[docId], progress: 100, status: 'failed' }
      }));
    }
  };

  const handleDeleteUpload = (docId) => {
    setUploads(prev => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
  };

  // Navigation Validations
  const isCurrentStepValid = useMemo(() => {
    switch (step) {
      case 1:
        return clientName.trim() !== '' && clientEmail.trim().includes('@') && clientPhone.trim().length >= 8;
      case 2:
        return true;
      case 3:
        return propertyLocation.trim() !== '' && Number(transactionValue) > 0;
      case 4:
        return !Object.values(uploads).some(u => u.status === 'uploading' || u.status === 'failed');
      case 5:
        if (!entryDate) return false;
        if (hasEstimationDate && (!estimationDate || new Date(estimationDate) < new Date(entryDate))) return false;
        if (fees < 0 || paidAmount < 0 || paidAmount > fees) return false;
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  }, [step, clientName, clientEmail, clientPhone, propertyLocation, transactionValue, uploads, entryDate, hasEstimationDate, estimationDate, fees, paidAmount]);

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (!clientName.trim()) {
          toast.error('Nama klien wajib diisi!');
          return false;
        }
        if (!clientEmail.trim() || !clientEmail.includes('@')) {
          toast.error('Email klien tidak valid!');
          return false;
        }
        if (!clientPhone.trim() || clientPhone.length < 8) {
          toast.error('Nomor telepon klien tidak valid!');
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        if (!propertyLocation.trim()) {
          toast.error('Lokasi objek akta wajib diisi!');
          return false;
        }
        if (!transactionValue || Number(transactionValue) <= 0) {
          toast.error('Nilai transaksi objek wajib diisi dan harus positif!');
          return false;
        }
        return true;
      case 4:
        const inProgress = Object.values(uploads).some(u => u.status === 'uploading');
        if (inProgress) {
          toast.error('Harap tunggu sampai semua upload file selesai!');
          return false;
        }
        return true;
      case 5:
        if (!entryDate) {
          toast.error('Tanggal masuk berkas wajib dipilih!');
          return false;
        }
        if (hasEstimationDate) {
          if (!estimationDate || new Date(estimationDate) < new Date(entryDate)) {
            toast.error('Tanggal estimasi tidak boleh sebelum tanggal masuk!');
            return false;
          }
        }
        if (fees < 0) {
          toast.error('Biaya akta tidak boleh negatif!');
          return false;
        }
        if (paidAmount < 0 || paidAmount > fees) {
          toast.error('Nominal dibayar tidak boleh negatif atau melebihi total biaya!');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Submit and Draft handlers
  const handleSaveDraft = async () => {
    const finalClientName = clientName.trim() || 'Draf Berkas (Tanpa Nama)';

    setSavingDraft(true);
    setLoading(true);
    const mappedService = mapServiceTypeToAbbreviation(serviceType);

    // Build final checklist based on uploads
    const finalChecklist = checklist.map(item => {
      const fileRecord = uploads[item.id];
      if (fileRecord && fileRecord.status === 'success') {
        return {
          ...item,
          status: 'Perlu Verifikasi',
          fileName: fileRecord.name,
          fileSize: fileRecord.size,
          fileUrl: fileRecord.url || fileRecord.previewUrl || null
        };
      }
      return item;
    });

    try {
      const savedCase = await addCase({
        clientName: finalClientName,
        clientEmail: clientEmail.trim() || 'draft@notaris.com',
        clientPhone: clientPhone.trim() || '-',
        serviceType: mappedService,
        category,
        propertyLocation: propertyLocation.trim() || 'Jakarta Selatan',
        transactionValue: transactionValue ? Number(transactionValue) : 0,
        bankPartner: bankPartner || 'Tidak Ada',
        estimationDate: hasEstimationDate ? estimationDate : null,
        entryDate: entryDate || getTodayDateString(),
        notes: notes || 'Draf berkas terdaftar.',
        checklist: finalChecklist,
        status: 'Pemeriksaan Dokumen',
        isDraft: true,
        fees: Number(fees) || 0,
        paymentStatus,
        paidAmount: Number(paidAmount) || 0
      });

      setLoading(false);
      setSavingDraft(false);
      setSavedDraftData(savedCase || { id: '', clientName: finalClientName, caseNumber: 'DRAF' });
      setShowDraftModal(true);
      toast.success('Draf berkas berhasil disimpan!');
    } catch (err) {
      console.error('Save draft error:', err);
      setLoading(false);
      setSavingDraft(false);
      toast.error('Gagal menyimpan draf berkas: ' + (err.message || ''));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(3) || !validateStep(5)) return;

    const failedUploads = Object.values(uploads).filter(u => u.status === 'failed');
    const inProgressUploads = Object.values(uploads).filter(u => u.status === 'uploading');

    if (inProgressUploads.length > 0) {
      toast.error('Masih ada berkas yang sedang diunggah. Mohon tunggu hingga selesai.');
      return;
    }
    if (failedUploads.length > 0) {
      toast.error('Terdapat berkas yang gagal diunggah ke cloud. Silakan coba unggah ulang berkas sebelum melanjutkan.');
      return;
    }

    setLoading(true);
    const mappedService = mapServiceTypeToAbbreviation(serviceType);

    setTimeout(async () => {
      // Build final checklist based on uploads
      const finalChecklist = checklist.map(item => {
        const fileRecord = uploads[item.id];
        if (fileRecord && fileRecord.status === 'success') {
          return {
            ...item,
            status: 'Perlu Verifikasi', // Status becomes Perlu Verifikasi once uploaded
            fileName: fileRecord.name,
            fileSize: fileRecord.size,
            fileUrl: fileRecord.url || fileRecord.previewUrl || null
          };
        }
        return item;
      });

      try {
        const newCase = await addCase({
          clientName,
          clientEmail,
          clientPhone,
          serviceType: mappedService,
          category,
          propertyLocation,
          transactionValue: Number(transactionValue),
          bankPartner: bankPartner || 'Tidak Ada',
          estimationDate: hasEstimationDate ? estimationDate : null,
          entryDate,
          notes: notes || 'Berkas baru diterbitkan.',
          checklist: finalChecklist,
          status: 'Pemeriksaan Dokumen',
          fees: Number(fees),
          paymentStatus,
          paidAmount: Number(paidAmount)
        });

        setLoading(false);
        toast.success('Berkas berhasil dibuat dan diterbitkan!');
        navigate(`/staff/documents/${newCase.id}`);
      } catch (err) {
        console.error(err);
        setLoading(false);
        toast.error('Gagal membuat berkas!');
      }
    }, 1200);
  };

  // Stepper Header Icons & Labels
  const stepsConfig = [
    { label: 'Data Klien', icon: 'person' },
    { label: 'Jenis Layanan', icon: 'list_alt' },
    { label: 'Data Objek', icon: 'gavel' },
    { label: 'Persyaratan', icon: 'description' },
    { label: 'Jadwal & Tenggat', icon: 'calendar_today' },
    { label: 'Catatan', icon: 'rate_review' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto text-left pb-24 font-sans">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-on-surface-variant mb-2">
        <span 
          onClick={() => navigate('/staff/dashboard')}
          className="font-label-sm text-[12px] cursor-pointer hover:text-primary transition-colors font-semibold"
        >
          Manajemen Berkas
        </span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-label-bold text-[12px] text-on-surface font-extrabold">Buat Berkas Baru</span>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-on-surface leading-tight">Formulir Pengajuan Berkas</h2>
        <p className="text-[13px] text-on-surface-variant mt-1.5 font-medium">
          Silakan lengkapi detail informasi klien, objek akta, dan unggah berkas persyaratan di bawah ini.
        </p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="bg-white rounded-[26px] border border-slate-200/80 p-5 mb-8 shadow-[0_10px_30px_rgba(112,144,176,0.06)] select-none">
        <div className="flex justify-between items-center relative">
          {/* Connector Line */}
          <div className="absolute left-[3%] right-[3%] top-[35%] h-[2px] bg-slate-200 -z-0">
            <div 
              className="h-full bg-[#6366F1] transition-all duration-300"
              style={{ width: `${((step - 1) / 5) * 100}%` }}
            ></div>
          </div>

          {stepsConfig.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step;
            const isActive = stepNum === step;

            return (
              <div key={idx} className="flex flex-col items-center z-10 w-[15%] text-center">
                <div 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)]' 
                      : isActive 
                      ? 'bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_6px_16px_rgba(99,102,241,0.35)] font-bold scale-105' 
                      : 'bg-[#F8FAFC] border border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                  )}
                </div>
                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider hidden sm:block ${isActive ? 'text-[#6366F1]' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-[0_12px_35px_rgba(112,144,176,0.06)] min-h-[400px]">
        
        {/* STEP 1: DATA KLIEN */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-[17px] font-bold text-on-surface border-b pb-2.5 border-outline-variant/60">
              Data Identitas Klien
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="client_name">
                Nama Lengkap Klien <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">person</span>
                <input
                  id="client_name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Masukkan nama lengkap klien sesuai KTP"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:border-primary focus:border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="client_email">
                  Email Klien <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">mail</span>
                  <input
                    id="client_email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="client_phone">
                  Nomor Telepon / WhatsApp <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">phone</span>
                  <input
                    id="client_phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: JENIS LAYANAN */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-[17px] font-bold text-on-surface border-b pb-2.5 border-outline-variant/60">
              Kategori & Jenis Layanan Akta
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Kategori Berkas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-surface-container-low group ${
                    category === 'ppat' 
                      ? 'border-primary bg-primary-soft text-primary' 
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value="ppat"
                    checked={category === 'ppat'}
                    onChange={() => handleCategoryChange('ppat')}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="material-symbols-outlined text-[24px]">description</span>
                    <span className="font-bold text-[13px]">Pejabat Pembuat Akta Tanah (PPAT)</span>
                  </div>
                </label>

                <label 
                  className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-surface-container-low group ${
                    category === 'notaris' 
                      ? 'border-primary bg-primary-soft text-primary' 
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value="notaris"
                    checked={category === 'notaris'}
                    onChange={() => handleCategoryChange('notaris')}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="material-symbols-outlined text-[24px]">gavel</span>
                    <span className="font-bold text-[13px]">Layanan Notaris Publik</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="service_type">
                Jenis Layanan Akta
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">list_alt</span>
                <select
                  id="service_type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface appearance-none transition-all focus:outline-none focus:border-primary focus:border-2"
                >
                  {serviceOptions[category].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3.5 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DATA OBJEK / AKTA */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-[17px] font-bold text-on-surface border-b pb-2.5 border-outline-variant/60">
              Spesifikasi Objek / Nilai Akta
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="property_location">
                Alamat / Lokasi Objek <span className="text-error">*</span>
              </label>
              <LocationSearchInput
                id="property_location"
                value={propertyLocation}
                onChange={setPropertyLocation}
                placeholder="Ketik nama tempat/kafe/alamat (contoh: Cafe Koa, Jl. Sudirman)..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="transaction_value">
                  Nilai Transaksi (IDR) <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-bold text-[13px] text-on-surface-variant">Rp</span>
                  <CurrencyInput
                    id="transaction_value"
                    value={transactionValue}
                    onChange={setTransactionValue}
                    placeholder="Contoh: 150.000.000"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="bank_partner">
                  Bank Rekanan (Opsional)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">corporate_fare</span>
                  <input
                    id="bank_partner"
                    type="text"
                    value={bankPartner}
                    onChange={(e) => setBankPartner(e.target.value)}
                    placeholder="Contoh: Bank Mandiri (KCP Sudirman)"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PERSYARATAN DOKUMEN */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-2.5 border-outline-variant/60">
              <h3 className="text-[17px] font-bold text-on-surface">
                Dokumen Persyaratan: {serviceType}
              </h3>
              <span className="text-[11px] font-bold bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full">
                {checklist.length} Persyaratan Terdeteksi
              </span>
            </div>

            <p className="text-[12px] text-on-surface-variant font-medium bg-surface-container-low p-3 rounded-lg border">
              Pilih dan upload dokumen persyaratan di bawah ini. Anda dapat mengunggah file sekarang atau menyimpannya untuk dilengkapi nanti oleh klien.
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {checklist.map((item, index) => {
                const uploadRecord = uploads[item.id];
                const isUploading = uploadRecord?.status === 'uploading';
                const isSuccess = uploadRecord?.status === 'success';
                const isFailed = uploadRecord?.status === 'failed';

                return (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl border border-outline-variant bg-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-[13px] text-on-surface flex items-center gap-1.5">
                        <span className="text-primary-dark">{index + 1}.</span> {item.name}
                        {index < 3 && <span className="text-[9px] font-bold bg-error-container text-on-error-container px-1.5 py-0.5 rounded uppercase">Wajib</span>}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">{item.desc}</p>
                      
                      {/* Upload status details inside the row */}
                      {uploadRecord && (
                        <div className="mt-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant/60 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="material-symbols-outlined text-[24px] text-primary shrink-0">
                              {uploadRecord.previewUrl ? 'image' : 'description'}
                            </span>
                            <div className="min-w-0 text-left">
                              <p className="text-[11.5px] font-bold text-on-surface truncate max-w-[200px] md:max-w-xs">{uploadRecord.name}</p>
                              <p className="text-[9.5px] text-on-surface-variant font-medium">{uploadRecord.size}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isUploading && (
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-outline-variant h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full transition-all duration-150" style={{ width: `${uploadRecord.progress}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-primary font-mono">{uploadRecord.progress}%</span>
                              </div>
                            )}

                            {isSuccess && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[9.5px] font-bold rounded flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span> Berhasil
                              </span>
                            )}

                            {isFailed && (
                              <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[9.5px] font-bold rounded flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px] font-bold">error</span> Gagal
                              </span>
                            )}

                            {/* Actions */}
                            <div className="flex gap-1">
                              {isSuccess && uploadRecord.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() => window.open(uploadRecord.previewUrl, '_blank')}
                                  className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant"
                                  title="Pratinjau"
                                >
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                              )}
                              {isFailed && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryUpload(item.id)}
                                  className="p-1 hover:bg-yellow-100 text-yellow-700 rounded"
                                  title="Coba Lagi"
                                >
                                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteUpload(item.id)}
                                className="p-1 hover:bg-error-container/20 text-error rounded"
                                title="Hapus file"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!uploadRecord && (
                      <div className="relative shrink-0 print:hidden">
                        <input
                          type="file"
                          id={`file-${item.id}`}
                          className="opacity-0 absolute pointer-events-none w-0 h-0"
                          onChange={(e) => handleFileChange(item.id, e)}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-${item.id}`).click()}
                          className="px-3.5 py-1.5 bg-surface-container-low border border-outline-variant hover:border-primary hover:bg-primary-soft text-primary font-bold text-[11px] rounded-lg cursor-pointer transition-all flex items-center gap-1 active:scale-[0.97]"
                        >
                          <span className="material-symbols-outlined text-[14px]">upload</span>
                          Pilih File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* STEP 5: JADWAL & TENGGAT */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-[17px] font-bold text-on-surface border-b pb-2.5 border-outline-variant/60">
              Penjadwalan & Biaya Berkas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tanggal Berkas Masuk */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="entry_date">
                  Tanggal Berkas Masuk <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">calendar_today</span>
                  <input
                    id="entry_date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface transition-all focus:outline-none focus:border-primary focus:border-2"
                  />
                </div>
              </div>

              {/* Toggle Estimasi */}
              <div className="flex flex-col gap-2 justify-center">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Tenggat Waktu Pengerjaan
                </label>
                <div className="flex items-center gap-3 py-3">
                  <input
                    id="has_estimation"
                    type="checkbox"
                    checked={hasEstimationDate}
                    onChange={(e) => setHasEstimationDate(e.target.checked)}
                    className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary/20"
                  />
                  <label htmlFor="has_estimation" className="text-body-md text-on-surface font-semibold cursor-pointer select-none">
                    Tentukan Tanggal Target Selesai (Prioritas)
                  </label>
                </div>
              </div>
            </div>

            {/* Kolom Estimasi Selesai (Kondisional) */}
            {hasEstimationDate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="estimation_date">
                    Tanggal Estimasi Selesai <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">event_available</span>
                    <input
                      id="estimation_date"
                      type="date"
                      value={estimationDate}
                      onChange={(e) => setEstimationDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface transition-all focus:outline-none focus:border-primary focus:border-2"
                    />
                  </div>
                </div>

                <div className="bg-primary-soft p-4 rounded-xl border border-primary/20 flex gap-3.5 items-start">
                  <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <p className="text-[12px] text-primary-dark leading-relaxed font-semibold">
                    Sistem memberikan estimasi standar 14 hari. Anda dapat menyesuaikannya sesuai kompleksitas berkas dan waktu instansi (BPN/Dinas).
                  </p>
                </div>
              </div>
            )}

            {/* BAGIAN KEUANGAN (BIAYA & PEMBAYARAN) */}
            <div className="border-t border-outline-variant/60 pt-6">
              <h4 className="text-[14px] font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Informasi Biaya & Pembayaran
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Biaya */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="fees">
                    Biaya Jasa Notaris (Rupiah) <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-on-surface-variant text-[13px] font-bold">Rp</span>
                    <CurrencyInput
                      id="fees"
                      value={fees}
                      onChange={handleFeesChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface font-semibold focus:outline-none focus:border-primary focus:border-2"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Jumlah Dibayar */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="paid_amount">
                    Nominal Dibayar (Rupiah)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-on-surface-variant text-[13px] font-bold">Rp</span>
                    <CurrencyInput
                      id="paid_amount"
                      value={paidAmount}
                      onChange={handlePaidAmountChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface font-semibold focus:outline-none focus:border-primary focus:border-2"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Status Pembayaran (Auto) */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Status Pembayaran
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">credit_card</span>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface font-bold focus:outline-none focus:border-primary focus:border-2"
                    >
                      <option value="Belum Lunas">Belum Lunas</option>
                      <option value="DP">DP (Down Payment)</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CATATAN TAMBAHAN */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-[17px] font-bold text-on-surface border-b pb-2.5 border-outline-variant/60">
              Catatan & Instruksi Tambahan
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="notes">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="notes"
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ketik instruksi pengerjaan berkas, nomor sertifikat tanah lama, detail jaminan fidusia, atau catatan khusus lainnya di sini..."
                className="w-full px-4 py-3.5 bg-white border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline transition-all resize-none focus:outline-none focus:border-primary focus:border-2"
              />
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 flex gap-3 items-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">task_alt</span>
              <span className="text-[11.5px] text-on-surface-variant font-medium">
                Seluruh data pengerjaan siap. Silakan klik tombol <strong>\"Terbitkan Berkas\"</strong> di kanan bawah untuk menerbitkannya ke dalam antrean pengerjaan staf.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[288px] bg-white border-t border-outline-variant p-4 flex justify-between items-center z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 border border-slate-200 bg-white rounded-2xl font-bold text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || savingDraft}
            className="px-5 py-2.5 border border-[#6366F1] text-[#6366F1] bg-indigo-50/50 rounded-2xl font-bold text-[12.5px] hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {savingDraft ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                <span>Menyimpan Draf...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">draft</span>
                <span>Simpan Draf</span>
              </>
            )}
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentStepValid}
              className={`px-6 py-2.5 rounded-2xl font-bold text-[12.5px] flex items-center gap-1.5 transition-all ${
                isCurrentStepValid 
                  ? 'btn-primary-3d cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <span>Lanjutkan</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isCurrentStepValid}
              className={`px-6 py-2.5 rounded-2xl font-bold text-[12.5px] flex items-center gap-1.5 transition-all ${
                isCurrentStepValid && !loading 
                  ? 'btn-primary-3d cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              {loading && !savingDraft ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  <span>Terbitkan Berkas</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* POPUP MODAL: DRAF BERHASIL DISIMPAN */}
      {showDraftModal && savedDraftData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200">
            {/* Top Icon Badge */}
            <div className="w-16 h-16 bg-indigo-50 border-2 border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#6366F1]">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                draft
              </span>
            </div>

            <h3 className="text-[20px] font-extrabold text-slate-800 mb-2">
              Draf Berkas Berhasil Disimpan!
            </h3>

            <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">
              Berkas atas nama <strong className="text-slate-900">{savedDraftData.clientName}</strong> {savedDraftData.caseNumber ? `(#${savedDraftData.caseNumber})` : ''} telah tersimpan sebagai draf. Anda dapat melanjutkan pengisian dan menerbitkannya kapan saja.
            </p>

            <div className="space-y-3">
              {savedDraftData.id && (
                <button
                  type="button"
                  onClick={() => navigate(`/staff/document/${savedDraftData.id}`)}
                  className="w-full py-3 bg-[#6366F1] hover:bg-indigo-600 text-white rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Lihat Detail Berkas
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/staff/dashboard')}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                Kembali ke Dashboard Staf
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDocumentPage;
