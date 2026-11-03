import React, { useState, useEffect } from 'react';
import {
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  Shuffle,
  X,
  BadgeCheck,
  Calendar,
  Share2,
} from 'lucide-react';
import { getStoredInstagramPosts, DEFAULT_INSTAGRAM_POSTS } from '../services/storage';
import { InstagramPost } from '../types';

export const InstagramFeed: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>(() => getStoredInstagramPosts());
  const [activeModalPost, setActiveModalPost] = useState<InstagramPost | null>(null);

  useEffect(() => {
    setPosts(getStoredInstagramPosts());
  }, []);

  const handleShuffle = () => {
    const shuffled = [...posts].sort(() => Math.random() - 0.5);
    setPosts(shuffled);
  };

  return (
    <section className="w-full bg-[#0a0b0d] border-t border-white/5 py-14 sm:py-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header with authentic Instagram identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] shadow-xl shadow-rose-950/30">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                  alt="@lente.abierto.mx"
                  className="w-full h-full rounded-full object-cover border-2 border-[#0a0b0d]"
                />
              </div>
              <span className="absolute bottom-0 right-0 p-1 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow">
                <Instagram className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <a
                  href="https://instagram.com/lente.abierto.mx"
                  target="_blank"
                  rel="noreferrer"
                  className="font-editorial text-2xl sm:text-3xl text-white hover:text-amber-300 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <span>@lente.abierto.mx</span>
                  <BadgeCheck className="w-5 h-5 text-sky-400 fill-sky-400/20" />
                </a>
              </div>
              <p className="text-xs text-zinc-400 font-light mt-0.5 max-w-md">
                Lente Abierto MX · Fotografía documental de bodas de destino, retrato editorial y arquitectura en luz natural.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 mt-1.5">
                <span>
                  <strong className="text-zinc-200 font-sans">450+</strong> publicaciones
                </span>
                <span>·</span>
                <span>
                  <strong className="text-zinc-200 font-sans">12.8K</strong> seguidores
                </span>
                <span>·</span>
                <span className="text-amber-400/90 font-medium">CDMX · Morelos · Oaxaca</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShuffle}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-colors text-xs flex items-center gap-1.5"
              title="Cargar publicaciones aleatorias"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Aleatorio</span>
            </button>

            <a
              href="https://instagram.com/lente.abierto.mx"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 text-white font-medium text-xs tracking-wider uppercase border border-white/10 hover:border-amber-400/40 transition-all flex items-center gap-2 shadow-lg group"
            >
              <Instagram className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Seguir en Instagram</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        </div>

        {/* 6 Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {posts.slice(0, 6).map((post) => (
            <div
              key={post.id}
              onClick={() => setActiveModalPost(post)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-amber-500/40 shadow-lg transition-all duration-300 cursor-pointer"
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
                draggable={false}
              />

              {/* Hover overlay with Instagram details */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-white backdrop-blur-[2px]">
                <div className="flex items-center justify-between text-zinc-300 text-[11px]">
                  <span className="flex items-center gap-1 text-rose-400 font-mono text-[10px]">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Lente Abierto</span>
                  </span>
                  {post.date && <span className="font-mono text-[9px] text-zinc-400">{post.date}</span>}
                </div>

                <p className="text-[11px] text-zinc-200 font-light line-clamp-3 leading-snug">
                  {post.caption}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 border-t border-white/10 pt-2">
                  <span className="flex items-center gap-1 text-rose-300">
                    <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <MessageCircle className="w-3 h-3" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info link */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p className="font-sans tracking-wide">
            Fotografías oficiales de <span className="text-zinc-300 font-medium">@lente.abierto.mx</span> · Documentando bodas de destino en México
          </p>
          <a
            href="https://instagram.com/lente.abierto.mx"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-mono"
          >
            <span>Ver perfil completo en instagram.com/lente.abierto.mx</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Modal preview when clicking a post */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#121316] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-zinc-200">
            <button
              onClick={() => setActiveModalPost(null)}
              className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-white p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md transition-colors"
              aria-label="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo side */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activeModalPost.imageUrl}
                alt=""
                className="w-full h-full object-cover max-h-[500px]"
              />
            </div>

            {/* Info side */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                      alt=""
                      className="w-full h-full rounded-full object-cover border border-[#121316]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-sm">lente.abierto.mx</span>
                      <BadgeCheck className="w-4 h-4 text-sky-400" />
                    </div>
                    <span className="text-[11px] text-zinc-400">Lente Abierto MX · Fotografía</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <p className="text-xs text-zinc-300 font-light leading-relaxed">
                    {activeModalPost.caption}
                  </p>
                  {activeModalPost.date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      <Calendar className="w-3 h-3 text-zinc-600" />
                      <span>{activeModalPost.date}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span className="flex items-center gap-1.5 text-rose-300">
                    <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                    <span>{activeModalPost.likes} Me gusta</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>{activeModalPost.comments} comentarios</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/lente.abierto.mx"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-opacity"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Abrir en Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
