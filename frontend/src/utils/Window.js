import { useEffect } from 'react';

export function usePreventZoom(scrollCheck = true, keyboardCheck = true) {
  useEffect(() => {
    const handleKeydown = (e) => {
      if (
        (keyboardCheck && e.ctrlKey) ||
        (e.metaKey &&
          (e.keyCode === '61' ||
            e.keyCode === '107' ||
            e.keyCode === '173' ||
            e.keyCode === '109' ||
            e.keyCode === '187' ||
            e.key === '=' ||
            e.key === '-' ||
            e.key === '+' ||
            e.keyCode === '189'))
      ) {
        e.preventDefault();
      }
    };
    const handleTouchStart = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const handleTouchMove = (event) => {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    };

    const handleWheel = (e) => {
      if (scrollCheck && e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, {
      passive: false
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scrollCheck, keyboardCheck]);
}

export const useLockScroll = (scrollCheck = true) => {
  useEffect(() => {
    const handleScroll = (e) => {
      if (scrollCheck) {
        e.preventDefault();
      }
    };

    if (scrollCheck) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('scroll', handleScroll, { passive: false });
    } else {
      document.body.style.overflow = 'auto';
      document.removeEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrollCheck]);
};
