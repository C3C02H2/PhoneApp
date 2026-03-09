/**
 * Design System: Spacing
 *
 * 4px base unit system
 * Много whitespace за calm, minimalist interface
 */

export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  huge: 40,
  /** 48px */
  massive: 48,
  /** 64px */
  giant: 64,
  /** 80px */
  colossal: 80,
} as const;

export const borderRadius = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** Full round */
  full: 9999,
} as const;

export const screenPadding = {
  horizontal: spacing.xl,
  vertical: spacing.lg,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;

