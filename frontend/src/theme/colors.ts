/**
 * Design System: Colors
 *
 * Стил: Modern minimalist dark theme
 * Инспирация: Notion, Linear, Apple Human Interface
 * Адаптиран за мотивационно приложение
 */

export const colors = {
  // === Background ===
  background: {
    primary: '#0A0A0F',      // Основен фон - дълбоко тъмно
    secondary: '#12121A',     // Вторичен фон - карти, секции
    tertiary: '#1A1A25',      // Третичен фон - hover, elevated
    elevated: '#22222F',      // Издигнат елемент
  },

  // === Primary ===
  primary: {
    main: '#FFFFFF',          // Основен текст - чист бял
    light: '#F5F5F7',         // Лек вариант
    muted: '#A0A0B0',         // Заглушен текст
    disabled: '#555566',      // Disabled текст
  },

  // === Accent ===
  accent: {
    main: '#6C63FF',          // Основен акцент - soft indigo/violet
    light: '#8B83FF',         // Светъл акцент
    dark: '#5046E4',          // Тъмен акцент
    glow: 'rgba(108, 99, 255, 0.15)', // Glow ефект
  },

  // === Success (за streak, positive check-in) ===
  success: {
    main: '#34D399',          // Зелен за success
    light: '#6EE7B7',         // Светъл success
    dark: '#059669',          // Тъмен success
    glow: 'rgba(52, 211, 153, 0.15)',
  },

  // === Error ===
  error: {
    main: '#F87171',          // Червен за error
    light: '#FCA5A5',         // Светъл error
    dark: '#DC2626',          // Тъмен error
    glow: 'rgba(248, 113, 113, 0.15)',
  },

  // === Warning ===
  warning: {
    main: '#FBBF24',          // Жълт за warning
    light: '#FDE68A',
    dark: '#D97706',
  },

  // === Borders & Dividers ===
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',   // Много фин бордер
    light: 'rgba(255, 255, 255, 0.10)',     // Лек бордер
    medium: 'rgba(255, 255, 255, 0.15)',    // Среден бордер
  },

  // === Overlay ===
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type Colors = typeof colors;

