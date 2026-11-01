// components/ScrollToTop.js
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// How long to wait for a page's content to grow tall enough to scroll back to.
const RESTORE_FOR_MS = 2000;

/**
 * New pages open at the top. Going back returns to where you were, once the
 * page has content there. Kept in memory: a refresh starts at the top.
 */
function ScrollToTop() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map());
  const currentKey = useRef(key);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const remember = () => positions.current.set(currentKey.current, window.scrollY);
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, []);

  // Before the new page can fire a scroll event against the old entry.
  useLayoutEffect(() => {
    currentKey.current = key;
  }, [key]);

  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
      return undefined;
    }
    const target = positions.current.get(key) ?? 0;
    const started = performance.now();
    let frame;
    const attempt = () => {
      const reachable = document.documentElement.scrollHeight - window.innerHeight >= target;
      window.scrollTo(0, target);
      if (!reachable && performance.now() - started < RESTORE_FOR_MS) {
        frame = requestAnimationFrame(attempt);
      }
    };
    attempt();
    return () => cancelAnimationFrame(frame);
    // Filters change the query and key on the same path, and must not jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navigationType === "POP" ? key : null]);

  return null;
}

export default ScrollToTop;
