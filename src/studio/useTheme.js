// Light / dark for Studio, remembered in this browser. Switching runs a
// circular reveal: the new theme grows as a circle from the toggle until it
// covers the screen (View Transitions API). Browsers without it, and people
// who ask for reduced motion, get an instant switch.
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

const KEY = "monk-studio-theme";
const DURATION = 700;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const initial = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked */
  }
  return "dark"; // Studio is designed dark-first
};

export const useTheme = () => {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }, [theme]);

  /** Pass the click event so the circle starts at the button. */
  const toggle = useCallback(
    (event) => {
      const next = theme === "dark" ? "light" : "dark";
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) {
        setTheme(next);
        return;
      }

      const rect = event?.currentTarget?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
      const y = rect ? rect.top + rect.height / 2 : 28;
      // far enough to reach the furthest corner
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(next)); // the DOM must change inside the callback
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: DURATION, easing: EASE, pseudoElement: "::view-transition-new(root)" },
          );
        })
        .catch(() => {
          /* transition skipped: the theme has already switched */
        });
    },
    [theme],
  );

  return { theme, toggle };
};
