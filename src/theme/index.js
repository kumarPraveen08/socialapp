import {MD3LightTheme as DefaultTheme} from 'react-native-paper';

export const colors = {
  primary: '#FF3B7F',
  secondary: '#6C63FF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  error: '#FF4949',
  text: '#1A1A1A',
  subtext: '#666666',
  border: '#E5E5E5',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  disabled: '#9E9E9E',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(0, 0, 0, 0.1)',
  // Chat colors
  outgoingMessage: '#FF3B7F',
  incomingMessage: '#F0F0F0',
  // Call colors
  callBackground: '#1A1A1A',
  callControls: '#FFFFFF',
  // Gift colors
  giftPrimary: '#FF3B7F',
  giftSecondary: '#6C63FF',
  // Status colors
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#FF4949',
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.text,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: colors.backdrop,
  },
  roundness: 10,
  animation: {
    scale: 1.0,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  headingLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
  },
  headingMedium: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  headingSmall: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 7.84,
    elevation: 8,
  },
};

export default {
  colors,
  theme,
  spacing,
  typography,
  shadows,
};
