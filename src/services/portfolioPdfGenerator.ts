import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FavoriteLog, Gallery, Photo, SiteContentConfig } from '../types';
import { getCleanPhotoBlob } from './zipDownloader';

export type PdfThemeStyle = 'dark' | 'light';

export interface PortfolioPdfOptions {
  dossierTitle: string;
  recipientName?: string;
  themeStyle: PdfThemeStyle;
  includeBiography: boolean;
  includePrinciples: boolean;
  includeGear: boolean;
  includePricing: boolean;
  includeContact: boolean;
  selectedGalleryIds: string[];
  photosPerGallery: number; // 2, 4, 6, 8, or 12
  prioritizeFavorites: boolean;
  includePhotoTitles: boolean;
  portfolioUrl?: string;
  accessToken?: string | null;
  onProgress?: (progress: { percent: number; step: string }) => void;
}

interface LoadedImageAsset {
  dataUrl: string;
  width: number;
  height: number;
}

interface Palette {
  bg: [number, number, number];
  surface: [number, number, number];
  surfaceAlt: [number, number, number];
  border: [number, number, number];
  heading: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  accent: [number, number, number];
  accentContrast: [number, number, number];
  imageFrameBg: [number, number, number];
}

const DARK_PALETTE: Palette = {
  bg: [12, 13, 14],
  surface: [20, 21, 24],
  surfaceAlt: [26, 28, 33],
  border: [52, 55, 62],
  heading: [255, 255, 255],
  text: [220, 222, 228],
  muted: [152, 156, 166],
  accent: [245, 158, 11],
  accentContrast: [15, 15, 16],
  imageFrameBg: [8, 9, 10],
};

const LIGHT_PALETTE: Palette = {
  bg: [250, 248, 245],
  surface: [255, 255, 255],
  surfaceAlt: [242, 239, 233],
  border: [216, 211, 202],
  heading: [24, 24, 27],
  text: [58, 58, 66],
  muted: [113, 113, 122],
  accent: [180, 110, 14],
  accentContrast: [255, 255, 255],
  imageFrameBg: [238, 235, 229],
};

/**
 * Strips emojis and unsupported characters for standard PDF fonts while keeping all Spanish accents/punctuation intact.
 */
function sanitizePdfText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2022/g, '-')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function getFormattedCurrentDate(): { fullDate: string; monthYear: string; fileDate: string; year: string } {
  const now = new Date();
  const fullDate = now.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const monthYearRaw = now.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
  const monthYear = monthYearRaw.charAt(0).toUpperCase() + monthYearRaw.slice(1);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return {
    fullDate,
    monthYear,
    fileDate: `${yyyy}-${mm}-${dd}`,
    year: String(yyyy),
  };
}

function normalizeWhatsappUrl(raw?: string): string {
  const digits = (raw || '527773743420').replace(/[^0-9]/g, '');
  const withCountry = digits.length === 10 ? `52${digits}` : digits || '527773743420';
  return `https://wa.me/${withCountry}`;
}

function normalizeInstagramUrl(handle?: string): { handleText: string; url: string } {
  const clean = (handle || 'lente.abierto.mx').replace(/^@/, '').trim();
  return {
    handleText: `@${clean}`,
    url: `https://instagram.com/${clean}`,
  };
}

/**
 * Loads an image URL or DataURL into an optimized JPEG DataURL with natural dimensions.
 */
