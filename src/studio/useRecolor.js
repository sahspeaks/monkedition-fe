// A recoloured model photo from the mockups service, cached for the session
// so flipping between colours is instant after the first load.
import { useEffect, useState } from "react";
import { mockupsApi } from "../dashboard/mockups/api";
import { errorText } from "../dashboard/api";

const cache = new Map(); // key -> object URL
const pending = new Map(); // key -> Promise<object URL>

const keyOf = (src, hex, width) => `${src}|${hex}|${width}`;

export const loadRecolor = (src, hex, width = 800) => {
  const key = keyOf(src, hex, width);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (!pending.has(key)) {
    pending.set(
      key,
      mockupsApi
        .recolor(src, hex, width)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          cache.set(key, url);
          return url;
        })
        .finally(() => pending.delete(key)),
    );
  }
  return pending.get(key);
};

/** { url, loading, error } for `src` recoloured to `hex`; url stays on the last good image while loading. */
export const useRecolor = (src, hex, width = 800) => {
  const [state, setState] = useState({ url: null, loading: false, error: "" });
  useEffect(() => {
    if (!src || !hex) {
      setState({ url: null, loading: false, error: "" });
      return undefined;
    }
    const hit = cache.get(keyOf(src, hex, width));
    if (hit) {
      setState({ url: hit, loading: false, error: "" });
      return undefined;
    }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    loadRecolor(src, hex, width)
      .then((url) => live && setState({ url, loading: false, error: "" }))
      .catch((err) => live && setState((s) => ({ ...s, loading: false, error: errorText(err) })));
    return () => {
      live = false;
    };
  }, [src, hex, width]);
  return state;
};
