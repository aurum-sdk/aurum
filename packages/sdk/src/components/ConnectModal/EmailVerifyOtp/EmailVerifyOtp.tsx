import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useEmailAuth } from '@src/contexts/EmailAuthContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { Button, Column, Row, Text, Spinner } from '@src/ui';
import { X, ChevronLeft, Check, CircleCheck } from 'lucide-react';
import { OTP_LENGTH, RESEND_COUNTDOWN_SECONDS } from '@src/components/ConnectModal/EmailVerifyOtp/constants';
import { getOtpInputStyles, emailHighlightStyles } from '@src/components/ConnectModal/EmailVerifyOtp/styles';
import { useCountdown } from '@src/components/ConnectModal/EmailVerifyOtp/useCountdown';
import { useOtpInputs } from '@src/components/ConnectModal/EmailVerifyOtp/useOtpInputs';

export const EmailVerifyOTP = () => {
  const { onDismiss } = useWidgetContext();
  const { goBackToHome } = useConnectModal();
  const { emailAuthState, sendEmailOTP, verifyEmailOTPAndConnect, error, clearError } = useEmailAuth();

  const isVerifying = emailAuthState.step === 'connecting' && !error;

  const { otp, setOtp, focusedIndex, setFocusedIndex, inputRefs, handleInputChange, handleKeyDown, handlePaste } =
    useOtpInputs({
      emailAuthState,
      error,
      clearError,
      onComplete: verifyEmailOTPAndConnect,
      isVerifying,
    });
  const { canResend, startCountdown } = useCountdown();

  const isSuccess = emailAuthState.step === 'success';
  const showOtpInputs = !isVerifying && !isSuccess;
  const canResendOtp = canResend && emailAuthState.step !== 'success';

  const handleBackToHome = () => {
    if (emailAuthState.step !== 'otp') return;
    clearError();
    goBackToHome();
  };

  const handleResendOTP = async () => {
    if (!canResendOtp) return;

    if (error) clearError();

    startCountdown(RESEND_COUNTDOWN_SECONDS);
    await sendEmailOTP(emailAuthState.email);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <div>
      <ModalHeader
        leftAction={
          isSuccess ? null : (
            <Button size="sm" variant="close" onClick={handleBackToHome} aria-label="Go back">
              <ChevronLeft size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
        rightAction={
          isSuccess ? null : (
            <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
              <X size={20} color="var(--color-foreground-muted)" />
            </Button>
          )
        }
        title="Verify Email"
      />
      <Column gap={24}>
        <Text align="center" variant="secondary">
          Enter the 6-digit code sent to
          <br /> <span style={emailHighlightStyles}>{emailAuthState.email}</span>
        </Text>
        <Column align="center" gap={12}>
          <div style={{ position: 'relative', height: '3rem' }}>
            {/* Keep inputs mounted but hidden during verification/success to preserve keyboard */}
            <Row
              justify="center"
              gap={8}
              style={{
                opacity: showOtpInputs ? 1 : 0,
                pointerEvents: showOtpInputs ? 'auto' : 'none',
                position: 'relative',
              }}
            >
              {otp.map((digit, index) => (
                <input
                  aria-label="OTP input"
                  id={`otp-input-${index}`}
                  type="text"
                  key={index}
                  autoFocus={index === 0}
                  maxLength={1}
                  value={digit}
                  inputMode="numeric"
                  onPaste={handlePaste}
                  onBlur={() => setFocusedIndex(null)}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={getOtpInputStyles(focusedIndex === index, !!error, !showOtpInputs)}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                />
              ))}
            </Row>
            {/* Overlay spinner/success on top of hidden inputs */}
            {!showOtpInputs && (
              <Column align="center" justify="center" style={{ position: 'absolute', inset: 0 }}>
                {isVerifying ? (
                  <Spinner size={32} color="var(--aurum-primary-color)" />
                ) : isSuccess ? (
                  <CircleCheck size={46} color="var(--aurum-primary-color)" />
                ) : null}
              </Column>
            )}
          </div>
          <Text
            align="center"
            variant="error"
            size="sm"
            style={{ visibility: error ? 'visible' : 'hidden', height: '1rem', display: isSuccess ? 'none' : 'block' }}
          >
            {error}
          </Text>
        </Column>
        {!isSuccess && (
          <Column align="center" justify="center">
            <Row align="center" justify="center" style={{ minHeight: '2rem' }}>
              {canResend ? (
                <Row align="baseline" gap={2}>
                  <Text size="sm" variant="secondary">
                    Didn't receive the code?
                  </Text>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={handleResendOTP}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={!canResendOtp}
                  >
                    Resend
                  </Button>
                </Row>
              ) : (
                <Row align="center" gap={4}>
                  <Text size="sm" variant="secondary">
                    Email re-sent
                  </Text>
                  <Check size={14} color="var(--color-foreground-muted)" />
                </Row>
              )}
            </Row>
          </Column>
        )}
      </Column>
    </div>
  );
};
