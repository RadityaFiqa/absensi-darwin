import { useState, useEffect } from 'react';
import { formatIndonesianDate, formatTime } from '@/utils/format';

export const useClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    time: time ? formatTime(time) : '--:--:--',
    date: time ? formatIndonesianDate(time) : 'Memuat Tanggal...',
    rawTime: time,
  };
};

export default useClock;
