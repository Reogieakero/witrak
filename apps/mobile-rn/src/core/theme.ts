export const FhusoColors = {
  brand: '#3B82F6',
  brandHover: '#2563EB',

  bgLight: '#FFFFFF',
  surfaceLight: '#F6F8FA',
  borderLight: '#D0D7DE',
  inkLight: '#1F2328',
  mutedLight: '#59636E',
  canvasLight: '#F6F8FA',

  bgDark: '#09090B',
  surfaceDark: '#111113',
  borderDark: '#27272A',
  inkDark: '#E4E4E7',
  mutedDark: '#A1A1AA',
  canvasDark: '#111113',

  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
};

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  canvas: string;
  bg: string;
  surface: string;
  border: string;
  ink: string;
  muted: string;
  onSurfaceVariant: string;
}

export function resolveColors(mode: ThemeMode): ThemeColors {
  const dark = mode === 'dark';
  return {
    canvas: dark ? FhusoColors.canvasDark : FhusoColors.canvasLight,
    bg: dark ? FhusoColors.bgDark : FhusoColors.bgLight,
    surface: dark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight,
    border: dark ? FhusoColors.borderDark : FhusoColors.borderLight,
    ink: dark ? FhusoColors.inkDark : FhusoColors.inkLight,
    muted: dark ? FhusoColors.mutedDark : FhusoColors.mutedLight,
    onSurfaceVariant: dark ? FhusoColors.mutedDark : FhusoColors.mutedLight,
  };
}

export function alpha(hex: string, a: number): string {
  const n = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${n}`;
}

export const FhusoFonts = {
  regular: 'Nunito',
  medium: 'Nunito-Medium',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
};