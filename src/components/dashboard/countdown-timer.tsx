'use client';

import { useState, useEffect } from 'react';
import { intervalToDuration, formatDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CountdownTimerProps = {
  targetDate: string;
  onLockUpdate: (isLocked: boolean) => void;
};

export function CountdownTimer({ targetDate, onLockUpdate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(targetDate);
      const difference = end.getTime() - now.getTime();
      const oneHour = 60 * 60 * 1000;

      if (difference <= 0) {
        setTimeLeft('Tempo esgotado');
        onLockUpdate(true);
        return;
      }
      
      if (difference < oneHour) {
         onLockUpdate(true);
      }

      const duration = intervalToDuration({ start: now, end });
      const formatted = formatDuration(duration, {
        format: ['days', 'hours', 'minutes', 'seconds'],
        locale: ptBR,
        zero: false,
      });

      setTimeLeft(`Fecha em: ${formatted}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onLockUpdate]);

  return <span>{timeLeft}</span>;
}
