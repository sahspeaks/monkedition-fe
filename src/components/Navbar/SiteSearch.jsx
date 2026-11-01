// Search across the whole shop, from the navbar. Suggestions appear while
// typing; Enter opens the full results.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getProductSuggestions } from "../../api/catalog";

const MIN_LENGTH = 2;
const PHONE_TOP_GAP = 16;
const PHONE_BOX_HEIGHT = 64;

/**
 * A frosted glass bar floating over the page, like Spotlight. It sits near the
 * top of the screen, where a phone's keyboard cannot cover it.
 * @param {{ onPhone?: boolean, triggerClassName?: (active: boolean) => string, onOpenChange?: (open: boolean) => void }} props
 *   onPhone: the button is the bottom navigation's.
 *   onOpenChange: tells the bottom navigation to step aside while searching.
 */
function SiteSearch({ onPhone = false, triggerClassName, onOpenChange }) {
  const listId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, loading, done or failed
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  const input = useRef(null);
  const triggerButton = useRef(null);
  const query = text.trim();

  const [showList, setShowList] = useState(false);
  const onResults = location.pathname === "/search";
  const searched = onResults ? params.get("q") ?? "" : "";

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  // Every page change closes it; on the results page it remembers the words.
  useEffect(() => {
    setShowList(false);
    setSuggestions([]);
    setStatus("idle");
    setActive(-1);
    if (onResults) setText(searched);
    setOpen(false);
  }, [location.pathname, location.search, onResults, searched]);

  useEffect(() => {
    if (open) {
      input.current?.focus();
      setShowList(true);
    }
    onOpenChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When a phone's keyboard opens, the browser shifts the visible part of the
  // page, which leaves fixed elements behind. So the box follows what is really
  // on screen, and the page stays still underneath it.
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    if (!open || !onPhone) return undefined;
    const viewport = window.visualViewport;
    const measure = () =>
      setVisible(
        viewport
          ? { top: viewport.offsetTop, height: viewport.height }
          : { top: 0, height: window.innerHeight },
      );
    measure();
    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      document.body.style.overflow = overflow;
    };
  }, [open, onPhone]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (e) => {
      // The bottom bar's button closes it by itself.
      if (!box.current?.contains(e.target) && !triggerButton.current?.contains(e.target)) {
        setShowList(false);
        close();
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  // A newer word makes older answers irrelevant, however late they arrive.
  useEffect(() => {
    setActive(-1);
    if (!showList || query.length < MIN_LENGTH) {
      setSuggestions([]);
      setStatus("idle");
      return undefined;
    }
    let stale = false;
    setStatus("loading");
    const timer = setTimeout(() => {
      getProductSuggestions(query)
        .then((items) => {
          if (stale) return;
          setSuggestions(items);
          setStatus("done");
        })
        .catch(() => {
          if (!stale) setStatus("failed");
        });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, showList]);

  const openProduct = (item) => {
    setShowList(false);
    close();
    navigate(`/product/${item._id}`);
  };

  const seeAll = () => {
    if (query.length === 0) return;
    setShowList(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowList(false);
      close();
    } else if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length : index) - 1);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) {
      openProduct(suggestions[active]);
    } else {
      seeAll();
    }
  };

  const trigger = (
    <button
      ref={triggerButton}
      type="button"
      aria-label="Search products"
      onClick={() => (open ? close() : setOpen(true))}
      className={triggerClassName ? triggerClassName(open || onResults) : "flex items-center"}
    >
      <Search className={onPhone ? "w-6 h-6" : "w-5 h-5 text-gray-700"} aria-hidden="true" />
    </button>
  );

  if (!open) return trigger;

  const listVisible = showList && query.length >= MIN_LENGTH;

  // On a phone, the box is placed within the part of the page actually showing.
  const phoneStyle =
    onPhone && visible ? { top: `${visible.top + PHONE_TOP_GAP}px`, bottom: "auto" } : undefined;
  const listStyle =
    onPhone && visible
      ? { maxHeight: `${Math.max(120, visible.height - PHONE_TOP_GAP - PHONE_BOX_HEIGHT - 8)}px` }
      : undefined;

  const rowClass = (highlighted) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
      highlighted ? "bg-white/20" : "hover:bg-white/10"
    }`;

  const panel = (
    <div
      ref={box}
      style={phoneStyle}
      className={`fixed z-[60] inset-x-4 top-20 sm:top-[12vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[640px] overflow-hidden border border-gray-700/10 bg-gray-800/40 text-white shadow-2xl backdrop-blur-lg ${
        listVisible ? "rounded-[28px]" : "rounded-full"
      }`}
    >
      <form onSubmit={submit} role="search" className="flex items-center gap-3 px-5 py-4">
        <Search className="w-6 h-6 shrink-0 text-white" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={text}
          maxLength={100}
          name="site-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          enterKeyHint="search"
          role="combobox"
          aria-label="Search products"
          aria-expanded={listVisible}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Search products"
          onChange={(e) => {
            setText(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 bg-transparent text-xl font-normal text-white caret-orange-300 placeholder:text-white/90 outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => {
            setText("");
            setShowList(false);
            close();
          }}
        >
          <X className="w-5 h-5 text-white" aria-hidden="true" />
        </button>
      </form>

      {listVisible && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          style={listStyle}
          className="border-t border-white/15 p-2 max-h-[60vh] overflow-y-auto overscroll-contain font-normal"
        >
          {suggestions.map((item, index) => (
            <button
              key={item._id}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === active}
              onClick={() => openProduct(item)}
              className={rowClass(index === active)}
            >
              <img src={item.image} alt="" className="w-11 h-11 rounded-xl object-cover bg-white/10 shrink-0" />
              <span className="flex-1 min-w-0 text-base truncate">{item.name}</span>
              <span className="text-sm text-white whitespace-nowrap">₹{item.price}</span>
            </button>
          ))}
          {status === "loading" && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-white">Searching...</p>
          )}
          {status === "done" && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-white">No products found for “{query}”.</p>
          )}
          {status === "failed" && (
            <p className="px-3 py-3 text-sm text-white">Search is not available right now. Press Enter to try again.</p>
          )}
          {suggestions.length > 0 && (
            <button type="button" onClick={seeAll} className={`${rowClass(false)} text-sm font-semibold text-white`}>
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              See all results for “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );

  // The bottom navigation blurs its background, which would trap a fixed panel
  // inside it, so the panel renders at the top of the page instead.
  return (
    <>
      {trigger}
      {createPortal(panel, document.body)}
    </>
  );
}

export default SiteSearch;
