export const colors = {
  edu: {
    pink: '#F087A9',
    pinkLight: '#F5A5C0',
    pinkDark: '#D96B91',
    blue: '#30BCE6',
    blueLight: '#5CCDF0',
    blueDark: '#1A9FCC',
    yellow: '#FDDB33',
    yellowLight: '#FDF293',
    yellowDark: '#E5C52E',
    red: '#E94930',
    redLight: '#F07060',
    redDark: '#C93A24',
  },
  surface: {
    0: '#FFFFFF',
    cream: '#FFF8E7',
    50: '#F8FAFE',
    100: '#F0F4FA',
    200: '#E4EAF4',
    300: '#CDD6E4',
    400: '#A0ADC4',
    500: '#6B7A94',
    600: '#4A5770',
    700: '#344054',
    800: '#1E2A3A',
    900: '#0F1923',
    950: '#080E15',
  },
  success: {
    light: '#D4EDDA',
    main: '#4CAF50',
    dark: '#388E3C',
  },
  warning: {
    light: '#FFF3CD',
    main: '#FDDB33',
    dark: '#E5C52E',
  },
} as const;

export type ColorKey = keyof typeof colors;
