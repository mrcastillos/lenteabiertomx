import { SiteAppearanceConfig, ThemePresetId } from '../types';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  description: string;
  colors: SiteAppearanceConfig;
}

export const DEFAULT_APPEARANCE: SiteAppearanceConfig = {
  preset: 'default',
  backgroundColor: '#0c0d0e',
  surfaceColor: '#121316',
  textColor: '#e6e8eb',
  headingColor: '#ffffff',
  mutedTextColor: '#a1a1aa',
  accentColor: '#f59e0b',
};

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'default',
    name: 'Editorial Negro & Ámbar',
    description: 'Estética original nocturna de galería de autor con acentos dorados.',
    colors: DEFAULT_APPEARANCE,
  },
  {
    id: 'navidad',
    name: 'Navidad (Rojo & Dorado)',
    description: 'Fondo borgoña profundo con títulos cálidos dorados y botones en rojo festivo.',
    colors: {
      preset: 'navidad',
      backgroundColor: '#160709',
      surfaceColor: '#230b0f',
      textColor: '#fdf2f2',
      headingColor: '#fde68a',
      mutedTextColor: '#d8b4b8',
      accentColor: '#dc2626',
    },
  },
  {
    id: 'halloween',
    name: 'Halloween (Negro & Naranja)',
    description: 'Negro carbón nocturno combinado con naranja calabaza y tonos ámbar.',
    colors: {
      preset: 'halloween',
      backgroundColor: '#0b0807',
      surfaceColor: '#18110c',
      textColor: '#f5ebe0',
      headingColor: '#ffb703',
      mutedTextColor: '#bfa38a',
      accentColor: '#f97316',
    },
  },
  {
    id: 'san-valentin',
    name: 'San Valentín (Carmesí & Rosa)',
    description: 'Tonos románticos en vino oscuro, tipografía marfil rosado y acento carmesí.',
    colors: {
      preset: 'san-valentin',
      backgroundColor: '#14080e',
      surfaceColor: '#210d17',
      textColor: '#fdf2f8',
      headingColor: '#fbcfe8',
      mutedTextColor: '#c99cb2',
      accentColor: '#e11d48',
    },
  },
  {
    id: 'primavera',
    name: 'Primavera / Bosque (Esmeralda)',
    description: 'Verde bosque orgánico con tipografía clara botánica y detalles esmeralda.',
    colors: {
      preset: 'primavera',
      backgroundColor: '#06120d',
      surfaceColor: '#0c2017',
      textColor: '#ecfdf5',
      headingColor: '#a7f3d0',
      mutedTextColor: '#8bb8a4',
      accentColor: '#10b981',
    },
  },
  {
    id: 'minimal-claro',
    name: 'Blanco Editorial (Modo Claro)',
    description: 'Lienzo luminoso tipo papel de museo con tipografía oscura y acento bronce.',
    colors: {
      preset: 'minimal-claro',
      backgroundColor: '#f8f7f4',
      surfaceColor: '#ffffff',
      textColor: '#27272a',
      headingColor: '#09090b',
      mutedTextColor: '#52525b',
      accentColor: '#b45309',
    },
  },
];

function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#000000').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 12, g: 13, b: 14 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getColorLuminance(hex: string): number {
  const { r, g, b } = parseHexRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isLightColor(hex: string): boolean {
  return getColorLuminance(hex) > 155;
}

export function getReadableContrastColor(hex: string): '#000000' | '#ffffff' {
  return getColorLuminance(hex) > 150 ? '#000000' : '#ffffff';
}
