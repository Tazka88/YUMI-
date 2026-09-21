import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'sm',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return { bg: COLORS.dangerLight, text: COLORS.danger };
      case 'success':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'neutral':
        return { bg: COLORS.borderLight, text: COLORS.textSecondary };
      case 'primary':
      default:
        return { bg: COLORS.primaryLight, text: COLORS.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }, size === 'sm' ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: text }, size === 'sm' ? styles.textSm : styles.textMd]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sm: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
