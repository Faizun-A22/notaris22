import { supabase } from './supabase';

/**
 * Generates a temporary private signed URL for accessing document files securely.
 * @param {string} filePath - Path to file in storage bucket
 * @param {number} [expiresIn=1800] - Expiration duration in seconds (default: 30 mins)
 * @returns {Promise<string>} Private signed URL or empty string
 */
export async function getSignedDocumentUrl(filePath, expiresIn = 1800) {
  if (!filePath) return '';
  // Reject raw blob URLs to prevent rendering ephemeral RAM blobs
  if (filePath.startsWith('blob:')) {
    console.warn('Terdeteksi URL blob temporary. Mengabaikan URL blob untuk keamanan data.');
    return '';
  }
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn('Gagal membuat signed URL dokumen:', error?.message);
      return '';
    }
    return data.signedUrl;
  } catch (err) {
    console.error('getSignedDocumentUrl error:', err);
    return '';
  }
}

// Alias for getSignedDocumentUrl for backwards compatibility
export const getDocumentUrl = getSignedDocumentUrl;

/**
 * Upload physical document to Supabase Storage bucket 'documents' (Private Bucket)
 * Throws explicit error on upload failure to prevent blob fallback leaks in database.
 * @param {File} file - The file object from file input / drop
 * @param {string} caseId - The UUID or case number for folder categorization
 * @param {string} [customName] - Optional custom name prefix
 * @returns {Promise<{ success: boolean, url: string, name: string, size: string, path: string }>}
 */
export async function uploadDocumentFile(file, caseId = 'general', customName = '') {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih untuk diunggah.');
  }

  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileExt = cleanName.split('.').pop();
  const fileNameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.')) || cleanName;
  
  const finalFileName = customName 
    ? `${customName.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}.${fileExt}`
    : `${fileNameWithoutExt}_${timestamp}.${fileExt}`;

  const filePath = `${caseId}/${finalFileName}`;
  const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Storage bucket upload failure:', error.message);
    throw new Error(`Gagal mengunggah file ${file.name} ke server storage: ${error.message}`);
  }

  // Generate temporary private signed URL (valid for 30 minutes / 1800s)
  const signedUrl = await getSignedDocumentUrl(data.path || filePath, 1800);

  return {
    success: true,
    url: signedUrl,
    name: file.name,
    size: sizeStr,
    path: data.path || filePath
  };
}

/**
 * Clears all cached case, client, and activity data from browser storage on logout
 */
export function clearStorageData() {
  try {
    localStorage.removeItem('notary_cases');
    localStorage.removeItem('notary_activities');
    localStorage.removeItem('notary_staff');
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.error('Error clearing storage data:', err);
  }
}

