import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for count-up animation.
 * @param {number} target - Target number to count up to.
 * @param {number} duration - Animation duration in ms.
 * @param {boolean} start - Whether to start the animation.
 */
export function useCountUp(target, duration = 1500, start = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!start || target === 0) {
      setCount(target);
      return;
    }

    const startValue = 0;
    const endValue = target;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startTimeRef.current = null;
    };
  }, [target, duration, start]);

  return count;
}
