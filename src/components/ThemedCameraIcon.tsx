import React, { createContext, useContext } from 'react';
import { ThemePresetId } from '../types';

export type CameraIconVariant = 'camera' | 'shutter' | 'vintage' | 'lens';

export const ThemePresetContext = createContext<ThemePresetId>('default');

export function useThemePreset(): ThemePresetId {
  return useContext(ThemePresetContext);
}

interface ThemedCameraIconProps {
  variant?: CameraIconVariant;
  preset?: ThemePresetId;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Custom editorial compendium of camera & shutter vignette icons that dynamically
 * transform with seasonal themes (Halloween dripping blood, Navidad Santa hat,
 * San Valentín heart iris, Primavera botanical sprout, or clean editorial finish).
 */
export const ThemedCameraIcon: React.FC<ThemedCameraIconProps> = ({
  variant = 'camera',
  preset,
  size = 20,
  className = '',
  title,
}) => {
  const activePreset = preset ?? useThemePreset();

  const renderBaseShape = () => {
    switch (variant) {
      case 'shutter':
        return (
          <g>
            {/* Outer aperture barrel */}
            <circle cx="16" cy="17" r="10.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            <circle cx="16" cy="17" r="8.1" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.45" fill="none" />
            {/* 6-blade geometric shutter diaphragm */}
            <path
              d="M16 9 L19.6 14.5 M22.9 13 L17.3 15.6 M22.9 21 L18.2 18.6 M16 25 L12.4 19.5 M9.1 21 L14.7 18.4 M9.1 13 L13.8 15.4"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <circle cx="16" cy="17" r="2.6" stroke="currentColor" strokeWidth="1.35" fill="none" />
          </g>
        );

      case 'vintage':
        return (
          <g>
            {/* Twin rangefinder dials */}
            <rect x="6.5" y="7.5" width="3.5" height="2" rx="0.6" fill="currentColor" fillOpacity="0.85" />
            <rect x="20" y="7.2" width="4.5" height="2.3" rx="0.7" fill="currentColor" fillOpacity="0.85" />
            {/* Rangefinder body */}
            <rect x="4.5" y="9.5" width="23" height="15" rx="2.6" stroke="currentColor" strokeWidth="1.7" fill="none" />
            {/* Top metal trim line */}
            <line x1="4.8" y1="13.2" x2="27.2" y2="13.2" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.5" />
            {/* Optical viewfinder + meter */}
            <rect x="7" y="10.6" width="3.6" height="2" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="24" cy="11.6" r="0.85" fill="currentColor" />
            {/* Classic prime lens */}
            <circle cx="16" cy="18.5" r="4.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <circle cx="16" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.15" fill="none" />
          </g>
        );

      case 'lens':
        return (
          <g>
            {/* Outer telephoto/prime lens barrel */}
            <circle cx="16" cy="17" r="10.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
            {/* Focus knurl arcs */}
            <path
              d="M9.5 11.2 A8.5 8.5 0 0 1 22.5 11.2 M22.5 22.8 A8.5 8.5 0 0 1 9.5 22.8"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeDasharray="1.8 1.8"
              fill="none"
            />
            <circle cx="16" cy="17" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="17" r="2.7" stroke="currentColor" strokeWidth="1.2" fill="none" />
            {/* Glass specular glint */}
            <path
              d="M12.7 13.7 A4.6 4.6 0 0 1 16 12.4"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );

      case 'camera':
      default:
        return (
          <g>
            {/* DSLR / Mirrorless prism + shutter button */}
            <rect x="22" y="8" width="3" height="1.8" rx="0.5" fill="currentColor" />
            <path
              d="M11.5 9.8 L13.2 7.2 H18.8 L20.5 9.8 H25.2 A2.3 2.3 0 0 1 27.5 12.1 V22.4 A2.3 2.3 0 0 1 25.2 24.7 H6.8 A2.3 2.3 0 0 1 4.5 22.4 V12.1 A2.3 2.3 0 0 1 6.8 9.8 Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Main lens */}
            <circle cx="16" cy="17.2" r="4.8" stroke="currentColor" strokeWidth="1.65" fill="none" />
            <circle cx="16" cy="17.2" r="2" stroke="currentColor" strokeWidth="1.15" fill="none" />
            {/* Focus assist dot */}
            <circle cx="8.2" cy="13" r="0.85" fill="currentColor" />
          </g>
        );
    }
  };

  const renderThemeEmbellishment = () => {
    if (activePreset === 'halloween') {
      // Dripping crimson blood along the lower edge + eerie orange iris glint
      const dripBaseY = variant === 'shutter' || variant === 'lens' ? 25.5 : 24.2;
      return (
        <g>
          {/* Glowing eerie iris core */}
          <circle
            cx="16"
            cy={variant === 'vintage' ? 18.5 : variant === 'camera' ? 17.2 : 17}
            r="1.35"
            fill="#f97316"
          />
          {/* Crimson blood drips oozing from bottom rim */}
          <path
            d={`M7.5 ${dripBaseY} C7.5 ${dripBaseY + 2.2}, 6.6 ${dripBaseY + 4.3}, 7.8 ${dripBaseY + 4.8} C8.9 ${dripBaseY + 4.3}, 8.3 ${dripBaseY + 1.8}, 9.5 ${dripBaseY}
               L12.6 ${dripBaseY} C12.4 ${dripBaseY + 3.4}, 11.7 ${dripBaseY + 6.4}, 13.1 ${dripBaseY + 6.9} C14.5 ${dripBaseY + 6.4}, 13.9 ${dripBaseY + 2.7}, 15.2 ${dripBaseY}
               L18.4 ${dripBaseY} C18.2 ${dripBaseY + 1.9}, 17.9 ${dripBaseY + 3.7}, 19 ${dripBaseY + 4.1} C20 ${dripBaseY + 3.7}, 19.7 ${dripBaseY + 1.6}, 20.8 ${dripBaseY}
               L22.6 ${dripBaseY} C22.5 ${dripBaseY + 2.8}, 22 ${dripBaseY + 5.2}, 23.2 ${dripBaseY + 5.7} C24.3 ${dripBaseY + 5.2}, 23.9 ${dripBaseY + 2.2}, 24.8 ${dripBaseY} Z`}
            fill="#dc2626"
          />
          {/* Glossy dark crimson highlights */}
          <circle cx="13.1" cy={dripBaseY + 5.6} r="0.6" fill="#fca5a5" />
          <circle cx="23.2" cy={dripBaseY + 4.5} r="0.5" fill="#fca5a5" />
        </g>
      );
    }

    if (activePreset === 'navidad') {
      // Playful Santa Claus hat perched on top + festive star sparkle
      return (
        <g>
          {/* Red Santa hat body */}
          <path
            d="M7.5 10.2 C8.5 4.2, 13.5 1.8, 18.8 3.2 C21.2 3.8, 22.6 5.6, 23 6.8 C21 6.2, 19 6.6, 17.2 8.4 L16.2 10.2 Z"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          {/* White fluffy brim */}
          <rect
            x="6.6"
            y="8.6"
            width="10.8"
            height="2.7"
            rx="1.35"
            fill="#ffffff"
            stroke="#e4e4e7"
            strokeWidth="0.6"
          />
          {/* White pom-pom at tip */}
          <circle cx="23.2" cy="6.8" r="1.9" fill="#ffffff" stroke="#e4e4e7" strokeWidth="0.6" />
          {/* Tiny golden holiday sparkle */}
          <path
            d="M26 5.5 L26.5 6.8 L27.8 7.3 L26.5 7.8 L26 9.1 L25.5 7.8 L24.2 7.3 L25.5 6.8 Z"
            fill="#fde68a"
          />
        </g>
      );
    }

    if (activePreset === 'san-valentin') {
      const cy = variant === 'vintage' ? 18.5 : variant === 'camera' ? 17.2 : 17;
      return (
        <g>
          <path
            d={`M16 ${cy + 2.2} C14.1 ${cy + 0.8}, 13.4 ${cy - 0.6}, 14.3 ${cy - 1.5} C15 ${cy - 2.1}, 15.8 ${cy - 1.5}, 16 ${cy - 0.9} C16.2 ${cy - 1.5}, 17 ${cy - 2.1}, 17.7 ${cy - 1.5} C18.6 ${cy - 0.6}, 17.9 ${cy + 0.8}, 16 ${cy + 2.2} Z`}
            fill="#e11d48"
          />
          <path d="M24.8 4.8 C24 4.1, 23.2 4.6, 23.5 5.4 C23.7 6.1, 24.8 6.9, 24.8 6.9 C24.8 6.9, 25.9 6.1, 26.1 5.4 C26.4 4.6, 25.6 4.1, 24.8 4.8 Z" fill="#fb7185" />
        </g>
      );
    }

    if (activePreset === 'primavera') {
      return (
        <g>
          {/* Fresh emerald sprout leaf */}
          <path
            d="M23.5 9.2 C23.5 5.2, 27 3.8, 29 4 C29.2 6.8, 27 9.4, 23.5 9.2 Z"
            fill="#10b981"
          />
          <path d="M23.5 9.2 C25.2 7.5, 26.8 6, 28.4 4.6" stroke="#a7f3d0" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        </g>
      );
    }

    // Default / Editorial / Minimal Claro subtle gold optical reflection
    const cy = variant === 'vintage' ? 18.5 : variant === 'camera' ? 17.2 : 17;
    return <circle cx="14.5" cy={cy - 1.5} r="0.8" fill="currentColor" fillOpacity="0.7" />;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 overflow-visible ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {renderBaseShape()}
      {renderThemeEmbellishment()}
    </svg>
  );
};

interface ThemedVignetteDividerProps {
  variant?: CameraIconVariant;
  label?: string;
  preset?: ThemePresetId;
  className?: string;
}

/**
 * Editorial hairline divider anchored by a theme-adaptive camera/shutter vignette.
 */
export const ThemedVignetteDivider: React.FC<ThemedVignetteDividerProps> = ({
  variant = 'shutter',
  label,
  preset,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden={!label}>
      <span className="h-px flex-1 max-w-[140px] bg-white/10" />
      <div className="inline-flex items-center gap-2 text-amber-400">
        <ThemedCameraIcon variant={variant} preset={preset} size={22} />
        {label && (
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-400">
            {label}
          </span>
        )}
      </div>
      <span className="h-px flex-1 max-w-[140px] bg-white/10" />
    </div>
  );
};
