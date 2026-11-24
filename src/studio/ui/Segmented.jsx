// A row of mutually exclusive options in a hairline box; the chosen one is
// filled with the text colour (solid, no gradients).
const Segmented = ({ options, value, onChange, label, className = "" }) => (
  <div role="radiogroup" aria-label={label} className={`grid border border-[var(--line-2)] ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map(([key, text], i) => {
      const on = value === key;
      return (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(key)}
          className={`h-9 px-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-[var(--line-2)]" : ""} ${on ? "bg-[var(--text)] text-[var(--ink)]" : "text-[var(--text-2)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"}`}
        >
          {text}
        </button>
      );
    })}
  </div>
);

export default Segmented;
