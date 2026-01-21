/* eslint-disable no-console */

import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

import { Button, Text, Spinner, Divider, RecentBadge, CopyButton } from '@src/ui';
import { getBorderRadiusScale } from '@src/constants/theme';
import { AurumLogo, WalletLogo } from '@aurum-sdk/logos/react';
import { LogoVariant } from '@aurum-sdk/logos';
import { WalletId, BorderRadiusToken } from '@aurum-sdk/types';
import '@src/ui/globals.css';

type Theme = 'light' | 'dark';

const WALLET_IDS: { value: WalletId; label: string }[] = [
  { value: WalletId.MetaMask, label: 'MetaMask' },
  { value: WalletId.CoinbaseWallet, label: 'Coinbase Wallet' },
  { value: WalletId.Phantom, label: 'Phantom' },
  { value: WalletId.WalletConnect, label: 'WalletConnect' },
  { value: WalletId.Rabby, label: 'Rabby' },
  { value: WalletId.AppKit, label: 'AppKit (Reown)' },
  { value: WalletId.Ledger, label: 'Ledger' },
  { value: WalletId.Brave, label: 'Brave' },
];

const LOGO_VARIANTS: LogoVariant[] = ['icon', 'brand', 'black', 'white'];

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="playground-section">
      <h2 className="playground-section-title">{title}</h2>
      <div className="playground-section-content">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="playground-row">
      <span className="playground-row-label">{label}</span>
      <div className="playground-row-content">{children}</div>
    </div>
  );
}

interface ColorSwatchProps {
  variable: string;
  label?: string;
}

function ColorSwatch({ variable, label }: ColorSwatchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '0.5rem',
          background: `var(${variable})`,
          border: '1px solid var(--color-border)',
        }}
      />
      <span style={{ fontSize: '0.625rem', opacity: 0.7, textAlign: 'center', maxWidth: '5rem' }}>
        {label || variable.replace('--color-', '')}
      </span>
    </div>
  );
}

const COLOR_GROUPS = [
  {
    title: 'Primary (Brand)',
    colors: [
      { variable: '--color-primary', label: 'primary' },
      { variable: '--color-primary-foreground', label: 'foreground' },
      { variable: '--color-primary-hover', label: 'hover' },
      { variable: '--color-primary-muted', label: 'muted' },
    ],
  },
  {
    title: 'Card',
    colors: [{ variable: '--color-card', label: 'card' }],
  },
  {
    title: 'Foreground',
    colors: [
      { variable: '--color-foreground', label: 'foreground' },
      { variable: '--color-foreground-muted', label: 'muted' },
      { variable: '--color-foreground-subtle', label: 'subtle' },
    ],
  },
  {
    title: 'Border',
    colors: [
      { variable: '--color-border', label: 'border' },
      { variable: '--color-border-muted', label: 'muted' },
      { variable: '--color-border-focus', label: 'focus' },
    ],
  },
  {
    title: 'Accent',
    colors: [
      { variable: '--color-accent', label: 'accent' },
      { variable: '--color-accent-foreground', label: 'foreground' },
      { variable: '--color-accent-hover', label: 'hover' },
    ],
  },
  {
    title: 'Semantic',
    colors: [
      { variable: '--color-success', label: 'success' },
      { variable: '--color-error', label: 'error' },
    ],
  },
  {
    title: 'Other',
    colors: [
      { variable: '--color-overlay', label: 'overlay' },
      { variable: '--color-ring', label: 'ring' },
    ],
  },
];

