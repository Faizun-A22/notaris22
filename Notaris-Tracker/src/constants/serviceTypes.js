export const SERVICE_CATEGORIES = {
  PPAT: 'PPAT',
  NOTARIS: 'NOTARIS',
};

export const SERVICE_TYPES = {
  // === PPAT SERVICES ===
  AJB: {
    id: 'AJB',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Akta Jual Beli (AJB)',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  HIBAH: {
    id: 'HIBAH',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Akta Hibah',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  APHB: {
    id: 'APHB',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Akta Pembagian Hak Bersama',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  WARIS: {
    id: 'WARIS',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Waris / Hak Waris',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  ROYA: {
    id: 'ROYA',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Roya Hak Tanggungan',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  PECAH: {
    id: 'PECAH',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Pemecahan Sertifikat',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  GANTI: {
    id: 'GANTI',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Sertifikat Pengganti',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  KONVERSI: {
    id: 'KONVERSI',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Konversi',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  SKMHT: {
    id: 'SKMHT',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'SKMHT (PPAT)',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  APHT: {
    id: 'APHT',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Akta Pemberian Hak Tanggungan (APHT)',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  HT: {
    id: 'HT',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Hak Tanggungan (HT)',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  HGB: {
    id: 'HGB',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Pemberian HGB (di atas HM)',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },
  HAK_PAKAI: {
    id: 'HAK_PAKAI',
    category: SERVICE_CATEGORIES.PPAT,
    label: 'Pemberian Hak Pakai',
    badgeBg: 'bg-secondary-container',
    badgeText: 'text-on-secondary-container',
  },

  // === NOTARIS SERVICES ===
  PT: {
    id: 'PT',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Pendirian PT',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  CV: {
    id: 'CV',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Pendirian/Perubahan CV',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  FIDUSIA: {
    id: 'FIDUSIA',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Jaminan Fidusia',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  APJB: {
    id: 'APJB',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Pengikatan Jual Beli',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  SKUM: {
    id: 'SKUM',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Surat Kuasa Untuk Menjual',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  SEWA: {
    id: 'SEWA',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Perjanjian Sewa Menyewa',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  CONSEN: {
    id: 'CONSEN',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Consen Roya',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  APPJB: {
    id: 'APPJB',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Perjanjian Pengikatan Jual Beli',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  APK: {
    id: 'APK',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Perjanjian Kredit',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  YAYASAN: {
    id: 'YAYASAN',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Pendirian Yayasan',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  ANGGARAN_DASAR: {
    id: 'ANGGARAN_DASAR',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Perubahan Anggaran Dasar',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  JUAL_BELI_SAHAM: {
    id: 'JUAL_BELI_SAHAM',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Jual Beli Saham',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  PERJANJIAN_KAWIN: {
    id: 'PERJANJIAN_KAWIN',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Perjanjian Kawin',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  WASIAT: {
    id: 'WASIAT',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Akta Wasiat',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  LEGALISASI: {
    id: 'LEGALISASI',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Legalisasi Dokumen',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
  WAARMERKING: {
    id: 'WAARMERKING',
    category: SERVICE_CATEGORIES.NOTARIS,
    label: 'Waarmerking',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-primary',
  },
};

export const getCaseCategory = (c) => {
  if (!c) return SERVICE_CATEGORIES.PPAT;
  
  if (c.category) {
    const catUpper = c.category.toUpperCase();
    if (catUpper === 'PPAT' || catUpper === 'NOTARIS') {
      return catUpper;
    }
  }
  
  if (c.serviceType) {
    const serviceKey = c.serviceType.toUpperCase();
    if (serviceKey === 'CV_PT') {
      return SERVICE_CATEGORIES.NOTARIS;
    }
    const serviceInfo = SERVICE_TYPES[c.serviceType];
    if (serviceInfo && serviceInfo.category) {
      return serviceInfo.category;
    }
  }
  
  return SERVICE_CATEGORIES.PPAT;
};

