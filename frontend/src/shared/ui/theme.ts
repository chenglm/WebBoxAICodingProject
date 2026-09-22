import type { ThemeConfig } from 'antd';

/**
 * Central Ant Design theme for WeBox. All brand-level overrides live here so
 * feature code never hardcodes colors.
 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#c84b31',
    colorInfo: '#c84b31',
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBorderRadius: 8,
    },
  },
};
