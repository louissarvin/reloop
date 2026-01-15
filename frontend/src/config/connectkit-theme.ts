import type { Types } from "connectkit";

type CustomTheme = Types.CustomTheme;

// ReLoop brand colors
const colors = {
  primary: "#0F0F0F",
  secondary: "#232D3F",
  accent: "#005B41",
  highlight: "#008170",
  background: "#F5F5F7",
  surface: "#FFFFFF",
  muted: "#9CA3AF",
  border: "#E5E7EB",
};

export const reloopTheme: CustomTheme = {
  // General
  "--ck-font-family": "Inter, sans-serif",
  "--ck-border-radius": "12px",

  // Overlay
  "--ck-overlay-background": "rgba(15, 15, 15, 0.85)",
  "--ck-overlay-backdrop-filter": "blur(8px)",

  // Modal
  "--ck-modal-box-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  "--ck-body-background": colors.surface,
  "--ck-body-background-secondary": colors.background,
  "--ck-body-background-tertiary": colors.border,

  // Text
  "--ck-body-color": colors.primary,
  "--ck-body-color-muted": colors.muted,
  "--ck-body-color-muted-hover": colors.secondary,

  // Primary Button (Connect, Confirm actions)
  "--ck-primary-button-background": colors.primary,
  "--ck-primary-button-color": "#FFFFFF",
  "--ck-primary-button-border-radius": "9999px",
  "--ck-primary-button-hover-background": colors.secondary,
  "--ck-primary-button-active-background": colors.secondary,

  // Secondary Button (Back, Cancel)
  "--ck-secondary-button-background": colors.background,
  "--ck-secondary-button-color": colors.primary,
  "--ck-secondary-button-border-radius": "9999px",
  "--ck-secondary-button-hover-background": colors.border,

  // Tertiary Button
  "--ck-tertiary-button-background": colors.surface,
  "--ck-tertiary-button-color": colors.primary,
  "--ck-tertiary-button-hover-background": colors.background,

  // Accent color (focus rings, links, highlights)
  "--ck-accent-color": colors.highlight,
  "--ck-accent-text-color": "#FFFFFF",

  // Focus
  "--ck-focus-color": colors.highlight,

  // Wallet connector buttons
  "--ck-connectbutton-font-size": "14px",
  "--ck-connectbutton-font-weight": "600",
  "--ck-connectbutton-border-radius": "9999px",
  "--ck-connectbutton-color": colors.primary,
  "--ck-connectbutton-background": colors.surface,
  "--ck-connectbutton-box-shadow": `0 0 0 1px ${colors.border}`,
  "--ck-connectbutton-hover-background": colors.background,
  "--ck-connectbutton-hover-box-shadow": `0 0 0 1px ${colors.muted}`,
  "--ck-connectbutton-active-background": colors.background,

  // Connected button
  "--ck-connectbutton-balance-color": colors.primary,
  "--ck-connectbutton-balance-background": colors.background,
  "--ck-connectbutton-balance-box-shadow": "none",
  "--ck-connectbutton-balance-hover-background": colors.border,

  // Misc
  "--ck-spinner-color": colors.highlight,
  "--ck-qr-dot-color": colors.primary,
  "--ck-qr-background": colors.surface,
  "--ck-tooltip-background": colors.primary,
  "--ck-tooltip-color": "#FFFFFF",
  "--ck-tooltip-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",

  // Recent badge
  "--ck-recent-badge-color": colors.highlight,
  "--ck-recent-badge-background": `${colors.highlight}15`,
  "--ck-recent-badge-border-radius": "6px",
};

// Dark mode variant (for future use)
export const reloopDarkTheme: CustomTheme = {
  ...reloopTheme,
  "--ck-body-background": colors.primary,
  "--ck-body-background-secondary": colors.secondary,
  "--ck-body-background-tertiary": "#1a1a1a",
  "--ck-body-color": "#FFFFFF",
  "--ck-body-color-muted": colors.muted,
  "--ck-secondary-button-background": colors.secondary,
  "--ck-secondary-button-color": "#FFFFFF",
  "--ck-tertiary-button-background": colors.secondary,
  "--ck-tertiary-button-color": "#FFFFFF",
  "--ck-connectbutton-color": "#FFFFFF",
  "--ck-connectbutton-background": colors.secondary,
  "--ck-connectbutton-box-shadow": `0 0 0 1px ${colors.secondary}`,
  "--ck-qr-background": colors.secondary,
};
