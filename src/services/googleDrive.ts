import { Photo, DriveFolderItem } from '../types';

export interface DriveFolderResponse {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Fetch folders inside user's Google Drive
 */
export async function listDriveFolders(accessToken: string): Promise<DriveFolderItem[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const fields = encodeURIComponent("files(id, name, mimeType, iconLink, webViewLink, createdTime)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50&orderBy=name`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al obtener carpetas de Google Drive');
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
  }));
}

/**
 * Create a new folder in Google Drive for a new gallery
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolderResponse> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al crear carpeta en Google Drive');
  }

  return await res.json();
}

/**
 * List all images inside a Google Drive folder
 */
export async function listPhotosInDriveFolder(
  accessToken: string,
  folderId: string
): Promise<Photo[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  const fields = encodeURIComponent(
    'files(id, name, mimeType, thumbnailLink, webContentLink, imageMediaMetadata, size, createdTime)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&orderBy=name`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al leer fotos de la carpeta en Google Drive');
  }

  const data = await res.json();
  const files = data.files || [];

  return files.map((file: any, index: number) => {
    // Generate high resolution direct viewable link using Drive content thumbnail or export
    // Replacing =s220 with =s2000 in Google thumbnail link produces crystal-clear ultra-high resolution images!
    const baseThumb = file.thumbnailLink || '';
    const highResUrl = baseThumb ? baseThumb.replace(/=s\d+/, '=s2048') : `https://drive.google.com/uc?export=view&id=${file.id}`;
    const cleanThumb = baseThumb ? baseThumb.replace(/=s\d+/, '=s800') : highResUrl;

    const exifData = file.imageMediaMetadata
      ? {
          camera: file.imageMediaMetadata.cameraModel || 'Sony α Series',
          lens: file.imageMediaMetadata.lens || 'Sony FE 35mm F1.4 GM',
          aperture: file.imageMediaMetadata.aperture ? `f/${file.imageMediaMetadata.aperture}` : 'f/1.4',
          shutterSpeed: file.imageMediaMetadata.exposureTime ? `${file.imageMediaMetadata.exposureTime}s` : '1/500s',
          iso: file.imageMediaMetadata.isoSpeed ? `ISO ${file.imageMediaMetadata.isoSpeed}` : 'ISO 100',
        }
      : {
          camera: 'Sony Alpha FX3',
          lens: 'FE 50mm F1.2 GM',
          aperture: 'f/1.8',
          shutterSpeed: '1/800s',
          iso: 'ISO 160',
        };

    const width = file.imageMediaMetadata?.width || 1920;
    const height = file.imageMediaMetadata?.height || 1080;
    const aspectRatio: 'square' | 'portrait' | 'landscape' =
      height > width * 1.1 ? 'portrait' : width > height * 1.1 ? 'landscape' : 'square';

    return {
      id: file.id,
      url: highResUrl,
      thumbnailUrl: cleanThumb,
      title: file.name ? file.name.replace(/\.[^/.]+$/, '') : `Fotografía #${index + 1}`,
      caption: `Toma exclusiva Lente Abierto MX`,
      width,
      height,
      aspectRatio,
      exif: exifData,
      driveFileId: file.id,
      dateAdded: file.createdTime || new Date().toISOString(),
    };
  });
}

export const APPS_SCRIPT_DRIVE_API_URL =
  'https://script.google.com/macros/s/AKfycbwRA3SZNrujhB_E1jlKUpTelN12JIgORt4lLZgSPVpqaGQxJ3b9d9m6PS0GFPfk6JH-Vw/exec';

/**
 * Fetch photos from Google Drive folder via the provided Apps Script Web App
 */
export async function fetchPhotosFromScriptApi(folderId: string = 'root'): Promise<Photo[]> {
  const cleanFolderId = extractFolderId(folderId);
  const targetUrl = `${APPS_SCRIPT_DRIVE_API_URL}?folderId=${encodeURIComponent(cleanFolderId)}`;

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Error al consultar la API de Google Drive (Código: ${res.status})`);
  }

  const items = await res.json();
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item: any, index: number) => {
    // Generate clean high-res URLs and thumbnails from lh3.googleusercontent.com link
    const originalUrl = item.url || `https://lh3.googleusercontent.com/d/${item.id}`;
    // Using Google CDN image parameters: =w2048 or =s2048 for full quality preview
    const highResUrl = `${originalUrl}=s2048`;
    const thumbnailUrl = `${originalUrl}=s800`;

    return {
      id: item.id || `script-img-${index}-${Date.now()}`,
      url: highResUrl,
      thumbnailUrl: thumbnailUrl,
      title: item.name ? item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : `Fotografía #${index + 1}`,
      caption: `Toma exclusiva Lente Abierto MX`,
      width: 1920,
      height: 1280,
      aspectRatio: 'landscape',
      exif: {
        camera: 'Sony α Series',
        lens: 'G Master Prime 35mm F1.4',
        aperture: 'f/1.4',
        shutterSpeed: '1/1000s',
        iso: 'ISO 100',
      },
      driveFileId: item.id,
      dateAdded: new Date().toISOString(),
    };
  });
}

/**
 * Helper to extract raw folder ID from various Google Drive URL formats or raw strings
 */
export function extractFolderId(input: string): string {
  if (!input) return 'root';
  const trimmed = input.trim();
  // e.g. https://drive.google.com/drive/folders/18Fi-iTjoSRHzOSj7l5AJ0J3O8pywImbY
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // e.g. id=18Fi-iTjoSRHzOSj7l5AJ0J3O8pywImbY
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return trimmed;
}

/**
 * Fetch image blob directly from Google Drive for original clean download without watermark
 */
export async function downloadDriveFileBlob(accessToken: string, fileId: string): Promise<Blob> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    // If accessToken is not provided or fails, try direct download link
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}=s0`;
    const fallbackRes = await fetch(directUrl);
    if (fallbackRes.ok) {
      return await fallbackRes.blob();
    }
    throw new Error('Error al descargar archivo desde Google Drive');
  }

  return await res.blob();
}

