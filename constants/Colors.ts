// Peel brand colors — clean, modern, health-focused
export const brand = {
  primary: '#16A34A',      // Green — main CTA, scan button
  primaryDark: '#15803D',  // Darker green for pressed states
  primaryLight: '#DCFCE7', // Light green backgrounds
  danger: '#EF4444',       // Red — avoid items, alerts
  dangerLight: '#FEE2E2',  // Light red background
  warning: '#F59E0B',      // Amber — limit items
  warningLight: '#FEF3C7', // Light amber background
  good: '#22C55E',         // Green — good items
  goodLight: '#DCFCE7',    // Light green background
  excellent: '#16A34A',    // Deep green — excellent items
  score: {
    excellent: '#16A34A',  // 80-100
    good: '#22C55E',       // 60-79
    limit: '#F59E0B',      // 30-59
    avoid: '#EF4444',      // 0-29
  },
};

const tintColorLight = brand.primary;
const tintColorDark = '#fff';

export default {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    backgroundSecondary: '#1F2937',
    card: '#1F2937',
    border: '#374151',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
  },
};
