/**
 * Formats an E.164 phone number for display.
 * e.g., "+14155551234" -> "+1 (415) 555-1234"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || !phone.startsWith('+')) return phone;

  // Remove + and get digits only
  const digits = phone.slice(1).replace(/\D/g, '');

  // Handle US/Canada numbers (country code 1)
  if (digits.startsWith('1') && digits.length === 11) {
    const country = digits.slice(0, 1);
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `+${country} (${area}) ${prefix}-${line}`;
  }

  // For other countries, just add spaces for readability
  // Format: +XX XXX XXX XXXX (varies by country)
  if (digits.length >= 10) {
    const countryCode = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
    const rest = digits.slice(-10);
    const part1 = rest.slice(0, 3);
    const part2 = rest.slice(3, 6);
    const part3 = rest.slice(6);
    return countryCode ? `+${countryCode} ${part1} ${part2} ${part3}` : `+${part1} ${part2} ${part3}`;
  }

  // Fallback: just return the original phone
  return phone;
}
