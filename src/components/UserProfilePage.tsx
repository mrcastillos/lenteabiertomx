import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Globe,
  Camera,
  Edit3,
  Check,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, Gallery } from '../types';
import { updateUserProfile } from '../services/userService';

interface UserProfilePageProps {
  user: UserProfile;
  galleries: Gallery[];
  onSelectGallery: (gallery: Gallery) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  user,
  galleries,
  onSelectGallery,
  onUpdateUser,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatarUrl || '');
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    whatsapp: user.whatsapp || '',
    instagram: user.instagram || '',
    location: user.location || '',
    website: user.website || '',
    bio: user.bio || '',
    detailedBio: user.detailedBio || '',
    avatarUrl: user.avatarUrl || '',
  });

  useEffect(() => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      instagram: user.instagram || '',
      location: user.location || '',
      website: user.website || '',
      bio: user.bio || '',
      detailedBio: user.detailedBio || '',
      avatarUrl: user.avatarUrl || '',
    });
    setAvatarPreview(user.avatarUrl || '');
  }, [user]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarPreview(result);
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUserProfile(user.id, {
      ...formData,
      avatarUrl: formData.avatarUrl || avatarPreview,
    });
    onUpdateUser(updated);
    setIsEditing(false);
  };

  const userGalleries = galleries.filter(
    (g) =>
      user.role === 'fotografo' ||
      user.role === 'admin' ||
      (user.assignedGalleries && user.assignedGalleries.includes(g.id))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-zinc-200">
      {/* Profile Header Card */}
      <div className="relative rounded-3xl bg-[#121316] border border-white/5 p-8 sm:p-10 mb-12 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-amber-400/40 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-500 text-black text-[10px] font-bold shadow">
                <Shield className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-editorial text-3xl sm:text-4xl text-white font-medium">
                  {user.name}
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1 max-w-lg">
                {user.bio || 'Miembro de la plataforma Lente Abierto MX'}
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 font-mono">
                <span>ID: {user.id}</span>
                <span>·</span>
                <span>Miembro desde {new Date(user.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs tracking-wider uppercase text-zinc-200 border border-white/10 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditing ? 'Cancelar Edición' : 'Editar Perfil'}</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-xs tracking-wider uppercase text-red-300 border border-red-500/20 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Contact Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 text-xs font-sans">
          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
              Correo Electrónico
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
              Teléfono / WhatsApp
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user.phone || '+52 777 374 3420'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
              Ubicación Base
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.location || 'Cuernavaca, Morelos / CDMX'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
              Redes & Web
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Instagram className="w-3.5 h-3.5 text-rose-400" />
              <a
                href="https://instagram.com/lente.abierto.mx"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-amber-300"
              >
                {user.instagram || '@lente.abierto.mx'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Form Drawer */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="p-8 rounded-3xl bg-[#141518] border border-amber-500/30 mb-12 shadow-2xl animate-fadeIn space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-editorial text-2xl text-white font-medium">
              Actualizar Información Profesional y Fotografía
            </h3>
            <span className="text-xs text-amber-400 font-mono">Modo Edición</span>
          </div>

          {/* AVATAR / PROFILE PHOTO UPLOAD SECTION */}
          <div className="p-5 rounded-2xl bg-[#181a1f] border border-white/10 space-y-4">
            <label className="block text-amber-400 uppercase tracking-widest text-[11px] font-mono">
              Fotografía de Perfil / Retrato del Fotógrafo
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-full ring-2 ring-amber-500/50 overflow-hidden bg-black shadow-xl">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Vista previa de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono gap-1 cursor-pointer"
                  title="Cambiar fotografía"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Subir</span>
                </button>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir desde mi Equipo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultPic =
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';
                      setAvatarPreview(defaultPic);
                      setFormData((p) => ({ ...p, avatarUrl: defaultPic }));
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-400" />
                    <span>Restablecer Retrato Oficial</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview('');
                        setFormData((p) => ({ ...p, avatarUrl: '' }));
                      }}
                      className="px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/20 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] uppercase font-mono tracking-wider mb-1">
                    O escribe / pega enlace directo a la fotografía (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formData.avatarUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, avatarUrl: e.target.value });
                          setAvatarPreview(e.target.value);
                        }}
                        placeholder="https://ejemplo.com/mi-foto-perfil.jpg"
                        className="w-full bg-[#121316] border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Biografía Corta (Lema o Resumen)
            </label>
            <input
              type="text"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Biografía Profesional Detallada & Trayectoria
            </label>
            <textarea
              rows={6}
              value={formData.detailedBio}
              onChange={(e) => setFormData({ ...formData, detailedBio: e.target.value })}
              className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-light leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* Detailed Professional Biography Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8 p-8 sm:p-10 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-mono">
            <Sparkles className="w-4 h-4" />
            <span>Perfil Profesional Detallado</span>
          </div>
          <h2 className="font-editorial text-3xl text-white font-medium">
            Trayectoria, Visión & Experiencia
          </h2>
          <div className="text-zinc-300 font-light leading-relaxed text-sm space-y-4 whitespace-pre-line">
            {user.detailedBio ||
              'Director fotográfico de Lente Abierto MX. Especialista en captura de alta gama con luz natural, bodas de destino en México y proyectos editoriales.'}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Specialties */}
          <div className="p-6 rounded-3xl bg-[#121316] border border-white/5 space-y-4">
            <h4 className="font-editorial text-lg text-white font-medium">Especialidades</h4>
            <div className="flex flex-wrap gap-2">
              {(user.specialties || [
                'Bodas de Destino',
                'Retrato Editorial',
                'Arquitectura',
                'Fine Art',
              ]).map((spec) => (
                <span
                  key={spec}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-light"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Equipment Arsenal */}
          <div className="p-6 rounded-3xl bg-[#121316] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs uppercase font-mono">
              <Camera className="w-3.5 h-3.5" />
              <span>Arsenal Óptico</span>
            </div>
            <ul className="text-xs text-zinc-400 space-y-2 font-light">
              {(user.equipmentList || [
                'Sony α7R V (61 MP)',
                'FE 35mm F1.4 GM',
                'FE 50mm F1.2 GM',
                'Profoto A10',
              ]).map((eq) => (
                <li key={eq} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{eq}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Galleries Accessible to this User */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="font-editorial text-2xl text-white">Galerías Asignadas / Colecciones</h3>
            <p className="text-xs text-zinc-400">
              {user.role === 'fotografo' || user.role === 'admin'
                ? 'Acceso de creador a todas las galerías de Lente Abierto MX'
                : 'Tus galerías privadas activas'}
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">{userGalleries.length} Colecciones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGalleries.map((gallery) => (
            <div
              key={gallery.id}
              onClick={() => onSelectGallery(gallery)}
              className="p-4 rounded-2xl bg-[#121316] border border-white/5 hover:border-amber-500/40 cursor-pointer flex items-center gap-4 group transition-all"
            >
              <img
                src={gallery.coverPhotoUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase text-amber-400 block mb-0.5">
                  {gallery.category}
                </span>
                <p className="font-editorial text-lg text-white group-hover:text-amber-300 truncate">
                  {gallery.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PIN: <span className="font-mono text-zinc-200">{gallery.downloadPin || 'Libre'}</span> ·{' '}
                  {gallery.photos.length} fotos
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
