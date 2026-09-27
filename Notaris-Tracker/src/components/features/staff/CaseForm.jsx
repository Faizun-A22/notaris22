import React, { useState, useMemo } from 'react';
import { useCases } from '../../../hooks/useCases';
import { SERVICE_TYPES, SERVICE_CATEGORIES } from '../../../constants/serviceTypes';

export const CaseForm = () => {
  const { addCase } = useCases();
  
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES.PPAT);
  
  // Filter services based on selected category
  const filteredServices = useMemo(() => {
    return Object.values(SERVICE_TYPES).filter(s => s.category === category);
  }, [category]);

  const [serviceType, setServiceType] = useState(filteredServices[0].id);
  const [estimationDate, setEstimationDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Update service type when category changes
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const firstServiceOfCat = Object.values(SERVICE_TYPES).find(s => s.category === newCat);
    if (firstServiceOfCat) {
      setServiceType(firstServiceOfCat.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !estimationDate) {
      alert('Mohon isi nama klien dan tanggal estimasi selesai!');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      addCase({
        clientName,
        category,
        serviceType,
        estimationDate,
        status: category === SERVICE_CATEGORIES.PPAT ? 'Verifikasi Sertifikat' : 'Penyusunan Draf'
      });
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setClientName('');
        setEstimationDate('');
      }, 2000);
    }, 1500);
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding h-full text-left">
      <div className="flex items-center gap-2 mb-stack-lg border-b border-outline-variant pb-2">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
          edit_note
        </span>
        <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">Form Input Berkas</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-stack-md">
        <div>
          <label className="block font-label-bold text-on-surface mb-2 tracking-wider text-[11px] font-bold">
            NAMA KLIEN
          </label>
          <input
            id="client-name-input"
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary text-body-md border"
            placeholder="Masukkan nama lengkap klien"
          />
        </div>

        <div>
          <label className="block font-label-bold text-on-surface mb-2 tracking-wider text-[11px] font-bold uppercase">
            Kategori Berkas
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(SERVICE_CATEGORIES.PPAT)}
              className={`py-2 px-3 rounded-lg border font-label-bold text-[11px] transition-all ${
                category === SERVICE_CATEGORIES.PPAT
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              PPAT
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange(SERVICE_CATEGORIES.NOTARIS)}
              className={`py-2 px-3 rounded-lg border font-label-bold text-[11px] transition-all ${
                category === SERVICE_CATEGORIES.NOTARIS
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              NOTARIS
            </button>
          </div>
        </div>

        <div>
          <label className="block font-label-bold text-on-surface mb-2 tracking-wider text-[11px] font-bold">
            JENIS LAYANAN
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary appearance-none text-body-md border"
          >
            {filteredServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-label-bold text-on-surface mb-2 tracking-wider text-[11px] font-bold">
            ESTIMASI SELESAI
          </label>
          <input
            type="date"
            required
            value={estimationDate}
            onChange={(e) => setEstimationDate(e.target.value)}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary text-body-md border"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-4 text-on-primary rounded-lg font-headline-sm hover:opacity-90 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2 ${
            success 
              ? 'bg-secondary text-on-secondary' 
              : 'bg-primary text-on-primary'
          }`}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              <span>Menyimpan...</span>
            </>
          ) : success ? (
            <>
              <span className="material-symbols-outlined text-[20px]">check</span>
              <span>Berhasil Disimpan!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>Simpan Berkas</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};

export default CaseForm;
