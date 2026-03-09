/**
 * Design System: Central Export
 *
 * "Do You Try?" App
 * Modern Minimalist Dark Theme
 *
 * Design principles:
 * - Minimalism: Всеки елемент трябва да има цел
 * - Whitespace: Много пространство за дишане
 * - Focus: Един action per screen
 * - Calm: Меки цветове, без агресивни контрасти
 *
 * Инспириран от: Notion, Linear, Apple Human Interface
 */

export { colors } from './colors';
export { typography, fontFamily } from './typography';
export { spacing, borderRadius, screenPadding } from './spacing';

// Shadows за elevated елементи
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

// Animation timings
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

