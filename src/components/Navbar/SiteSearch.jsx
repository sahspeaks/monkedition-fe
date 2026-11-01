// Search across the whole shop, from the navbar. Suggestions appear while
// typing; Enter opens the full results.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getProductSuggestions } from "../../api/catalog";

const MIN_LENGTH = 2;

/**
 * @param {{ onPhone?: boolean, triggerClassName?: (active: boolean) => string }} props
 *   onPhone: opened from the bottom navigation. The box goes at the top of the
 *   screen, where the phone's keyboard cannot cover it, and stays closed until tapped.
 */
function SiteSearch({ onPhone = false, triggerClassName }) {
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

  // Only the desktop box stays open on the results page.
  const stayOpen = onResults && !onPhone;

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  // Every page change settles the box: on the results page it stays open and
  // shows what was searched for; anywhere else it closes.
  useEffect(() => {
    setShowList(false);
    setSuggestions([]);
    setStatus("idle");
    setActive(-1);
    if (onResults) setText(searched);
    setOpen(onResults && !onPhone);
  }, [location.pathname, location.search, onResults, searched, onPhone]);

  // Only when someone opens it: focusing the box on the results page would
  // spread the suggestions over the results.
  useEffect(() => {
    if (open && (onPhone || !onResults)) input.current?.focus();
  }, [open, onResults, onPhone]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (e) => {
      // The bottom bar's button closes it by itself.
      if (!box.current?.contains(e.target) && !triggerButton.current?.contains(e.target)) {
        setShowList(false);
        if (stayOpen) return;
        close();
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open, stayOpen]);

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
      if (!stayOpen) close();
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

  const panel = (
    <div
      ref={box}
      className={
        onPhone
          ? "fixed inset-x-0 top-16 z-[60] bg-white px-4 pt-2 pb-4 shadow-lg rounded-b-2xl"
          : "relative w-64 lg:w-80"
      }
    >
      <form onSubmit={submit} role="search" className={`flex items-center gap-3 border-2 border-gray-200 rounded-xl bg-gray-50 px-4 transition-colors focus-within:border-orange-300 focus-within:bg-white ${onPhone ? "py-3" : "py-2"}`}>
        <Search className="w-5 h-5 shrink-0 text-gray-700" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={text}
          maxLength={100}
          autoComplete="off"
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
          className="flex-1 min-w-0 text-base sm:text-sm font-normal text-gray-900 placeholder:text-gray-500 outline-none bg-transparent [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => {
            setText("");
            setShowList(false);
            if (stayOpen) input.current?.focus();
            else close();
          }}
        >
          <X className="w-5 h-5 text-gray-700" aria-hidden="true" />
        </button>
      </form>

      {listVisible && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className={`bg-white rounded-xl overflow-hidden font-normal mt-2 ${
            onPhone ? "border border-gray-100" : "absolute left-0 right-0 border border-gray-200 shadow-lg"
          }`}
        >
          {suggestions.map((item, index) => (
            <button
              key={item._id}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === active}
              onClick={() => openProduct(item)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-orange-50 ${index === active ? "bg-orange-50" : ""}`}
            >
              <img src={item.image} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
              <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{item.name}</span>
              <span className="text-sm text-gray-600 whitespace-nowrap">₹{item.price}</span>
            </button>
          ))}
          {status === "loading" && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">Searching...</p>
          )}
          {status === "done" && suggestions.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">No products found for “{query}”.</p>
          )}
          {status === "failed" && (
            <p className="px-3 py-3 text-sm text-gray-500">Search is not available right now. Press Enter to try again.</p>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={seeAll}
              className="w-full px-3 py-3 text-sm font-semibold text-center text-black bg-orange-300 hover:bg-orange-400 transition-colors"
            >
              See all results for “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );

  // The bottom navigation blurs its background, which would trap a fixed panel
  // inside it, so the phone's panel renders at the top of the page instead.
  return onPhone ? (
    <>
      {trigger}
      {createPortal(
        <>
          <div className="fixed inset-0 z-[59] bg-black/40" aria-hidden="true" />
          {panel}
        </>,
        document.body,
      )}
    </>
  ) : (
    panel
  );
}

export default SiteSearch;
