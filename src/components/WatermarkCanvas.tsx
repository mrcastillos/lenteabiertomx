import React from 'react';
import { WatermarkConfig } from '../types';

interface WatermarkCanvasProps {
  watermark: WatermarkConfig;
  className?: string;
}

export const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({ watermark, className = '' }) => {
  if (!watermark.enabled) return null;

  const opacity = watermark.opacity ?? 0.35;
  const mainText = watermark.text || 'LENTE ABIERTO MX';
  const subText = watermark.subtext || 'PREVIA DE CLIENTE · COPIA NO AUTORIZADA';

  if (watermark.style === 'center-stamp') {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 ${className}`}
        style={{ opacity }}
      >
        <div className="border border-white/60 bg-black/40 backdrop-blur-[2px] px-6 py-4 text-center rounded-sm max-w-[85%] shadow-2xl">
          <p className="font-editorial text-xl sm:text-2xl md:text-3xl tracking-[0.25em] text-white font-medium uppercase">
            {mainText}
          </p>
          <div className="w-12 h-px bg-amber-400/80 mx-auto my-2" />
          <p className="text-[10px] sm:text-xs tracking-[0.2em] text-white/80 uppercase font-sans">
            {subText}
          </p>
        </div>
      </div>
    );
  }

  // Diagonal repeated pattern across the entire photograph (high anti-screenshot protection)
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-10 ${className}`}
      style={{ opacity }}
    >
      <div className="absolute -inset-[50%] w-[200%] h-[200%] flex flex-col justify-around rotate-[-30deg] scale-110">
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-around items-center whitespace-nowrap opacity-90 py-4"
          >
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="flex flex-col items-center mx-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <span className="font-editorial text-sm sm:text-base md:text-lg tracking-[0.3em] font-semibold uppercase">
                  {mainText}
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-zinc-300 font-sans uppercase">
                  {subText}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
