/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f1720',
    background: '#fffefc',
    tint: '#ff7a59',
    icon: '#5b6b6b',
    tabIconDefault: '#8b9aa0',
    tabIconSelected: '#ff7a59',
    // new palette
    primary: '#ff7a59', // warm coral
    secondary: '#4ecdc4', // teal
    accent: '#556270',
    success: '#2ecc71',
    danger: '#e74c3c',
    buttonText: '#ffffff',
    surface: '#ffffff',
  },
  dark: {
    text: '#F5F7F6',
    background: '#0f1720',
    tint: '#ff9b7a',
    icon: '#9ba1a6',
    tabIconDefault: '#9ba1a6',
    tabIconSelected: '#ff9b7a',
    // new palette (dark variants)
    primary: '#ff9b7a',
    secondary: '#6fe8df',
    accent: '#98a8ad',
    success: '#35c56a',
    danger: '#ff6b6b',
    buttonText: '#0f1720',
    surface: '#121619',
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

