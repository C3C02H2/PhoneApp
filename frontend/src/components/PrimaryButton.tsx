/**
 * PrimaryButton - Основен бутон с premium feel
 *
 * Variants: primary | secondary | ghost | success | danger
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.base,
      ...sizeStyles[size],
      opacity: isDisabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.accent.main };
      case 'secondary':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border.medium,
        };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'success':
        return { ...base, backgroundColor: colors.success.main };
      case 'danger':
        return { ...base, backgroundColor: colors.error.main };
      default:
        return { ...base, backgroundColor: colors.accent.main };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      ...typography.button,
      color: colors.primary.main,
    };

    if (variant === 'secondary' || variant === 'ghost') {
      base.color = colors.primary.muted;
    }
    if (size === 'small') {
      Object.assign(base, typography.buttonSmall);
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary.main} size="small" />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  small: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing.xl,
  },
  large: {
    height: 56,
    paddingHorizontal: spacing.xxl,
  },
};

