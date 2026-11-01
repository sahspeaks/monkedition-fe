// Search across the whole shop, from the navbar. Suggestions appear while
// typing; Enter opens the full results.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getProductSuggestions } from "../../api/catalog";

const MIN_LENGTH = 2;

function SiteSearch() {
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
  const query = text.trim();

  const [showList, setShowList] = useState(false);
  const onResults = location.pathname === "/search";
  const searched = onResults ? params.get("q") ?? "" : "";

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
    setOpen(onResults);
  }, [location.pathname, location.search, onResults, searched]);

  // Only when someone opens it: focusing the box on the results page would
  // spread the suggestions over the results.
  useEffect(() => {
    if (open && !onResults) input.current?.focus();
  }, [open, onResults]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (e) => {
      if (!box.current?.contains(e.target)) {
        setShowList(false);
        if (!onResults) close();
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open, onResults]);

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
      if (!onResults) close();
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

  if (!open) {
    return (
      <button type="button" aria-label="Search products" onClick={() => setOpen(true)} className="flex items-center">
        <Search className="w-5 h-5 text-gray-700" aria-hidden="true" />
      </button>
    );
  }

  const listVisible = showList && query.length >= MIN_LENGTH;

  return (
    <div
      ref={box}
      className="absolute left-4 right-4 top-full mt-1 z-30 sm:static sm:mt-0 sm:w-64 lg:w-80 sm:relative"
    >
      <form onSubmit={submit} role="search" className="flex items-center gap-2 border border-gray-300 rounded-full bg-white px-3 py-1.5">
        <Search className="w-4 h-4 shrink-0 text-gray-500" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={text}
          maxLength={100}
          autoComplete="off"
          role="combobox"
          aria-label="Search products"
          aria-expanded={listVisible}
          aria-controls="site-search-results"
          aria-activedescendant={active >= 0 ? `site-search-${active}` : undefined}
          placeholder="Search products"
          onChange={(e) => {
            setText(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 text-sm font-normal outline-none bg-transparent [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => {
            setText("");
            setShowList(false);
            if (onResults) input.current?.focus();
            else close();
          }}
        >
          <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </button>
      </form>

      {listVisible && (
        <div
          id="site-search-results"
          role="listbox"
          aria-label="Suggestions"
          className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden font-normal"
        >
          {suggestions.map((item, index) => (
            <button
              key={item._id}
              id={`site-search-${index}`}
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
              className="w-full px-3 py-2 text-sm text-left text-orange-600 border-t border-gray-100 hover:bg-orange-50"
            >
              See all results for “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SiteSearch;
