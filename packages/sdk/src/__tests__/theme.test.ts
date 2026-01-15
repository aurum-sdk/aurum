import { describe, it, expect } from 'vitest';
import { getBorderRadiusScale, getBorderRadius, getDefaultThemeConfig } from '@src/constants/theme';

describe('getBorderRadiusScale', () => {
  it('returns correct scale for "none" token', () => {
    const scale = getBorderRadiusScale('none');
    expect(scale).toEqual({ xs: 0, sm: 0, md: 0, lg: 0, xl: 0 });
  });

  it('returns correct scale for "md" token', () => {
    const scale = getBorderRadiusScale('md');
    expect(scale).toEqual({ xs: 6, sm: 10, md: 14, lg: 18, xl: 22 });
  });

  it('returns correct scale for "xl" token', () => {
    const scale = getBorderRadiusScale('xl');
    expect(scale).toEqual({ xs: 10, sm: 18, md: 26, lg: 34, xl: 42 });
  });
});

describe('getBorderRadius', () => {
  it('returns correct pixel value for token and slot', () => {
    expect(getBorderRadius('none', 'md')).toBe(0);
    expect(getBorderRadius('sm', 'sm')).toBe(6);
    expect(getBorderRadius('md', 'md')).toBe(14);
    expect(getBorderRadius('lg', 'lg')).toBe(26);
    expect(getBorderRadius('xl', 'xl')).toBe(42);
  });

  it('returns consistent values with getBorderRadiusScale', () => {
    const tokens = ['none', 'sm', 'md', 'lg', 'xl'] as const;
    const slots = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    tokens.forEach((token) => {
      const scale = getBorderRadiusScale(token);
      slots.forEach((slot) => {
        expect(getBorderRadius(token, slot)).toBe(scale[slot]);
      });
    });
  });
});

describe('getDefaultThemeConfig', () => {
  it('returns dark theme config for "dark"', () => {
    const config = getDefaultThemeConfig('dark');
    expect(config.theme).toBe('dark');
    expect(config.primaryColor).toBe('#ffffff');
    expect(config.borderRadius).toBe('md');
    expect(config.modalZIndex).toBe(1000);
    expect(config.appName).toBe('Aurum');
    expect(config.hideFooter).toBe(false);
  });

  it('returns light theme config for "light"', () => {
    const config = getDefaultThemeConfig('light');
    expect(config.theme).toBe('light');
    expect(config.primaryColor).toBe('#000000');
    expect(config.borderRadius).toBe('md');
    expect(config.modalZIndex).toBe(1000);
    expect(config.appName).toBe('Aurum');
    expect(config.hideFooter).toBe(false);
  });
});
