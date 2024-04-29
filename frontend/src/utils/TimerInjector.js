import { useState, useEffect } from 'react';
export const TimerInjector = ({ children }) => {
  // Timing
  const [timeLeftInDay, setTimeLeftInDay] = useState('');
  const startTime = '15:00';
  const [hours, minutes] = startTime.split(':');
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextDayStart = new Date(now);
      nextDayStart.setDate(now.getDate() + 1);
      nextDayStart.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

      const difference = nextDayStart - now;
      const hoursFinal = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesFinal = Math.floor((difference / 1000 / 60) % 60);
      const secondsFinal = Math.floor((difference / 1000) % 60);

      const formattedTimeLeft = `${hoursFinal.toString().padStart(2, '0')}:${minutesFinal.toString().padStart(2, '0')}:${secondsFinal.toString().padStart(2, '0')}`;
      setTimeLeftInDay(formattedTimeLeft);
    };

    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  return children({ timeLeftInDay });
};
