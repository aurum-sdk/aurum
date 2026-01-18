import { useState, useRef, useEffect } from 'react';
import { OTP_LENGTH } from '@src/components/ConnectModal/VerifyOtp/constants';
import { EmbeddedAuthState } from '@src/contexts/EmbeddedAuthContext';

interface UseOtpInputsParams {
  authState: EmbeddedAuthState;
  error: string;
  clearError: () => void;
  onComplete: (otpString: string) => void;
  isVerifying: boolean;
}

interface UseOtpInputsReturn {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  focusedIndex: number | null;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleInputChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
}

export const useOtpInputs = ({
  authState,
  error,
  clearError,
  onComplete,
  isVerifying,
}: UseOtpInputsParams): UseOtpInputsReturn => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleInputChange = (index: number, value: string) => {
    if (error) clearError();

    if (authState.step === 'connecting' || !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Move to next input, but don't blur on last digit to keep keyboard open if user is on mobile
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    if (error) clearError();

    if (authState.step === 'connecting' || !/^\d*$/.test(e.clipboardData.getData('text'))) return;

    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH)
      .fill('')
      .map((_, i) => pastedData[i] || '');

    setOtp(newOtp);

    // Focus next empty input, or stay on last input to keep keyboard open if user is on mobile
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    }
  };

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (isOtpComplete && otp.join('').length === OTP_LENGTH) {
      onComplete(otp.join(''));
    }
  }, [otp]);

  // Focus first input immediately on mount to trigger keyboard on mobile
  useEffect(() => {
    // Try immediate focus first
    inputRefs.current[0]?.focus();
    // Fallback after focus trap settles (for desktop/non-gesture scenarios)
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Clear OTP inputs and focus first input when error occurs
  useEffect(() => {
    if (error) {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error]);

  // Reset focusedIndex when verifying
  useEffect(() => {
    if (isVerifying) {
      setFocusedIndex(0);
    }
  }, [isVerifying]);

  return {
    otp,
    setOtp,
    focusedIndex,
    setFocusedIndex,
    inputRefs,
    handleInputChange,
    handleKeyDown,
    handlePaste,
  };
};
