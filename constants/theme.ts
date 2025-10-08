import { Platform } from 'react-native';

const tintColorLight = '#6C63FF';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    primary: '#6C63FF',
    accent: '#28A745',
    text: '#2D3748',
    textSecondary: '#4A5568',
    background: '#F7F8FC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    tint: tintColorLight,
    icon: '#4A5568',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorLight,
    destructive: '#E53E3E',
    gradientStart: '#6C63FF',
    gradientEnd: '#483DFF',
  },
  dark: {
    primary: '#6C63FF',
    accent: '#28A745',
    text: '#F7F8FC',
    textSecondary: '#A0AEC0',
    background: '#1A202C',
    card: '#2D3748',
    border: '#4A5568',
    tint: tintColorDark,
    icon: '#A0AEC0',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorDark,
    destructive: '#E53E3E',
    gradientStart: '#6C63FF',
    gradientEnd: '#483DFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const FontSizes = {
  title: 24,
  subtitle: 20,
  body: 16,
  caption: 12,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};
