import React from 'react';
import { WatermarkConfig, WatermarkSize, WatermarkStyle } from '../types';

interface WatermarkCanvasProps {
  watermark: WatermarkConfig;
  className?: string;
  seed?: string;
}

const SIZE_MAP: Record<
  WatermarkSize,
  {
    mainClass: string;
    subClass: string;
    patternMainClass: string;
    patternSubClass: string;
    stampPad: string;
    patternGap: string;
  }
> = {
  xs: {
    mainClass: 'text-[10px] sm:text-xs tracking-[0.18em]',
    subClass: 'text-[7px] sm:text-[8px] tracking-[0.14em]',
    patternMainClass: 'text-[10px] sm:text-xs tracking-[0.22em]',
    patternSubClass: 'text-[7px] sm:text-[8px] tracking-[0.16em]',
    stampPad: 'px-3 py-1.5',
    patternGap: 'mx-6 py-2',
  },
  sm: {
    mainClass: 'text-xs sm:text-sm tracking-[0.2em]',
    subClass: 'text-[8px] sm:text-[9px] tracking-[0.16em]',
    patternMainClass: 'text-xs sm:text-sm tracking-[0.24em]',
    patternSubClass: 'text-[8px] sm:text-[9px] tracking-[0.18em]',
    stampPad: 'px-4 py-2',
    patternGap: 'mx-8 py-3',
  },
  md: {
    mainClass: 'text-sm sm:text-lg md:text-xl tracking-[0.22em]',
    subClass: 'text-[9px] sm:text-[10px] tracking-[0.18em]',
    patternMainClass: 'text-sm sm:text-base md:text-lg tracking-[0.28em]',
    patternSubClass: 'text-[9px] sm:text-[10px] tracking-[0.2em]',
    stampPad: 'px-5 py-3',
    patternGap: 'mx-10 py-4',
  },
  lg: {
    mainClass: 'text-lg sm:text-2xl md:text-3xl tracking-[0.25em]',
    subClass: 'text-[10px] sm:text-xs tracking-[0.2em]',
    patternMainClass: 'text-base sm:text-xl md:text-2xl tracking-[0.3em]',
    patternSubClass: 'text-[10px] sm:text-xs tracking-[0.22em]',
    stampPad: 'px-6 py-4',
    patternGap: 'mx-12 py-5',
  },
  xl: {
    mainClass: 'text-xl sm:text-3xl md:text-4xl tracking-[0.28em]',
    subClass: 'text-xs sm:text-sm tracking-[0.22em]',
    patternMainClass: 'text-lg sm:text-2xl md:text-3xl tracking-[0.32em]',
    patternSubClass: 'text-xs sm:text-sm tracking-[0.24em]',
    stampPad: 'px-8 py-5',
    patternGap: 'mx-14 py-6',
  },
};

