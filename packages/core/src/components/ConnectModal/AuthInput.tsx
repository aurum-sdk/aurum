import { useEffect, useState, useRef } from 'react';
import { useEmbeddedAuth } from '@src/contexts/EmbeddedAuthContext';
import { Button, Row, Text } from '@src/ui';
import { ChevronRight, ChevronDown, Mail, Smartphone } from 'lucide-react';
import { FlagImage, defaultCountries, parseCountry, CountrySelectorDropdown } from 'react-international-phone';
import type { CountryIso2 } from 'react-international-phone';
import 'react-international-phone/style.css';
import './EmailAuth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164 format: + followed by 7-15 digits (minimum for valid phone)
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// Countries supported for SMS authentication (ISO 3166-1 alpha-2 codes, lowercase)
const SMS_SUPPORTED_COUNTRY_CODES: CountryIso2[] = [
  'au', // Australia
  'br', // Brazil
  'ca', // Canada
  'co', // Colombia
  'fr', // France
  'de', // Germany
  'in', // India
  'id', // Indonesia
  'it', // Italy
  'jp', // Japan
  'ke', // Kenya
  'mx', // Mexico
  'nl', // Netherlands
  'ph', // Philippines
  'pl', // Poland
  'sg', // Singapore
  'kr', // South Korea
  'es', // Spain
  'se', // Sweden
  'ch', // Switzerland
  'ae', // United Arab Emirates
  'gb', // United Kingdom
  'us', // United States
];

// Filter defaultCountries to only include SMS-supported countries
const SMS_SUPPORTED_COUNTRIES = defaultCountries.filter((country) => {
  const { iso2 } = parseCountry(country);
  return SMS_SUPPORTED_COUNTRY_CODES.includes(iso2);
});

export const AuthInput = () => {
  const { authState, error, sendEmailOTP, sendSmsOTP, clearError, setAuthMethod, hasEmailAuth, hasSmsAuth } =
    useEmbeddedAuth();

  // Determine the effective mode - if only one auth method is available, force that mode
  // This handles edge cases where state might be out of sync with available adapters
  const effectiveMode: 'email' | 'sms' = (() => {
    if (hasEmailAuth && !hasSmsAuth) return 'email';
    if (hasSmsAuth && !hasEmailAuth) return 'sms';
    return authState.authMethod;
  })();
  const isEmailMode = effectiveMode === 'email';

  const [email, setEmail] = useState(authState.email);
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryIso2>('us');
  const [isValidInput, setIsValidInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonFocused, setIsButtonFocused] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryButtonRef = useRef<HTMLButtonElement>(null);

  // Get country data for the selected country
  const countryData = SMS_SUPPORTED_COUNTRIES.find((c) => {
    const { iso2 } = parseCountry(c);
    return iso2 === selectedCountry;
  });
  const { dialCode } = countryData ? parseCountry(countryData) : { dialCode: '1' };

  // Build full E.164 phone number
  const fullPhoneNumber = localPhoneNumber ? `+${dialCode}${localPhoneNumber.replace(/\D/g, '')}` : '';

  const showPrimary = isValidInput && (isFocused || isButtonFocused);

  // Validate input based on mode
  useEffect(() => {
    if (isEmailMode) {
      setIsValidInput(EMAIL_REGEX.test(email));
    } else {
      // Check if local number has at least 4 digits and full number matches E.164
      const digitsOnly = localPhoneNumber.replace(/\D/g, '');
      setIsValidInput(digitsOnly.length >= 4 && PHONE_REGEX.test(fullPhoneNumber));
    }
  }, [email, localPhoneNumber, fullPhoneNumber, isEmailMode]);

  const handleSend = async () => {
    try {
      setIsLoading(true);
      if (isEmailMode) {
        await sendEmailOTP(email);
      } else {
        await sendSmsOTP(fullPhoneNumber);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (error) {
      clearError();
    }
    if (e.key === 'Enter' && isValidInput) {
      handleSend();
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const toggleMode = () => {
    if (error) clearError();
    setAuthMethod(isEmailMode ? 'sms' : 'email');
  };

  const getInputClassName = () => {
    const classes = ['email-auth-input'];
    if (error) classes.push('email-auth-input--error');
    return classes.join(' ');
  };

  // Show toggle only if both auth methods are available
  const showToggle = hasEmailAuth && hasSmsAuth;

  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        {isEmailMode ? (
          <>
            <div className="email-auth-icon">
              <Mail size={20} color="var(--color-foreground-muted)" />
            </div>
            <input
              aria-label="Email address"
              id="email-input"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Email address"
              value={email}
              className={getInputClassName()}
              disabled={isLoading}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onChange={handleEmailChange}
            />
          </>
        ) : (
          <div className="phone-input-wrapper">
            {/* Country selector button */}
            <button
              ref={countryButtonRef}
              type="button"
              className={`phone-country-button ${error ? 'phone-country-button--error' : ''}`}
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              disabled={isLoading}
            >
              <FlagImage iso2={selectedCountry} size={20} />
              <span className="phone-country-code">+{dialCode}</span>
              <ChevronDown size={14} color="var(--color-foreground-muted)" />
            </button>

            {/* Country dropdown */}
            {isCountryDropdownOpen && (
              <CountrySelectorDropdown
                show={isCountryDropdownOpen}
                countries={SMS_SUPPORTED_COUNTRIES}
                selectedCountry={selectedCountry}
                onSelect={(country) => {
                  setSelectedCountry(country.iso2);
                  setIsCountryDropdownOpen(false);
                }}
                onClose={() => setIsCountryDropdownOpen(false)}
                className="phone-country-dropdown"
                listItemClassName="phone-country-dropdown-item"
              />
            )}

            {/* Phone number input (local number only, no country code) */}
            <input
              aria-label="Phone number"
              id="phone-input"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="Phone number"
              value={localPhoneNumber}
              className={`phone-number-input ${error ? 'phone-number-input--error' : ''}`}
              disabled={isLoading}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                if (error) clearError();
                setLocalPhoneNumber(e.target.value);
              }}
            />
          </div>
        )}
        <Button
          size="sm"
          variant={showPrimary ? 'primary' : 'secondary'}
          loading={isLoading}
          onClick={handleSend}
          disabled={!isValidInput}
          className="email-auth-submit-button"
          onFocus={() => setIsButtonFocused(true)}
          onBlur={() => setIsButtonFocused(false)}
        >
          {!isLoading && (
            <ChevronRight
              size={16}
              color={showPrimary ? 'var(--color-primary-foreground)' : 'var(--color-foreground-subtle)'}
            />
          )}
        </Button>
      </div>

      {error && (
        <Text variant="error" size="sm" align="left" style={{ width: '100%', marginTop: '0.3125rem' }}>
          {error}
        </Text>
      )}

      {showToggle && (
        <Button
          variant="secondary"
          onClick={toggleMode}
          disabled={isLoading}
          expand
          style={{ marginTop: '0.75rem', borderRadius: 'var(--aurum-border-radius-md)' }}
        >
          <Row align="center" style={{ width: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0 }}>
              {isEmailMode ? (
                <Smartphone size={20} color="var(--color-foreground)" />
              ) : (
                <Mail size={20} color="var(--color-foreground)" />
              )}
            </div>
            <Text size="md" style={{ width: '100%', textAlign: 'center' }}>
              {isEmailMode ? 'Log in with SMS' : 'Log in with email'}
            </Text>
          </Row>
        </Button>
      )}
    </>
  );
};
