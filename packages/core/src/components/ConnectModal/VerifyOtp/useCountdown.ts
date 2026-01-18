import { useState, useEffect } from 'react';

interface UseCountdownReturn {
  countdown: number;
  canResend: boolean;
  startCountdown: (seconds: number) => void;
}

export const useCountdown = (): UseCountdownReturn => {
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const startCountdown = (seconds: number) => {
    setCanResend(false);
    setCountdown(seconds);
  };

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      const newCountdown = countdown - 1;
      setCountdown(newCountdown);
      if (newCountdown === 0) {
        setCanResend(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return { countdown, canResend, startCountdown };
};
