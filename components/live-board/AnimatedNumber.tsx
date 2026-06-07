// ============================================================
// AnimatedNumber — a number that smoothly counts to its new value.
//
// Plain English: on the big display, when a prize is pulled the "X left"
// shouldn't just snap — it should tick down. This little component tweens
// from the old value to the new one over a fraction of a second, so the
// board feels alive. It's display-only; it changes nothing about the data.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  /** Tween length in milliseconds. */
  duration?: number;
  /** Turn the (possibly fractional, mid-tween) number into display text. */
  format?: (n: number) => string;
};

export function AnimatedNumber({ value, duration = 550, format }: Props) {
  const [display, setDisplay] = useState(value);
  // Where the current tween started from (the last settled value).
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic: fast at first, gently landing on the final value.
      const eased = 1 - (1 - t) ** 3;
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}
