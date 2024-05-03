import { useState, useEffect } from 'react';
import { getTodaysStartTime } from '../services/apiService.js';

export const TimerInjector = ({ children }) => {
  // Timing
  const [startTimeApiState, setStartTimeApiState] = useState({
    loading: null,
    error: '',
    data: null
  });
  useEffect(() => {
    const fetchStartTime = async () => {
      try {
        setStartTimeApiState((prevState) => ({
          ...prevState,
          loading: true
        }));
        const result = await getTodaysStartTime();
        setStartTimeApiState((prevState) => ({
          ...prevState,
          data: result.data,
          loading: false
        }));
      } catch (error) {
        // Handle or log the error as needed
        setStartTimeApiState((prevState) => ({
          ...prevState,
          error,
          loading: false
        }));
        console.error('Error fetching start time:', error);
      }
    };
    fetchStartTime();
  }, []);

  const [timeLeftInDay, setTimeLeftInDay] = useState('');
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startTimeApiState.data) {
        return;
      }
      const now = new Date();
      const thisDayEnd = new Date(startTimeApiState.data);
      thisDayEnd.setHours(thisDayEnd.getHours() + 24);

      const difference = thisDayEnd - now;
      const hoursFinal = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesFinal = Math.floor((difference / 1000 / 60) % 60);
      const secondsFinal = Math.floor((difference / 1000) % 60);

      const formattedTimeLeft = `${hoursFinal.toString().padStart(2, '0')}:${minutesFinal.toString().padStart(2, '0')}:${secondsFinal.toString().padStart(2, '0')}`;
      setTimeLeftInDay(formattedTimeLeft);
    };
    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTimeApiState.data]);

  return children({ timeLeftInDay });
};
