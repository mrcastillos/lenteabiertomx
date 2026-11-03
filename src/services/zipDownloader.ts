import JSZip from 'jszip';
import { Photo } from '../types';
import { downloadDriveFileBlob } from './googleDrive';

export interface DownloadProgress {
  current: number;
  total: number;
  percent: number;
  currentFileName: string;
}

/**
 * Downloads a single clean photo without watermark
 */
export async function downloadSingleCleanPhoto(
  photo: Photo,
  galleryTitle: string,
  accessToken?: string | null
): Promise<void> {
  try {
    let blob: Blob;

    if (photo.driveFileId && accessToken) {
      blob = await downloadDriveFileBlob(accessToken, photo.driveFileId);
    } else {
      const response = await fetch(photo.url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      blob = await response.blob();
    }

    const cleanBlob = new Blob([blob], { type: blob.type || 'image/jpeg' });
    const blobUrl = URL.createObjectURL(cleanBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const sanitizedTitle = (photo.title || 'foto')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    link.download = `LenteAbiertoMX_${sanitizedTitle}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.warn('Fallback direct download initiated:', error);
    // Direct open fallback if CORS prevents blob reading on external static images
    const link = document.createElement('a');
    link.href = photo.url;
    link.target = '_blank';
    link.download = `${photo.title || 'foto'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Downloads full gallery as a ZIP archive with high-resolution clean photos (no watermarks)
 */
export async function downloadGalleryAsZip(
  photos: Photo[],
  galleryTitle: string,
  accessToken?: string | null,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(galleryTitle.replace(/[^a-zA-Z0-9_-]/g, '_')) || zip;

  const total = photos.length;

  for (let i = 0; i < total; i++) {
    const photo = photos[i];
    const fileName = `${String(i + 1).padStart(3, '0')}_${(photo.title || 'foto')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')}.jpg`;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 90),
        currentFileName: fileName,
      });
    }

    try {
      let imageBlob: Blob;
      if (photo.driveFileId && accessToken) {
        imageBlob = await downloadDriveFileBlob(accessToken, photo.driveFileId);
      } else {
        const response = await fetch(photo.url);
        imageBlob = await response.blob();
      }
      folder.file(fileName, imageBlob);
    } catch (err) {
      console.error(`Error al empaquetar foto ${photo.title}:`, err);
      // Try fallback canvas fetch if cross-origin image
      try {
        const fallbackBlob = await fetchImageAsBlob(photo.url);
        folder.file(fileName, fallbackBlob);
      } catch (subErr) {
        console.warn(`Omitiendo foto ${fileName} por restricciones de red`, subErr);
      }
    }
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress({
          current: total,
          total,
          percent: 90 + Math.round(metadata.percent * 0.1),
          currentFileName: 'Comprimiendo archivo ZIP...',
        });
      }
    }
  );

  const zipUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = zipUrl;
  const sanitizedGallery = galleryTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `LenteAbiertoMX_${sanitizedGallery}_ColeccionCompleta.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 15000);
}

async function fetchImageAsBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1920;
      canvas.height = img.naturalHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob failed'));
      }, 'image/jpeg', 0.95);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
