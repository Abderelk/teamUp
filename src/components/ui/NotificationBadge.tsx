import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  size = 'medium',
  color = '#FF3B30'
}) => {
  if (count <= 0) return null;

  const sizeStyles = {
    small: {
      minWidth: 16,
      height: 16,
      fontSize: 10,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      fontSize: 12,
      paddingHorizontal: 6,
    },
    large: {
      minWidth: 24,
      height: 24,
      fontSize: 14,
      paddingHorizontal: 8,
    }
  };

  const currentSizeStyle = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: color,
        minWidth: currentSizeStyle.minWidth,
        height: currentSizeStyle.height,
        paddingHorizontal: currentSizeStyle.paddingHorizontal,
      }
    ]}>
      <Text style={[
        styles.badgeText,
        { fontSize: currentSizeStyle.fontSize }
      ]}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});