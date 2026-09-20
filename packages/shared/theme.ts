/**
 * Tema rosa feminino — MIF BRECHO
 */

export const colors = {
  primary: "#E91E63",
  primaryLight: "#F8BBD9",
  primaryDark: "#C2185B",
  secondary: "#FCE4EC",
  accent: "#FF80AB",
  background: "#FFF5F8",
  surface: "#FFFFFF",
  text: "#4A148C",
  textMuted: "#7B1FA2",
  textLight: "#FFFFFF",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  border: "#F8BBD9",
  muted: "#FCE4EC",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fonts = {
  heading: "Poppins, system-ui, sans-serif",
  body: "Nunito, system-ui, sans-serif",
} as const;

export type ThemeColors = typeof colors;
