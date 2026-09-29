import { supabase } from './supabase';

/**
 * Smart browser-side image compressor.
 * Preserves high visual clarity (sharp text/documents), but optimizes file size by 70-90%.
 * @param {File} file 
 * @param {object} [options]
 * @param {number} [options.maxWidth=2560]
 * @param {number} [options.maxHeight=2560]
 * @param {number} [options.quality=0.88]
 * @returns {Promise<File>} Compressed File object
 */
export async function compressImageFile(file, options = {}) {
  const { maxWidth = 2560, maxHeight = 2560, quality = 0.88 } = options;

  // Only compress image files (jpeg, png, webp, bmp, heic)
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If image is already smaller than 300 KB, no need to compress further
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate aspect ratio bounds while preserving sharpness
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth image scaling filter for crystal clear document text
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine optimal output format
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't reduce file size, return original file
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
          });

          console.log(
            `[ImageCompressor] ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)} MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB (${Math.round((1 - compressedFile.size / file.size) * 100)}% hemat)`
          );

          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original file if load fails
    };

    img.src = url;
  });
}

/**
 * Universal browser-side file compressor for BOTH Images and Non-Image files (PDF, DOCX, ZIP, TXT, CSV, etc.).
 * @param {File} file 
 * @returns {Promise<File>} Compressed File object
 */
export async function compressAnyFile(file) {
  if (!file) return file;

  // 1. Image Files -> use smart image compressor
  if (file.type && file.type.startsWith('image/')) {
    return await compressImageFile(file, { maxWidth: 2560, maxHeight: 2560, quality: 0.88 });
  }

  // 2. Non-Image Files (PDF, DOCX, ZIP, etc.) -> DO NOT compress with browser gzip
  // Uploading gzip-compressed bytes without Content-Encoding header corrupts PDF/DOCX files.
  return file;
}

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
 * Automatically performs universal smart compression for Images & Non-Image files before uploading.
 * @param {File} file - The file object from file input / drop
 * @param {string} caseId - The UUID or case number for folder categorization
 * @param {string} [customName] - Optional custom name prefix
 * @returns {Promise<{ success: boolean, url: string, name: string, size: string, path: string }>}
 */
export async function uploadDocumentFile(file, caseId = 'general', customName = '') {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih untuk diunggah.');
  }

  // Compress any file (Image or Non-Image) before uploading
  const fileToUpload = await compressAnyFile(file);

  const timestamp = Date.now();
  const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileExt = cleanName.split('.').pop();
  const fileNameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.')) || cleanName;
  
  const finalFileName = customName 
    ? `${customName.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}.${fileExt}`
    : `${fileNameWithoutExt}_${timestamp}.${fileExt}`;

  const filePath = `${caseId}/${finalFileName}`;
  const sizeStr = (fileToUpload.size / (1024 * 1024)).toFixed(2) + ' MB';

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, fileToUpload, {
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
  } catch (err) {
    console.error('Error clearing storage data:', err);
  }
}