function isDarkHex(hex: string): boolean {
  const clean = (hex || '#ffffff').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 90;
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const RANDOM_POSITION_SLOTS = [
  { align: 'items-start justify-start p-4 sm:p-6 text-left', rotate: '0deg' },
  { align: 'items-start justify-center p-4 sm:p-6 text-center', rotate: '0deg' },
  { align: 'items-start justify-end p-4 sm:p-6 text-right', rotate: '0deg' },
  { align: 'items-center justify-start p-4 sm:p-6 text-left', rotate: '-6deg' },
  { align: 'items-center justify-center p-4 sm:p-6 text-center', rotate: '-12deg' },
  { align: 'items-center justify-end p-4 sm:p-6 text-right', rotate: '6deg' },
  { align: 'items-end justify-start p-4 sm:p-6 text-left', rotate: '0deg' },
  { align: 'items-end justify-center p-4 sm:p-6 text-center', rotate: '0deg' },
  { align: 'items-end justify-end p-4 sm:p-6 text-right', rotate: '0deg' },
];

export const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({
  watermark,
  className = '',
  seed = 'default',
}) => {
  if (!watermark.enabled) return null;

  const opacity = watermark.opacity ?? 0.35;
  const mainText = watermark.text || 'LENTE ABIERTO MX';
  const subText = watermark.subtext || '';
  const sizeKey: WatermarkSize = watermark.size && SIZE_MAP[watermark.size] ? watermark.size : 'md';
  const sizeSpec = SIZE_MAP[sizeKey];
  const color = watermark.color || '#ffffff';
  const darkInk = isDarkHex(color);
  const textShadow = darkInk
    ? '0 1px 6px rgba(255, 255, 255, 0.45)'
    : '0 2px 8px rgba(0, 0, 0, 0.85)';

  const styleMode: WatermarkStyle = watermark.style || 'diagonal-pattern';

  // 1. Diagonal repeating pattern (high anti-screenshot protection)
  if (styleMode === 'diagonal-pattern') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-10 ${className}`}
        style={{ opacity }}
      >
        <div className="absolute -inset-[50%] w-[200%] h-[200%] flex flex-col justify-around rotate-[-30deg] scale-110">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-around items-center whitespace-nowrap opacity-95 py-2"
            >
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={`flex flex-col items-center ${sizeSpec.patternGap}`}
                  style={{ color, textShadow }}
                >
                  <span className={`font-editorial font-semibold uppercase ${sizeSpec.patternMainClass}`}>
                    {mainText}
                  </span>
                  {subText && (
                    <span className={`font-sans uppercase opacity-85 ${sizeSpec.patternSubClass}`}>
                      {subText}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Framed center stamp
  if (styleMode === 'center-stamp') {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-4 ${className}`}
        style={{ opacity }}
      >
        <div
          className={`backdrop-blur-[2px] text-center rounded-sm max-w-[88%] shadow-2xl ${sizeSpec.stampPad} ${
            darkInk ? 'bg-white/45 border border-black/40' : 'bg-black/40 border border-white/55'
          }`}
          style={{ color, textShadow }}
        >
          <p className={`font-editorial font-medium uppercase ${sizeSpec.mainClass}`}>
            {mainText}
          </p>
          {subText && (
            <>
              <div
                className="w-12 h-px mx-auto my-2 opacity-75"
                style={{ backgroundColor: color }}
              />
              <p className={`uppercase font-sans opacity-90 ${sizeSpec.subClass}`}>
                {subText}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. Positioned text modes (center-text, corners, random)
  const slot =
    styleMode === 'random'
      ? RANDOM_POSITION_SLOTS[hashSeed(`${seed}-${mainText}`) % RANDOM_POSITION_SLOTS.length]
      : styleMode === 'center-text'
      ? { align: 'items-center justify-center p-4 text-center', rotate: '0deg' }
      : styleMode === 'top-left'
      ? { align: 'items-start justify-start p-4 sm:p-6 text-left', rotate: '0deg' }
      : styleMode === 'top-right'
      ? { align: 'items-start justify-end p-4 sm:p-6 text-right', rotate: '0deg' }
      : styleMode === 'bottom-left'
      ? { align: 'items-end justify-start p-4 sm:p-6 text-left', rotate: '0deg' }
      : { align: 'items-end justify-end p-4 sm:p-6 text-right', rotate: '0deg' }; // bottom-right default

  return (
    <div
      className={`absolute inset-0 flex pointer-events-none select-none z-10 ${slot.align} ${className}`}
      style={{ opacity }}
    >
      <div
        className="max-w-[85%] leading-tight"
        style={{
          color,
          textShadow,
          transform: slot.rotate !== '0deg' ? `rotate(${slot.rotate})` : undefined,
        }}
      >
        <p className={`font-editorial font-semibold uppercase ${sizeSpec.mainClass}`}>
          {mainText}
        </p>
        {subText && (
          <p className={`uppercase font-sans mt-0.5 opacity-90 ${sizeSpec.subClass}`}>
            {subText}
          </p>
        )}
      </div>
    </div>
  );
};
