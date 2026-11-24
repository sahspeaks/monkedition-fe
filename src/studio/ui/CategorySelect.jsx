// A dropdown of the shop's categories, from the backend's category tree
// (GET /api/v2/categories/tree). Top-level categories (Men, Women…) are the
// groups; their sub-categories are the choices. No free text.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, RotateCw } from "lucide-react";
import { getCategoryTree } from "../../api/catalog";

const ease = [0.22, 1, 0.36, 1];

/** [{ group, options: [{ id, name, path, thumbnail }] }]; a top level with no children is its own option. */
const toGroups = (tree) =>
  tree.map((root) => {
    const leaves = [];
    const walk = (node, trail) => {
      const path = [...trail, node.name];
      if (!node.children?.length) leaves.push({ id: node.id, name: node.name, path: path.join(" › "), thumbnail: node.thumbnail || null });
      else node.children.forEach((child) => walk(child, path));
    };
    walk(root, []);
    return { group: root.name, options: leaves };
  });

const Thumb = ({ src, name }) =>
  src ? (
    <img src={src} alt="" loading="lazy" className="h-7 w-7 shrink-0 rounded-sm border border-[var(--line)] object-cover" />
  ) : (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-[var(--line)] bg-[var(--panel-2)] font-mono text-[10px] text-[var(--text-3)]">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

const CategorySelect = ({ label = "Series", value, onChange }) => {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef(null);
  const listId = useId();

  const load = () => {
    setError(false);
    getCategoryTree()
      .then((tree) => setGroups(toGroups(tree)))
      .catch(() => setError(true));
  };
  useEffect(load, []);

  const options = useMemo(() => (groups ?? []).flatMap((g) => g.options), [groups]);
  const selected = options.find((o) => o.id === value) ?? null;

  // close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };
  const choose = (option) => {
    onChange(option);
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (!options.length) return;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((i) => Math.min(options.length - 1, i + 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((i) => Math.max(0, i - 1)));
    else if (e.key === "Home") (e.preventDefault(), setActive(0));
    else if (e.key === "End") (e.preventDefault(), setActive(options.length - 1));
    else if (e.key === "Enter" || e.key === " ") (e.preventDefault(), options[active] && choose(options[active]));
    else if (e.key === "Escape" || e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <span className="label mb-2 block text-[var(--text-3)]" id={`${listId}-label`}>
        {label}
      </span>

      {error ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--error)] pb-2 text-sm">
          <span className="text-[var(--text-2)]">Couldn&apos;t load categories</span>
          <button type="button" onClick={load} className="label flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--accent)]">
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${listId}-label`}
          aria-activedescendant={open && options[active] ? `${listId}-${options[active].id}` : undefined}
          disabled={!groups}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={`inline-edit flex w-full items-center gap-3 border-b pb-2 text-left transition-colors disabled:cursor-wait ${open ? "border-[var(--text)]" : "border-[var(--line-2)] hover:border-[var(--text-3)]"}`}
        >
          {!groups ? (
            <span className="h-5 w-2/3 animate-pulse bg-[var(--panel-2)]" aria-label="Loading categories" />
          ) : selected ? (
            <>
              <Thumb src={selected.thumbnail} name={selected.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-[var(--text)]">{selected.name}</span>
                <span className="block truncate text-[11px] text-[var(--text-3)]">{selected.path}</span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-base text-[var(--mute)]">Choose a category</span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }} className="shrink-0 text-[var(--text-2)]">
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      )}

      <AnimatePresence>
        {open && groups && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={`${listId}-label`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease }}
            className="scroll-y absolute inset-x-0 top-full z-30 mt-2 max-h-80 border border-[var(--line-2)] bg-[var(--panel)] py-1 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]"
          >
            {options.length === 0 && <li className="px-4 py-6 text-center text-sm text-[var(--text-3)]">No categories yet. Add them in the dashboard.</li>}
            {groups.map((g) =>
              g.options.length ? (
                <li key={g.group} role="presentation">
                  <p className="label px-4 pb-1.5 pt-3 text-[var(--text-3)]">{g.group}</p>
                  <ul role="group" aria-label={g.group}>
                    {g.options.map((o) => {
                      const i = options.indexOf(o);
                      const isActive = i === active;
                      const isSelected = o.id === value;
                      return (
                        <li
                          key={o.id}
                          id={`${listId}-${o.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onPointerEnter={() => setActive(i)}
                          onClick={() => choose(o)}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${isActive ? "bg-[var(--panel-2)]" : ""}`}
                        >
                          <Thumb src={o.thumbnail} name={o.name} />
                          <span className={`flex-1 truncate ${isSelected ? "text-[var(--text)]" : "text-[var(--text-2)]"}`}>{o.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ) : null,
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySelect;
