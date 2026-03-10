/**
 * StatCard - Карта за статистика (streak, total checkins)
 *
 * Premium glassmorphism feel
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = colors.accent.main,
}) => {
  return (
    <View style={[styles.container, { borderColor: accentColor + '20' }]}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={[styles.value, { color: accentColor }]}>
        {value}
      </Text>

      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    ...typography.displayMedium,
    color: colors.accent.main,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary.muted,
    marginTop: spacing.xs,
  },
});