async function loadNormalizedImage(
  url: string,
  title: string,
  accessToken?: string | null,
  maxDimension = 1400,
  bgHex = '#0c0d0e'
): Promise<LoadedImageAsset | null> {
  if (!url) return null;

  const convertSrcToJpeg = (srcUrl: string): Promise<LoadedImageAsset | null> =>
    new Promise((resolve) => {
      const img = new Image();
      if (!srcUrl.startsWith('data:') && !srcUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const natW = img.naturalWidth || 1200;
          const natH = img.naturalHeight || 800;
          const scale = Math.min(1, maxDimension / Math.max(natW, natH));
          const targetW = Math.max(1, Math.round(natW * scale));
          const targetH = Math.max(1, Math.round(natH * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = bgHex;
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve({ dataUrl, width: targetW, height: targetH });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = srcUrl;
    });

  if (url.startsWith('data:image/')) {
    return convertSrcToJpeg(url);
  }

  try {
    const pseudoPhoto: Photo = {
      id: 'pdf-asset',
      url,
      title,
      dateAdded: new Date().toISOString(),
    };
    const blob = await getCleanPhotoBlob(pseudoPhoto, accessToken);
    if (blob && blob.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(blob);
      const asset = await convertSrcToJpeg(objectUrl);
      URL.revokeObjectURL(objectUrl);
      if (asset) return asset;
    }
  } catch {
    // Fallback below
  }

  return convertSrcToJpeg(url);
}

function drawPageBackground(doc: jsPDF, p: Palette, pageWidth: number, pageHeight: number) {
  doc.setFillColor(...p.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

function drawHeaderAndFooterChrome(
  doc: jsPDF,
  p: Palette,
  pageWidth: number,
  pageHeight: number,
  brandName: string,
  sectionLabel: string,
  currentDateText: string,
  pageNum: number
) {
  const margin = 16;

  // Top editorial hairline
  doc.setDrawColor(...p.border);
  doc.setLineWidth(0.25);
  doc.line(margin, 13, pageWidth - margin, 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...p.accent);
  doc.text(sanitizePdfText(brandName).toUpperCase(), margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...p.muted);
  doc.text(sanitizePdfText(sectionLabel).toUpperCase(), pageWidth - margin, 10, { align: 'right' });

  // Bottom editorial hairline
  doc.setDrawColor(...p.border);
  doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...p.muted);
  doc.text(`Portafolio Oficial · Actualizado el ${currentDateText}`, margin, pageHeight - 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...p.heading);
  doc.text(String(pageNum).padStart(2, '0'), pageWidth - margin, pageHeight - 8, { align: 'right' });
}

/**
 * Draws an image cleanly inside a bounding box without cropping or distortion (object-contain).
 */
function drawContainedImage(
  doc: jsPDF,
  asset: LoadedImageAsset,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  p: Palette,
  drawFrame = true
) {
  if (drawFrame) {
    doc.setFillColor(...p.imageFrameBg);
    doc.setDrawColor(...p.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');
  }

  const padding = drawFrame ? 1.5 : 0;
  const innerW = Math.max(1, boxW - padding * 2);
  const innerH = Math.max(1, boxH - padding * 2);

  const imgRatio = asset.width / Math.max(1, asset.height);
  const boxRatio = innerW / innerH;

  let drawW = innerW;
  let drawH = innerH;
  if (imgRatio > boxRatio) {
    drawW = innerW;
    drawH = innerW / imgRatio;
  } else {
    drawH = innerH;
    drawW = innerH * imgRatio;
  }

  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + (boxH - drawH) / 2;

  doc.addImage(asset.dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
}

export async function generatePortfolioPdf(
  siteContent: SiteContentConfig,
  galleries: Gallery[],
  favoriteLogs: FavoriteLog[],
  options: PortfolioPdfOptions
): Promise<{ fileName: string; pageCount: number; galleryCount: number; photoCount: number }> {
  const palette = options.themeStyle === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
  const bgHex = options.themeStyle === 'light' ? '#eeebe5' : '#08090a';
  const dates = getFormattedCurrentDate();

  const brandName = sanitizePdfText(siteContent.general?.brandName || 'Lente Abierto MX');
  const brandTagline = sanitizePdfText(siteContent.general?.brandTagline || 'Fotografía Real · Autor');
  const photographerName = sanitizePdfText(siteContent.biography?.photographerName || 'Martín Castillo');
  const portfolioUrl = (options.portfolioUrl || 'https://lenteabiertomx.vercel.app').trim();
  const whatsappUrl = normalizeWhatsappUrl(siteContent.contact?.whatsapp || siteContent.contact?.phone);
  const igInfo = normalizeInstagramUrl(siteContent.contact?.instagramHandle);
  const contactEmail = sanitizePdfText(siteContent.contact?.email || 'casm830903@gmail.com');
  const contactPhone = sanitizePdfText(siteContent.contact?.phone || '+52 777 374 3420');

  const selectedGalleries = options.selectedGalleryIds
    .map((id) => galleries.find((g) => g.id === id))
    .filter((g): g is Gallery => Boolean(g));

  // Count favorites per photo from logs so "prioritizeFavorites" picks the most loved images first
  const favCountByPhotoId = new Map<string, number>();
  for (const log of favoriteLogs) {
    favCountByPhotoId.set(log.photoId, (favCountByPhotoId.get(log.photoId) || 0) + 1);
  }

  const report = (percent: number, step: string) => {
    if (options.onProgress) {
      options.onProgress({ percent: Math.min(100, Math.max(0, Math.round(percent))), step });
    }
  };

  report(5, 'Preparando diseño editorial y logotipo...');

  // Preload brand logo & cover/portrait assets
  const logoAsset = siteContent.general?.logoIconUrl
    ? await loadNormalizedImage(siteContent.general.logoIconUrl, 'Logo', options.accessToken, 500, bgHex)
    : null;

  const portraitAsset = siteContent.biography?.portraitUrl
    ? await loadNormalizedImage(siteContent.biography.portraitUrl, 'Retrato', options.accessToken, 1200, bgHex)
    : null;

  // Pick best hero cover image: first selected gallery cover, else first gallery cover, else portrait
  const heroSourceUrl =
    selectedGalleries[0]?.coverPhotoUrl ||
    galleries[0]?.coverPhotoUrl ||
    siteContent.biography?.portraitUrl ||
    '';
  const heroAsset = heroSourceUrl
    ? await loadNormalizedImage(heroSourceUrl, 'Portada Principal', options.accessToken, 1500, bgHex)
    : null;

  // Prepare selected photos for each gallery
  const galleryPayloads: Array<{
    gallery: Gallery;
    coverAsset: LoadedImageAsset | null;
    photos: Array<{ photo: Photo; asset: LoadedImageAsset | null }>;
  }> = [];

  const totalPhotosPlanned = selectedGalleries.reduce(
    (sum, g) => sum + Math.min(options.photosPerGallery, g.photos.length),
    0
  );
  let loadedPhotosCount = 0;

  for (let gi = 0; gi < selectedGalleries.length; gi++) {
    const gallery = selectedGalleries[gi];
    report(
      12 + (gi / Math.max(1, selectedGalleries.length)) * 55,
      `Cargando colección "${gallery.title}"...`
    );

    const orderedPhotos = [...gallery.photos];
    if (options.prioritizeFavorites) {
      orderedPhotos.sort(
        (a, b) => (favCountByPhotoId.get(b.id) || 0) - (favCountByPhotoId.get(a.id) || 0)
      );
    }

    const chosenPhotos = orderedPhotos.slice(0, options.photosPerGallery);
    const loadedItems: Array<{ photo: Photo; asset: LoadedImageAsset | null }> = [];

    for (let pi = 0; pi < chosenPhotos.length; pi++) {
      const pItem = chosenPhotos[pi];
      loadedPhotosCount++;
      const pct = 15 + (loadedPhotosCount / Math.max(1, totalPhotosPlanned)) * 65;
      report(pct, `Procesando fotografía ${loadedPhotosCount} de ${totalPhotosPlanned} (${gallery.title})...`);

      const asset = await loadNormalizedImage(
        pItem.url || pItem.thumbnailUrl || '',
        pItem.title,
        options.accessToken,
        1300,
        bgHex
      );
      loadedItems.push({ photo: pItem, asset });
    }

    // Cover asset for gallery intro if needed
    const coverAsset =
      gi === 0 && heroAsset && heroSourceUrl === gallery.coverPhotoUrl
        ? heroAsset
        : await loadNormalizedImage(gallery.coverPhotoUrl, gallery.title, options.accessToken, 1200, bgHex);

    galleryPayloads.push({ gallery, coverAsset, photos: loadedItems });
  }

  report(84, 'Generando código QR y maquetando páginas PDF...');

  const qrDataUrl = await QRCode.toDataURL(portfolioUrl, {
    width: 320,
    margin: 1,
    color: {
      dark: options.themeStyle === 'light' ? '#18181b' : '#ffffff',
      light: options.themeStyle === 'light' ? '#ffffff' : '#141518',
    },
  });

  // Create Landscape Carta PDF (279.4 x 215.9 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 279.4
  const pageHeight = doc.internal.pageSize.getHeight(); // 215.9
  const margin = 16;
  let pageCount = 1;

  // ============================================================================
  // PAGE 1: EDITORIAL COVER PAGE
  // ============================================================================
  drawPageBackground(doc, palette, pageWidth, pageHeight);

  // Subtle architectural border frame
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.35);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Left Editorial Column (105 mm wide)
  const coverLeftX = 20;
  const coverLeftW = 98;

  if (logoAsset) {
    drawContainedImage(doc, logoAsset, coverLeftX, 22, 16, 16, palette, false);
  }

  const brandHeaderX = logoAsset ? coverLeftX + 20 : coverLeftX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...palette.accent);
  doc.text(brandName.toUpperCase(), brandHeaderX, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...palette.muted);
  doc.text(brandTagline.toUpperCase(), brandHeaderX, 34);

  // Edition Date Badge
  doc.setFillColor(...palette.surface);
  doc.setDrawColor(...palette.accent);
  doc.setLineWidth(0.35);
  doc.roundedRect(coverLeftX, 49, 76, 8, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...palette.accent);
  doc.text(`EDICIÓN ${dates.monthYear.toUpperCase()}`, coverLeftX + 4, 54.3);

  // Main Dossier Title
  const dossierTitle = sanitizePdfText(options.dossierTitle || 'Portafolio Fotográfico Profesional');
  doc.setFont('times', 'normal');
  doc.setFontSize(28);
  doc.setTextColor(...palette.heading);
  const titleLines = doc.splitTextToSize(dossierTitle, coverLeftW);
  doc.text(titleLines, coverLeftX, 72);

  let cursorY = 72 + titleLines.length * 10.5 + 4;

  if (options.recipientName && options.recipientName.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...palette.accent);
    doc.text('PREPARADO ESPECIALMENTE PARA:', coverLeftX, cursorY);
    cursorY += 5.5;
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...palette.heading);
    const recLines = doc.splitTextToSize(sanitizePdfText(options.recipientName), coverLeftW);
    doc.text(recLines, coverLeftX, cursorY);
    cursorY += recLines.length * 6 + 6;
  }

  // Gold horizontal accent bar
  doc.setDrawColor(...palette.accent);
  doc.setLineWidth(0.8);
  doc.line(coverLeftX, cursorY, coverLeftX + 26, cursorY);
  cursorY += 8;

  // Subtitle / Intro summary
  const heroSubtitle = sanitizePdfText(
    siteContent.hero?.subtitle ||
      siteContent.biography?.introParagraph ||
      'Narrativa visual en luz natural, bodas de destino, retratos editoriales y cobertura documental en México.'
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...palette.text);
  const subLines = doc.splitTextToSize(heroSubtitle, coverLeftW).slice(0, 6);
  doc.text(subLines, coverLeftX, cursorY);

  // Bottom Left Metadata & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...palette.heading);
  doc.text(photographerName, coverLeftX, pageHeight - 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...palette.muted);
  doc.text(
    sanitizePdfText(siteContent.contact?.locationDetails || 'Cuernavaca · CDMX · Oaxaca · Destinos en México'),
    coverLeftX,
    pageHeight - 30.5
  );
  doc.text(`Fecha de emisión: ${dates.fullDate}`, coverLeftX, pageHeight - 25);

  doc.setTextColor(...palette.accent);
  doc.textWithLink(portfolioUrl.replace(/^https?:\/\//, ''), coverLeftX, pageHeight - 19, {
    url: portfolioUrl,
  });

  // Right Hero Showcase Frame
  const heroBoxX = 126;
  const heroBoxY = 20;
  const heroBoxW = pageWidth - heroBoxX - 18;
  const heroBoxH = pageHeight - 40;
  if (heroAsset) {
    drawContainedImage(doc, heroAsset, heroBoxX, heroBoxY, heroBoxW, heroBoxH, palette, true);
  } else {
    doc.setFillColor(...palette.surface);
    doc.roundedRect(heroBoxX, heroBoxY, heroBoxW, heroBoxH, 2, 2, 'F');
  }

  // ============================================================================
  // PAGE 2: BIOGRAPHY & PRINCIPLES
  // ============================================================================
  if (options.includeBiography || options.includePrinciples) {
    doc.addPage();
    pageCount++;
    drawPageBackground(doc, palette, pageWidth, pageHeight);
    drawHeaderAndFooterChrome(
      doc,
      palette,
      pageWidth,
      pageHeight,
      brandName,
      '01 · Semblanza & Filosofía de Trabajo',
      dates.fullDate,
      pageCount
    );

    const bio = siteContent.biography;
    const leftX = margin;
    const leftW = 86;
    const rightX = leftX + leftW + 14;
    const rightW = pageWidth - margin - rightX;

    // Left Portrait & Stats Card
    if (portraitAsset) {
      drawContainedImage(doc, portraitAsset, leftX, 22, leftW, 92, palette, true);
    }

    let leftY = 121;
    doc.setFillColor(...palette.surface);
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftX, leftY, leftW, 24, 2, 2, 'FD');

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...palette.accent);
    doc.text(sanitizePdfText(bio.experienceYears || '+10 Años'), leftX + 6, leftY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...palette.text);
    const expLines = doc.splitTextToSize(
      sanitizePdfText(bio.experienceSubtitle || 'Documentando historias reales en luz natural'),
      leftW - 12
    );
    doc.text(expLines.slice(0, 2), leftX + 6, leftY + 16);

    leftY += 30;
    if (bio.quote) {
      doc.setFont('times', 'italic');
      doc.setFontSize(10.5);
      doc.setTextColor(...palette.heading);
      const qLines = doc.splitTextToSize(`"${sanitizePdfText(bio.quote)}"`, leftW).slice(0, 4);
      doc.text(qLines, leftX, leftY);
      leftY += qLines.length * 5 + 4;
    }

    if (bio.publications && bio.publications.length > 0 && leftY < pageHeight - 25) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...palette.accent);
      doc.text('MENCIONES & COBERTURAS', leftX, leftY);
      leftY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...palette.muted);
      const pubText = bio.publications.map((item) => sanitizePdfText(item)).join('  ·  ');
      const pubLines = doc.splitTextToSize(pubText, leftW).slice(0, 3);
      doc.text(pubLines, leftX, leftY);
    }

    // Right Column: Biography + Principles
    let rightY = 25;
    if (options.includeBiography) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...palette.accent);
      doc.text(sanitizePdfText(bio.tagline || 'FOTÓGRAFO DOCUMENTAL Y EDITORIAL').toUpperCase(), rightX, rightY);
      rightY += 7;

      doc.setFont('times', 'normal');
      doc.setFontSize(22);
      doc.setTextColor(...palette.heading);
      doc.text(photographerName, rightX, rightY);
      rightY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...palette.text);
      const introLines = doc.splitTextToSize(sanitizePdfText(bio.introParagraph), rightW).slice(0, 4);
      doc.text(introLines, rightX, rightY);
      rightY += introLines.length * 4.6 + 4;

      if (bio.detailedBio) {
        doc.setFontSize(9);
        doc.setTextColor(...palette.muted);
        const detLines = doc.splitTextToSize(sanitizePdfText(bio.detailedBio), rightW).slice(0, 7);
        doc.text(detLines, rightX, rightY);
        rightY += detLines.length * 4.4 + 8;
      }
    }

    if (options.includePrinciples && bio.principles && bio.principles.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...palette.accent);
      doc.text('PILARES DEL ESTUDIO', rightX, rightY);
      rightY += 5;

      const cardGap = 4;
      const numCards = Math.min(3, bio.principles.length);
      const cardW = (rightW - cardGap * (numCards - 1)) / numCards;
      const cardH = Math.min(54, pageHeight - 20 - rightY);

      if (cardH >= 28) {
        bio.principles.slice(0, 3).forEach((pr, idx) => {
          const cx = rightX + idx * (cardW + cardGap);
          doc.setFillColor(...palette.surface);
          doc.setDrawColor(...palette.border);
          doc.setLineWidth(0.25);
          doc.roundedRect(cx, rightY, cardW, cardH, 2, 2, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...palette.accent);
          doc.text(sanitizePdfText(pr.number || `0${idx + 1}`), cx + 4, rightY + 7);

          doc.setFont('times', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(...palette.heading);
          const pTitleLines = doc.splitTextToSize(sanitizePdfText(pr.title), cardW - 8).slice(0, 2);
          doc.text(pTitleLines, cx + 4, rightY + 13);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.8);
          doc.setTextColor(...palette.text);
          const descStart = rightY + 13 + pTitleLines.length * 4.5 + 1;
          const pDescLines = doc
            .splitTextToSize(sanitizePdfText(pr.description), cardW - 8)
            .slice(0, Math.max(2, Math.floor((cardH - (descStart - rightY) - 3) / 3.8)));
          doc.text(pDescLines, cx + 4, descStart);
        });
      }
    }
  }

  // ============================================================================
  // GALLERY SPREAD PAGES (CURATED COLLECTIONS)
  // ============================================================================
  for (let gi = 0; gi < galleryPayloads.length; gi++) {
    const { gallery, photos } = galleryPayloads[gi];
    const itemsPerPage = photos.length <= 2 ? 2 : 4;

    // Chunk photos into spreads of 2 or 4 photos per page for crisp editorial breathing room
    const chunks: Array<typeof photos> = [];
    for (let i = 0; i < photos.length; i += itemsPerPage) {
      chunks.push(photos.slice(i, i + itemsPerPage));
    }

    if (chunks.length === 0) continue;

    chunks.forEach((chunk, chunkIdx) => {
      doc.addPage();
      pageCount++;
      drawPageBackground(doc, palette, pageWidth, pageHeight);
      drawHeaderAndFooterChrome(
        doc,
        palette,
        pageWidth,
        pageHeight,
        brandName,
        `Colección ${String(gi + 1).padStart(2, '0')} · ${sanitizePdfText(gallery.title)}`,
        dates.fullDate,
        pageCount
      );

      let gridTopY = 22;

      // On the first page of each gallery, render clean title & editorial description header
      if (chunkIdx === 0) {
        const metaParts = [
          sanitizePdfText(gallery.category),
          gallery.eventDate ? sanitizePdfText(gallery.eventDate) : '',
          gallery.location ? sanitizePdfText(gallery.location) : '',
        ].filter(Boolean);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...palette.accent);
        doc.text(metaParts.join('  ·  ').toUpperCase(), margin, gridTopY);

        doc.setFont('times', 'normal');
        doc.setFontSize(20);
        doc.setTextColor(...palette.heading);
        doc.text(sanitizePdfText(gallery.title), margin, gridTopY + 7.5);

        if (gallery.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...palette.muted);
          const descLines = doc.splitTextToSize(sanitizePdfText(gallery.description), pageWidth - margin * 2).slice(0, 2);
          doc.text(descLines, margin, gridTopY + 13);
          gridTopY += 15 + descLines.length * 4;
        } else {
          gridTopY += 13;
        }
      } else {
        doc.setFont('times', 'italic');
        doc.setFontSize(12);
        doc.setTextColor(...palette.muted);
        doc.text(
          `${sanitizePdfText(gallery.title)} — Continuación (${chunkIdx + 1}/${chunks.length})`,
          margin,
          gridTopY + 3
        );
        gridTopY += 9;
      }

      const gridBottomY = pageHeight - 18;
      const availW = pageWidth - margin * 2;
      const availH = gridBottomY - gridTopY;

      if (chunk.length <= 2) {
        // 1 row x 2 large editorial frames
        const gap = 8;
        const cols = chunk.length === 1 ? 1 : 2;
        const cellW = (availW - gap * (cols - 1)) / cols;
        const labelH = options.includePhotoTitles ? 6 : 0;
        const cellH = availH - labelH;

        chunk.forEach((item, idx) => {
          const x = margin + idx * (cellW + gap);
          if (item.asset) {
            drawContainedImage(doc, item.asset, x, gridTopY, cellW, cellH, palette, true);
          }
          if (options.includePhotoTitles && item.photo.title) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...palette.muted);
            doc.text(
              sanitizePdfText(item.photo.title).slice(0, 58),
              x + 1,
              gridTopY + cellH + 4.2
            );
          }
        });
      } else {
        // 2 rows x 2 columns grid (4 photos per spread)
        const colGap = 7;
        const rowGap = options.includePhotoTitles ? 8 : 5;
        const cellW = (availW - colGap) / 2;
        const labelH = options.includePhotoTitles ? 4.5 : 0;
        const cellH = (availH - rowGap - labelH * 2) / 2;

        chunk.forEach((item, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = margin + col * (cellW + colGap);
          const y = gridTopY + row * (cellH + rowGap + labelH);

          if (item.asset) {
            drawContainedImage(doc, item.asset, x, y, cellW, cellH, palette, true);
          }
          if (options.includePhotoTitles && item.photo.title) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...palette.muted);
            doc.text(sanitizePdfText(item.photo.title).slice(0, 52), x + 1, y + cellH + 3.8);
          }
        });
      }
    });
  }

  // ============================================================================
  // GEAR & TECHNOLOGY PAGE
  // ============================================================================
  if (options.includeGear && siteContent.biography?.gear && siteContent.biography.gear.length > 0) {
    doc.addPage();
    pageCount++;
    drawPageBackground(doc, palette, pageWidth, pageHeight);
    drawHeaderAndFooterChrome(
      doc,
      palette,
      pageWidth,
      pageHeight,
      brandName,
      'Equipo Técnico & Tecnología',
      dates.fullDate,
      pageCount
    );

    const gearTitle = sanitizePdfText(
      siteContent.biography.gearSectionTitle || 'Equipo & Tecnologías de Alta Gama'
    );
    const gearSub = sanitizePdfText(
      siteContent.biography.gearSectionSubtitle ||
        'Herramientas ópticas y flujo digital profesional diseñados para responder con máxima nitidez en cualquier entorno.'
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...palette.accent);
    doc.text(
      sanitizePdfText(siteContent.biography.gearSectionBadge || 'EQUIPAMIENTO DEL ESTUDIO').toUpperCase(),
      margin,
      24
    );

    doc.setFont('times', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(...palette.heading);
    doc.text(gearTitle, margin, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...palette.muted);
    const gearSubLines = doc.splitTextToSize(gearSub, pageWidth - margin * 2).slice(0, 2);
    doc.text(gearSubLines, margin, 38.5);

    const sections = siteContent.biography.gear.slice(0, 4);
    const cols = sections.length <= 2 ? sections.length : 2;
    const rows = Math.ceil(sections.length / cols);
    const startY = 48;
    const gap = 8;
    const cardW = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
    const cardH = (pageHeight - 20 - startY - gap * (rows - 1)) / rows;

    sections.forEach((sec, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = margin + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      doc.setFillColor(...palette.surface);
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...palette.heading);
      doc.text(sanitizePdfText(sec.title), x + 7, y + 10);

      doc.setDrawColor(...palette.accent);
      doc.setLineWidth(0.5);
      doc.line(x + 7, y + 13.5, x + 22, y + 13.5);

      let itemY = y + 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...palette.text);

      for (const item of sec.items) {
        if (itemY > y + cardH - 6) break;
        doc.setFillColor(...palette.accent);
        doc.circle(x + 8.5, itemY - 1.2, 0.9, 'F');
        const lines = doc.splitTextToSize(sanitizePdfText(item), cardW - 18).slice(0, 2);
        doc.text(lines, x + 12, itemY);
        itemY += lines.length * 4.5 + 2.5;
      }
    });
  }

  // ============================================================================
  // PRICING / PACKAGES PAGE
  // ============================================================================
  if (
    options.includePricing &&
    siteContent.contact?.pricingPackages &&
    siteContent.contact.pricingPackages.length > 0
  ) {
    doc.addPage();
    pageCount++;
    drawPageBackground(doc, palette, pageWidth, pageHeight);
    drawHeaderAndFooterChrome(
      doc,
      palette,
      pageWidth,
      pageHeight,
      brandName,
      'Servicios, Paquetes & Inversión',
      dates.fullDate,
      pageCount
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...palette.accent);
    doc.text('EXPERIENCIAS & COBERTURAS', margin, 24);

    doc.setFont('times', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(...palette.heading);
    doc.text(sanitizePdfText(siteContent.contact.pricingTitle || 'Inversión & Colecciones'), margin, 32);

    if (siteContent.contact.pricingNotice) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...palette.muted);
      const noticeLines = doc
        .splitTextToSize(sanitizePdfText(siteContent.contact.pricingNotice), pageWidth - margin * 2)
        .slice(0, 2);
      doc.text(noticeLines, margin, 38.5);
    }

    const pkgs = siteContent.contact.pricingPackages.slice(0, 6);
    const cols = pkgs.length <= 3 ? pkgs.length : 3;
    const rows = Math.ceil(pkgs.length / cols);
    const startY = 49;
    const gap = 7;
    const cardW = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
    const cardH = Math.min(115, (pageHeight - 24 - startY - gap * (rows - 1)) / rows);

    pkgs.forEach((pkg, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = margin + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      doc.setFillColor(...palette.surface);
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...palette.accent);
      doc.text(`OPCIÓN ${String(idx + 1).padStart(2, '0')}`, x + 7, y + 9);

      doc.setFont('times', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(...palette.heading);
      const nameLines = doc.splitTextToSize(sanitizePdfText(pkg.name), cardW - 14).slice(0, 2);
      doc.text(nameLines, x + 7, y + 16);

      const priceY = y + 16 + nameLines.length * 6 + 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...palette.accent);
      doc.text(sanitizePdfText(pkg.price), x + 7, priceY);

      doc.setDrawColor(...palette.border);
      doc.line(x + 7, priceY + 4, x + cardW - 7, priceY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(...palette.text);
      const descLines = doc.splitTextToSize(sanitizePdfText(pkg.description), cardW - 14).slice(0, 7);
      doc.text(descLines, x + 7, priceY + 10.5);
    });
  }

  // ============================================================================
  // FINAL PAGE: DIRECT CONTACT, CLICKABLE LINKS & QR CODE
  // ============================================================================
  if (options.includeContact) {
    doc.addPage();
    pageCount++;
    drawPageBackground(doc, palette, pageWidth, pageHeight);
    drawHeaderAndFooterChrome(
      doc,
      palette,
      pageWidth,
      pageHeight,
      brandName,
      'Contacto Directo & Reserva de Fechas',
      dates.fullDate,
      pageCount
    );

    const cardX = 24;
    const cardY = 28;
    const cardW = pageWidth - 48;
    const cardH = pageHeight - 54;

    doc.setFillColor(...palette.surface);
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.35);
    doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, 'FD');

    const innerLeftX = cardX + 14;
    const innerLeftW = cardW - 88;

    if (logoAsset) {
      drawContainedImage(doc, logoAsset, innerLeftX, cardY + 12, 16, 16, palette, false);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...palette.accent);
    doc.text('CONVERSEMOS SOBRE TU PROYECTO', logoAsset ? innerLeftX + 20 : innerLeftX, cardY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...palette.muted);
    doc.text(`${brandName} · ${photographerName}`, logoAsset ? innerLeftX + 20 : innerLeftX, cardY + 24.5);

    doc.setFont('times', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(...palette.heading);
    const cTitle = sanitizePdfText(siteContent.contact?.title || 'Hagamos historias memorables');
    const cTitleLines = doc.splitTextToSize(cTitle, innerLeftW).slice(0, 2);
    doc.text(cTitleLines, innerLeftX, cardY + 42);

    const cSubY = cardY + 42 + cTitleLines.length * 9.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...palette.text);
    const cSubLines = doc
      .splitTextToSize(
        sanitizePdfText(
          siteContent.contact?.subtitle ||
            'Agenda abierta para bodas, retratos editoriales, proyectos comerciales y coberturas de destino.'
        ),
        innerLeftW
      )
      .slice(0, 3);
    doc.text(cSubLines, innerLeftX, cSubY);

    // Clickable Contact Rows
    const contactRows = [
      { label: 'WHATSAPP DIRECTO', value: contactPhone, url: whatsappUrl },
      { label: 'CORREO ELECTRÓNICO', value: contactEmail, url: `mailto:${contactEmail}` },
      { label: 'INSTAGRAM OFICIAL', value: igInfo.handleText, url: igInfo.url },
      { label: 'PORTAFOLIO EN LÍNEA', value: portfolioUrl.replace(/^https?:\/\//, ''), url: portfolioUrl },
    ];

    let rowY = cSubY + cSubLines.length * 5 + 10;
    contactRows.forEach((row) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...palette.muted);
      doc.text(row.label, innerLeftX, rowY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...palette.accent);
      doc.textWithLink(row.value, innerLeftX + 46, rowY, { url: row.url });

      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.15);
      doc.line(innerLeftX, rowY + 3.2, innerLeftX + innerLeftW - 8, rowY + 3.2);
      rowY += 10.5;
    });

    if (siteContent.contact?.coverageDetails) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...palette.muted);
      const covLines = doc
        .splitTextToSize(`Cobertura: ${sanitizePdfText(siteContent.contact.coverageDetails)}`, innerLeftW)
        .slice(0, 2);
      doc.text(covLines, innerLeftX, cardY + cardH - 12);
    }

    // Right QR Panel inside Contact Card
    const qrBoxSize = 54;
    const qrX = cardX + cardW - qrBoxSize - 14;
    const qrY = cardY + 28;

    doc.setFillColor(...palette.surfaceAlt);
    doc.setDrawColor(...palette.accent);
    doc.setLineWidth(0.35);
    doc.roundedRect(qrX - 4, qrY - 4, qrBoxSize + 8, qrBoxSize + 28, 2.5, 2.5, 'FD');

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrBoxSize, qrBoxSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...palette.heading);
    doc.text('ESCANEA EL PORTAFOLIO', qrX + qrBoxSize / 2, qrY + qrBoxSize + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...palette.muted);
    doc.text('Abre todas las galerías en vivo', qrX + qrBoxSize / 2, qrY + qrBoxSize + 13.5, {
      align: 'center',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...palette.accent);
    doc.textWithLink('Abrir sitio web ->', qrX + qrBoxSize / 2 - 11, qrY + qrBoxSize + 19.5, {
      url: portfolioUrl,
    });
  }

  report(96, 'Guardando archivo PDF...');

  const safeBrandSlug = brandName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '');
  const fileName = `${safeBrandSlug || 'LenteAbiertoMX'}_Portafolio_${dates.fileDate}.pdf`;

  doc.save(fileName);
  report(100, 'Portafolio PDF exportado con éxito');

  return {
    fileName,
    pageCount,
    galleryCount: galleryPayloads.length,
    photoCount: totalPhotosPlanned,
  };
}