export function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [brandColor, setBrandColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState<BorderRadiusToken>('md');
  const [selectedLogoVariant, setSelectedLogoVariant] = useState<LogoVariant>('icon');

  const handleThemeChange = (newTheme: Theme) => {
    // Auto-flip brand color if it's black/white
    if (newTheme === 'dark' && brandColor.toLowerCase() === '#000000') {
      setBrandColor('#ffffff');
    } else if (newTheme === 'light' && brandColor.toLowerCase() === '#ffffff') {
      setBrandColor('#000000');
    }
    setTheme(newTheme);
  };

  const handleReset = () => {
    setTheme('dark');
    setBrandColor('#ffffff');
    setBorderRadius('md');
  };

  const radiusScale = getBorderRadiusScale(borderRadius);

  const bgColor = theme === 'dark' ? '#09090b' : '#f4f4f5';
  const textColor = theme === 'dark' ? '#fafafa' : '#09090b';
  const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bgColor,
        color: textColor,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: bgColor,
          zIndex: 100,
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Aurum Component Library</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Brand:</span>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                border: `1px solid ${borderColor}`,
                borderRadius: '0.375rem',
                background: theme === 'dark' ? '#18181b' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '0 0.0625rem',
                  border: 'none',
                  borderRadius: '0.1875rem',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Radius:</span>
            <select
              id="radius-select"
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value as BorderRadiusToken)}
              style={{
                padding: '0.375rem 1.75rem 0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${borderColor}`,
                backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                color: textColor,
                cursor: 'pointer',
              }}
            >
              <option value="none">none</option>
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
              <option value="xl">xl</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Theme:</span>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
              style={{
                padding: '0.375rem 1.75rem 0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${borderColor}`,
                backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                color: textColor,
                cursor: 'pointer',
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: `1px solid ${borderColor}`,
              background: theme === 'dark' ? '#18181b' : '#fff',
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reset to defaults"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '75rem', margin: '0 auto' }}>
        {/* Components rendered inside theme wrapper */}
        <div className="aurum-sdk" data-theme={theme}>
          <style>{`
            .aurum-sdk {
              --aurum-primary-color: ${brandColor};
              --aurum-border-radius-xs: ${radiusScale.xs}px;
              --aurum-border-radius-sm: ${radiusScale.sm}px;
              --aurum-border-radius-md: ${radiusScale.md}px;
              --aurum-border-radius-lg: ${radiusScale.lg}px;
              --aurum-border-radius-xl: ${radiusScale.xl}px;
              --aurum-border-radius: ${radiusScale.md}px;
              --aurum-modal-z-index: 1000;
            }
            .playground-section {
              margin-bottom: 3rem;
              padding: 1.5rem;
              border-radius: 0.75rem;
              background: ${theme === 'dark' ? '#18181b' : '#fff'};
              border: 1px solid ${borderColor};
            }
            .playground-section-title {
              font-size: 1rem;
              font-weight: 600;
              margin-bottom: 1.25rem;
              padding-bottom: 0.75rem;
              border-bottom: 1px solid ${borderColor};
              color: ${textColor};
            }
            .playground-section-content {
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
            }
            .playground-row {
              display: flex;
              align-items: center;
              gap: 1rem;
            }
            .playground-row-label {
              font-size: 0.8125rem;
              font-weight: 500;
              color: ${theme === 'dark' ? '#a1a1aa' : '#71717a'};
              min-width: 6.25rem;
            }
            .playground-row-content {
              display: flex;
              gap: 0.5rem;
              align-items: center;
              flex-wrap: wrap;
              flex: 1;
            }
          `}</style>

          {/* Button Component */}
          <Section title="Button">
            <Row label="Variants">
              <Button variant="primary" onClick={() => console.log('Button clicked: variant primary')}>
                Primary
              </Button>
              <Button variant="secondary" onClick={() => console.log('Button clicked: variant secondary')}>
                Secondary
              </Button>
              <Button variant="tertiary" onClick={() => console.log('Button clicked: variant tertiary')}>
                Tertiary
              </Button>
              <Button variant="text" onClick={() => console.log('Button clicked: variant text')}>
                Text
              </Button>
              <Button variant="close" onClick={() => console.log('Button clicked: variant close')}>
                <X size={18} />
              </Button>
            </Row>
            <Row label="Sizes">
              <Button size="xs" onClick={() => console.log('Button clicked: size xs')}>
                Extra Small
              </Button>
              <Button size="sm" onClick={() => console.log('Button clicked: size sm')}>
                Small
              </Button>
              <Button size="md" onClick={() => console.log('Button clicked: size md')}>
                Medium
              </Button>
              <Button size="lg" onClick={() => console.log('Button clicked: size lg')}>
                Large
              </Button>
            </Row>
            <Row label="States">
              <Button loading onClick={() => console.log('Button clicked: state loading')}>
                Loading
              </Button>
              <Button disabled onClick={() => console.log('Button clicked: state disabled')}>
                Disabled
              </Button>
            </Row>
            <div className="playground-row">
              <span className="playground-row-label">Full Width</span>
              <div style={{ flex: 1, maxWidth: 300 }}>
                <Button expand onClick={() => console.log('Button clicked: expand true')}>
                  Expand Full Width
                </Button>
              </div>
            </div>
          </Section>

          {/* Text Component */}
          <Section title="Text">
            <Row label="Sizes">
              <Text size="xs">Extra Small</Text>
              <Text size="sm">Small</Text>
              <Text size="md">Medium</Text>
              <Text size="lg">Large</Text>
            </Row>
            <Row label="Variants">
              <Text variant="primary">Primary</Text>
              <Text variant="secondary">Secondary</Text>
              <Text variant="tertiary">Tertiary</Text>
              <Text variant="brand">Brand</Text>
              <Text variant="success">Success</Text>
              <Text variant="error">Error</Text>
            </Row>
            <Row label="Weights">
              <Text weight="normal">Normal</Text>
              <Text weight="semibold">Semibold</Text>
              <Text weight="bold">Bold</Text>
            </Row>
          </Section>

          {/* Spinner Component */}
          <Section title="Spinner">
            <Row label="Default">
              <Spinner size={20} />
            </Row>
          </Section>

          {/* Divider Component */}
          <Section title="Divider">
            <Row label="Default">
              <div style={{ width: '100%', maxWidth: 300 }}>
                <Divider />
              </div>
            </Row>
            <Row label="With Text">
              <div style={{ width: '100%', maxWidth: 300 }}>
                <Divider>or continue with</Divider>
              </div>
            </Row>
          </Section>

          {/* Badge Component */}
          <Section title="Badge">
            <Row label="Recent Badge">
              <RecentBadge />
            </Row>
          </Section>

          {/* CopyButton Component */}
          <Section title="CopyButton">
            <Row label="Icon Only">
              <CopyButton text="0x1234...5678" />
            </Row>
            <Row label="With Label">
              <CopyButton text="0x1234...5678" label="Copy Address" copiedLabel="Copied!" />
            </Row>
          </Section>

          {/* WalletLogo Component */}
          <Section title="WalletLogo">
            <Row label="Variant">
              <select
                value={selectedLogoVariant}
                onChange={(e) => setSelectedLogoVariant(e.target.value as LogoVariant)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: theme === 'dark' ? '#27272a' : '#fff',
                  color: textColor,
                  cursor: 'pointer',
                }}
              >
                {LOGO_VARIANTS.map((variant) => (
                  <option key={variant} value={variant}>
                    {variant.charAt(0).toUpperCase() + variant.slice(1)}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="All Wallets">
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: theme === 'dark' ? '#27272a' : '#f4f4f5',
                }}
              >
                {WALLET_IDS.map((wallet) => (
                  <WalletLogo
                    key={wallet.value}
                    id={wallet.value}
                    variant={selectedLogoVariant}
                    radius={borderRadius}
                    sizeSlot="lg"
                    size={64}
                  />
                ))}
              </div>
            </Row>
          </Section>

          {/* AurumLogo Component */}
          <Section title="AurumLogo">
            <Row label="All Variants">
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: theme === 'dark' ? '#27272a' : '#f4f4f5',
                }}
              >
                {LOGO_VARIANTS.map((variant) => (
                  <AurumLogo key={variant} variant={variant} radius={borderRadius} sizeSlot="lg" size={64} />
                ))}
              </div>
            </Row>
          </Section>

          {/* Color Variables */}
          <Section title="Color Variables">
            {COLOR_GROUPS.map((group) => (
              <Row key={group.title} label={group.title}>
                {group.colors.map((color) => (
                  <ColorSwatch key={color.variable} variable={color.variable} label={color.label} />
                ))}
              </Row>
            ))}
          </Section>
        </div>
      </main>
    </div>
  );
}
