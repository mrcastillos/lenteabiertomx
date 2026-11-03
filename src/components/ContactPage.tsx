import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import { BookingInquiry, SiteContentConfig } from '../types';
import { saveInquiry, DEFAULT_SITE_CONTENT } from '../services/storage';

interface ContactPageProps {
  contact?: SiteContentConfig['contact'];
}

export const ContactPage: React.FC<ContactPageProps> = ({
  contact = DEFAULT_SITE_CONTENT.contact,
}) => {
  const c = contact || DEFAULT_SITE_CONTENT.contact;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: 'Boda de Destino',
    eventDate: '',
    location: '',
    budgetRange: 'Estándar ($35,000 - $60,000 MXN)',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const newInquiry: BookingInquiry = {
      id: `inq-${Date.now()}`,
      clientName: form.name,
      email: form.email,
      phone: form.phone,
      serviceType: form.serviceType,
      eventDate: form.eventDate,
      location: form.location,
      budgetRange: form.budgetRange,
      message: form.message,
      createdAt: new Date().toISOString(),
      status: 'nuevo',
    };

    saveInquiry(newInquiry);
    setSubmitted(true);
  };

  const whatsappCleanNumber = (c.whatsapp || c.phone || '527773743420').replace(/[^0-9]/g, '');
  const whatsappMessage = encodeURIComponent(
    `Hola Martín, me interesa consultar disponibilidad para una fecha con Lente Abierto MX. Mi nombre es ${form.name || ''}.`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-zinc-200">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs uppercase tracking-[0.25em]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agenda & Cotizaciones</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-white font-normal leading-[1.1]">
          {c.title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
          {c.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact info & channels */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <h3 className="font-editorial text-2xl text-white font-medium">
              Contacto Directo
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
                    Teléfono & WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${whatsappCleanNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-200 hover:text-amber-400 font-medium text-sm transition-colors"
                  >
                    {c.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
                    Correo Electrónico
                  </span>
                  <a
                    href={`mailto:${c.email}`}
                    className="text-zinc-200 hover:text-amber-400 font-medium text-sm transition-colors"
                  >
                    {c.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
                    Base de Operaciones & Estudio
                  </span>
                  <p className="text-zinc-200 font-medium text-sm">
                    {c.locationTitle}
                  </p>
                  {c.locationDetails && (
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {c.locationDetails}
                    </p>
                  )}
                  {c.coverageDetails && (
                    <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">
                      {c.coverageDetails}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Direct WhatsApp button */}
            <a
              href={`https://wa.me/${whatsappCleanNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chatear por WhatsApp Ahora</span>
            </a>
          </div>

          {/* Pricing Guidelines */}
          {c.pricingPackages && c.pricingPackages.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#121316]/50 border border-white/5 space-y-4">
              <h4 className="font-editorial text-lg text-zinc-200 font-medium">
                {c.pricingTitle || 'Colecciones & Guía de Inversión'}
              </h4>
              <div className="space-y-3 text-xs text-zinc-400 font-light">
                {c.pricingPackages.map((pkg) => (
                  <div key={pkg.id} className="py-2 border-b border-white/5 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-200 font-medium">{pkg.name}</span>
                      <span className="font-mono text-amber-400 font-semibold">{pkg.price}</span>
                    </div>
                    {pkg.description && (
                      <p className="text-[11px] text-zinc-500">{pkg.description}</p>
                    )}
                  </div>
                ))}
              </div>
              {c.pricingNotice && (
                <p className="text-[11px] text-zinc-500 leading-normal border-t border-white/5 pt-2">
                  {c.pricingNotice}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#121316] border border-white/5 shadow-2xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-editorial text-3xl text-white font-medium">
                  ¡Mensaje Enviado con Éxito!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Gracias por tu confianza, <span className="text-zinc-200 font-medium">{form.name}</span>. Hemos recibido tu solicitud de cotización. Nos comunicaremos contigo en menos de 24 horas por correo o WhatsApp.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: '',
                        email: '',
                        phone: '',
                        serviceType: 'Boda de Destino',
                        eventDate: '',
                        location: '',
                        budgetRange: 'Estándar ($35,000 - $60,000 MXN)',
                        message: '',
                      });
                    }}
                    className="text-xs uppercase tracking-widest text-amber-400 hover:underline"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium mb-2">
                  Solicitud de Fecha & Cotización
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej. Sofía Morales"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="sofia@ejemplo.com"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Tipo de Cobertura
                    </label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    >
                      <option value="Boda de Destino">Boda de Destino (Full Day)</option>
                      <option value="Boda Íntima / Civil">Boda Íntima / Civil</option>
                      <option value="Retrato Editorial & Moda">Retrato Editorial & Moda</option>
                      <option value="Arquitectura & Espacios">Arquitectura & Espacios</option>
                      <option value="Sesión de Pareja / Preboda">Sesión de Pareja / Preboda</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Fecha Estimada del Evento
                    </label>
                    <input
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                      Lugar o Ciudad
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Ej. Oaxaca de Juárez / Hacienda San Miguel"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-sans">
                    Mensaje & Detalles del Evento
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Cuéntanos sobre tu visión, número aproximado de invitados, estilo o inquietudes especiales..."
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-xs tracking-widest uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud de Cotización</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
