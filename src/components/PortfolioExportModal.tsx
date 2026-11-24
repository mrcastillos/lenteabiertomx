import React, { useState, useMemo, useEffect } from 'react';
import {
  FileDown,
  X,
  Check,
  Sparkles,
  Calendar,
  Heart,
  Lock,
  Globe,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { FavoriteLog, Gallery, SiteContentConfig } from '../types';
import { generatePortfolioPdf, PdfThemeStyle } from '../services/portfolioPdfGenerator';
import { getAccessToken } from '../services/firebase';

interface PortfolioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleries: Gallery[];
  siteContent: SiteContentConfig;
  favoriteLogs: FavoriteLog[];
}

export const PortfolioExportModal: React.FC<PortfolioExportModalProps> = ({
  isOpen,
  onClose,
  galleries,
  siteContent,
  favoriteLogs,
}) => {
  const publicGalleryIds = useMemo(
    () => galleries.filter((g) => !g.isPrivate && g.photos.length > 0).map((g) => g.id),
    [galleries]
  );

  const [dossierTitle, setDossierTitle] = useState('Portafolio Fotográfico Profesional');
  const [recipientName, setRecipientName] = useState('');
  const [themeStyle, setThemeStyle] = useState<PdfThemeStyle>('dark');
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>(() =>
    publicGalleryIds.length > 0
      ? publicGalleryIds
      : galleries.filter((g) => g.photos.length > 0).map((g) => g.id)
  );
  const [photosPerGallery, setPhotosPerGallery] = useState<number>(4);
  const [prioritizeFavorites, setPrioritizeFavorites] = useState<boolean>(true);
  const [includePhotoTitles, setIncludePhotoTitles] = useState<boolean>(true);
  const [includeBiography, setIncludeBiography] = useState<boolean>(true);
  const [includePrinciples, setIncludePrinciples] = useState<boolean>(true);
  const [includeGear, setIncludeGear] = useState<boolean>(true);
  const [includePricing, setIncludePricing] = useState<boolean>(true);
  const [includeContact, setIncludeContact] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; step: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    fileName: string;
    pageCount: number;
    photoCount: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessInfo(null);
    setProgress(null);
    const validIds = new Set(galleries.filter((g) => g.photos.length > 0).map((g) => g.id));
    setSelectedGalleryIds((prev) => {
      const stillValid = prev.filter((id) => validIds.has(id));
      if (stillValid.length > 0) return stillValid;
      return publicGalleryIds.length > 0 ? publicGalleryIds : Array.from(validIds);
    });
  }, [isOpen, galleries, publicGalleryIds]);

  if (!isOpen) return null;

  const formattedToday = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const toggleGallery = (id: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedPhotosEstimate = selectedGalleryIds.reduce((sum, id) => {
    const g = galleries.find((item) => item.id === id);
    return sum + (g ? Math.min(photosPerGallery, g.photos.length) : 0);
  }, 0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessInfo(null);
    setProgress({ percent: 2, step: 'Iniciando exportación editorial...' });

    try {
      const token = await getAccessToken();
      const portfolioUrl =
        typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
          ? window.location.origin
          : 'https://lenteabiertomx.vercel.app';

      const result = await generatePortfolioPdf(siteContent, galleries, favoriteLogs, {
        dossierTitle,
        recipientName,
        themeStyle,
        includeBiography,
        includePrinciples,
        includeGear,
        includePricing,
        includeContact,
        selectedGalleryIds,
        photosPerGallery,
        prioritizeFavorites,
        includePhotoTitles,
        portfolioUrl,
        accessToken: token,
        onProgress: (p) => setProgress(p),
      });

      setSuccessInfo({
        fileName: result.fileName,
        pageCount: result.pageCount,
        photoCount: result.photoCount,
      });
    } catch (err: any) {
      console.error('Error generating portfolio PDF:', err);
      setErrorMsg(err?.message || 'Ocurrió un problema al generar el archivo PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#121316] border border-amber-500/30 rounded-3xl shadow-2xl text-zinc-200">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 bg-[#121316]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-editorial text-xl sm:text-2xl text-white truncate">
                Exportar Portafolio Profesional (PDF)
              </h3>
              <p className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Fecha actual incluida: {formattedToday}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* Title & Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Título del Dossier / Portada
              </label>
              <input
                type="text"
                value={dossierTitle}
                onChange={(e) => setDossierTitle(e.target.value)}
                placeholder="Portafolio Fotográfico Profesional"
                className="w-full bg-[#181a1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/70"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Dirigido a (Opcional · Cliente / Marca)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ej. Ana & Carlos / Agencia XYZ"
                className="w-full bg-[#181a1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          {/* Visual Theme Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Diseño Editorial del PDF
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setThemeStyle('dark')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  themeStyle === 'dark'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white'
                    : 'bg-[#181a1f] border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#0c0d0e] border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Oscuro Editorial (Lujo)</p>
                  <p className="text-[11px] text-zinc-400">Fondo carbón con acentos dorados · Ideal digital</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setThemeStyle('light')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  themeStyle === 'light'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white'
                    : 'bg-[#181a1f] border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#faf8f5] border border-zinc-300 flex items-center justify-center text-amber-700 shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Blanco Galería (Imprimible)</p>
                  <p className="text-[11px] text-zinc-400">Papel marfil claro · Ideal para impresión o dossier</p>
                </div>
              </button>
            </div>
          </div>

          {/* CMS Sections Checkboxes */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Secciones Profesionales a Incluir
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { label: 'Biografía de Autor', checked: includeBiography, set: setIncludeBiography },
                { label: 'Pilares / Principios', checked: includePrinciples, set: setIncludePrinciples },
                { label: 'Equipo Técnico', checked: includeGear, set: setIncludeGear },
                { label: 'Paquetes e Inversión', checked: includePricing, set: setIncludePricing },
                { label: 'Contacto + Código QR', checked: includeContact, set: setIncludeContact },
                { label: 'Títulos en Fotos', checked: includePhotoTitles, set: setIncludePhotoTitles },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.set(!item.checked)}
                  className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                    item.checked
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-[#181a1f] border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      item.checked ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-600'
                    }`}
                  >
                    {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Galleries & Photos Selection */}
          <div className="space-y-3 bg-[#181a1f]/70 border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Colecciones Fotográficas ({selectedGalleryIds.length} seleccionadas · {selectedPhotosEstimate} fotos)</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Las imágenes se adaptan proporcionalmente sin recortarse ni perder nitidez.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono uppercase">
                <button
                  type="button"
                  onClick={() => setSelectedGalleryIds(publicGalleryIds)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                >
                  Solo Públicas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGalleryIds(galleries.filter((g) => g.photos.length > 0).map((g) => g.id))
                  }
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGalleryIds([])}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10"
                >
                  Ninguna
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {galleries.map((g) => {
                const selected = selectedGalleryIds.includes(g.id);
                const disabled = g.photos.length === 0;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleGallery(g.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all disabled:opacity-40 ${
                      selected
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-[#121316] border-white/5 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={g.coverPhotoUrl}
                      alt={g.title}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 bg-black"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{g.title}</p>
                      <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                        {g.isPrivate ? (
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        ) : (
                          <Globe className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {g.category} · {g.photos.length} fotos
                        </span>
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        selected ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-600'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Photos per gallery + Prioritize favorites */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Fotos por colección:</span>
                <div className="flex items-center gap-1">
                  {[2, 4, 6, 8, 12].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setPhotosPerGallery(count)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        photosPerGallery === count
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrioritizeFavorites(!prioritizeFavorites)}
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  prioritizeFavorites
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${prioritizeFavorites ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>Priorizar fotos más votadas</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isGenerating && progress && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-200">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>{progress.step}</span>
                </span>
                <span className="font-mono font-bold tabular-nums">{progress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Feedback */}
          {successInfo && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-100 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  ¡Portafolio PDF descargado! ({successInfo.fileName})
                </p>
                <p className="text-emerald-200/85 mt-0.5">
                  Se generaron {successInfo.pageCount} páginas editoriales con {successInfo.photoCount} fotografías, fecha actual, tus datos del CMS y código QR escaneable.
                </p>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'Generando PDF...' : 'Generar y Descargar PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
