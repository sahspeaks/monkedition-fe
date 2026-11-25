// Step 7: the Qikink SKU for each colour × size. Filled from a pattern
// (remembered per product type), typed, or pasted from a spreadsheet. An
// empty cell is not sold. Spec: docs/STUDIO_PLAN.md §5.9.
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CircleDot, Eraser, Wand2 } from "lucide-react";
import { admin } from "../../dashboard/api";
import { colourOf } from "../palette";
import { TOKENS, applyPattern, defaultPattern, rememberPattern, rememberedPattern, skuReport, variantKey } from "../skus";
import { Button } from "../ui/Shell";

const pad = (n) => String(n).padStart(2, "0");
const Swatch = ({ hex }) => <span className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: hex, boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.35)" }} aria-hidden="true" />;

const SkusStep = ({ draft, update, step, index }) => {
  const sizes = draft.details.sizes;
  const colours = draft.colours.map(colourOf).filter(Boolean);
  const skus = draft.skus;
  const report = useMemo(() => skuReport(draft), [draft]);
  const problemOf = (key) => report.cells.find((c) => c.key === key)?.problem ?? null;
  const [focus, setFocus] = useState(colours[0] && sizes[0] ? variantKey(colours[0].code, sizes[0]) : null);
  const [flash, setFlash] = useState(new Set());
  const cellRefs = useRef({});
  const patternRef = useRef(null);
  const typeId = draft.details.productCategory;

  // the product type's name, for a starting pattern
  const [typeName, setTypeName] = useState("");
  useEffect(() => {
    admin
      .get("/categories")
      .then((t) => setTypeName(t.productTypes?.find((x) => x.id === typeId)?.name ?? ""))
      .catch(() => {});
  }, [typeId]);
  useEffect(() => {
    if (draft.skuPattern || !typeName) return;
    update((d) => ({ ...d, skuPattern: rememberedPattern(typeId) ?? defaultPattern(typeName) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeName]);

  const pattern = draft.skuPattern ?? "";
  const setPattern = (value) => update((d) => ({ ...d, skuPattern: value }));
  const setCells = (entries) => update((d) => ({ ...d, skus: { ...d.skus, ...entries } }));

  const insertToken = (token) => {
    const el = patternRef.current;
    const at = el ? el.selectionStart : pattern.length;
    const end = el ? el.selectionEnd : pattern.length;
    setPattern(pattern.slice(0, at) + token + pattern.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  };

  const fill = (overwrite) => {
    const entries = {};
    colours.forEach((c) => sizes.forEach((s) => {
      const key = variantKey(c.code, s);
      if (overwrite || !(skus[key] ?? "").trim()) entries[key] = applyPattern(pattern, c.code, s);
    }));
    if (!Object.keys(entries).length) return;
    setCells(entries);
    if (typeId) rememberPattern(typeId, pattern);
    // light the filled cells one after another
    Object.keys(entries).forEach((key, i) =>
      setTimeout(() => {
        setFlash((f) => new Set(f).add(key));
        setTimeout(() => setFlash((f) => {
          const next = new Set(f);
          next.delete(key);
          return next;
        }), 450);
      }, i * 28),
    );
  };
  const clearAll = () => {
    if (!window.confirm("Clear every SKU for this product?")) return;
    setCells(Object.fromEntries(report.cells.map((c) => [c.key, ""])));
  };

  // grid navigation: Enter moves down (Shift+Enter up); pasting a block fills the grid
  const move = (row, col) => {
    const c = colours[row];
    const s = sizes[col];
    if (c && s) cellRefs.current[variantKey(c.code, s)]?.focus();
  };
  const onKeyDown = (e, row, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      move(row + (e.shiftKey ? -1 : 1), col);
    }
  };
  const onPaste = (e, row, col) => {
    const text = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((r) => r.split("\t"));
    const entries = {};
    rows.forEach((cells, r) => cells.forEach((value, c) => {
      const colour = colours[row + r];
      const size = sizes[col + c];
      if (colour && size) entries[variantKey(colour.code, size)] = value.trim();
    }));
    setCells(entries);
  };

  const example = colours[0] && sizes[0] ? applyPattern(pattern, colours[0].code, sizes[Math.min(2, sizes.length - 1)]) : "";

  // ---------- left: pattern ----------
  const panel = (
    <div className="space-y-7 p-6">
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Pattern</p>
        <input
          ref={patternRef}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          aria-label="SKU pattern"
          className="inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent px-0 pb-2 font-mono text-lg text-[var(--text)] caret-[var(--accent)] focus:border-[var(--text)]"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TOKENS.map((t) => (
            <button key={t.token} type="button" onClick={() => insertToken(t.token)} title={t.label} className="border border-[var(--line-2)] px-2 py-1 font-mono text-xs text-[var(--text-2)] transition-colors hover:border-[var(--text-3)] hover:text-[var(--text)]">
              {t.token}
            </button>
          ))}
        </div>
        {example && (
          <p className="mt-3 text-xs text-[var(--text-3)]">
            e.g. <span className="font-mono text-[var(--text)]">{example}</span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Button variant="solid" className="w-full" disabled={!pattern.trim() || !report.cells.length} onClick={() => fill(false)}>
          <Wand2 className="h-4 w-4" /> Fill empty cells
        </Button>
        <Button className="w-full" disabled={!pattern.trim() || !report.cells.length} onClick={() => fill(true)}>
          Overwrite all
        </Button>
        <Button className="w-full" disabled={!report.filled} onClick={clearAll}>
          <Eraser className="h-4 w-4" /> Clear all
        </Button>
        <p className="pt-1 text-[11px] text-[var(--text-3)]">The pattern is remembered for {typeName || "this product type"}.</p>
      </div>
      <dl className="grid grid-cols-3 border-y border-[var(--line)] py-4 text-center">
        {[
          ["Sold", report.filled, "text-[var(--text)]"],
          ["Not sold", report.cells.length - report.filled, "text-[var(--text-3)]"],
          ["To fix", report.problems.length, report.problems.length ? "text-[var(--error)]" : "text-[var(--text-3)]"],
        ].map(([label, n, tone]) => (
          <div key={label}>
            <dd className={`font-mono text-2xl ${tone}`}>{pad(n)}</dd>
            <dt className="label mt-1 !text-[10px] text-[var(--text-3)]">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="text-[11px] leading-relaxed text-[var(--text-3)]">Paste a block from a spreadsheet into any cell to fill the grid from there. Enter moves down.</p>
    </div>
  );

  // ---------- centre: the grid ----------
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {pad(index + 1)} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
        <p className="mt-3 max-w-xl text-[var(--text-2)]">Each colour and size needs the SKU of that blank in your Qikink account. Empty cells won&apos;t be sold.</p>
      </div>
      {!report.cells.length ? (
        <div className="flex h-48 items-center justify-center border border-dashed border-[var(--line-2)] text-sm text-[var(--text-2)]">Choose colours (step 3) and sizes (step 6) first.</div>
      ) : (
        <div className="overflow-x-auto border border-[var(--line)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th scope="col" className="label sticky left-0 z-10 bg-[var(--ink)] px-4 py-3 text-left text-[var(--text-3)]">
                  Colour
                </th>
                {sizes.map((s) => (
                  <th key={s} scope="col" className="px-2 py-3 text-left font-mono text-xs text-[var(--text-3)]">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colours.map((c, row) => (
                <tr key={c.code} className="border-b border-[var(--line)] last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-[var(--ink)] px-4 py-2 text-left font-normal">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Swatch hex={c.hex} /> {c.name}
                    </span>
                  </th>
                  {sizes.map((s, col) => {
                    const key = variantKey(c.code, s);
                    const value = skus[key] ?? "";
                    const problem = problemOf(key);
                    return (
                      <td key={s} className="px-1.5 py-1.5">
                        <input
                          ref={(el) => (cellRefs.current[key] = el)}
                          value={value}
                          placeholder="Not sold"
                          spellCheck={false}
                          onFocus={() => setFocus(key)}
                          onChange={(e) => setCells({ [key]: e.target.value })}
                          onKeyDown={(e) => onKeyDown(e, row, col)}
                          onPaste={(e) => onPaste(e, row, col)}
                          aria-label={`Qikink SKU for ${c.name}, ${s}`}
                          aria-invalid={Boolean(problem)}
                          title={problem ?? undefined}
                          className={`inline-edit w-36 border px-2.5 py-1.5 font-mono text-xs text-[var(--text)] caret-[var(--accent)] transition-colors duration-300 placeholder:text-[var(--mute)] ${
                            flash.has(key) ? "border-[var(--accent)] bg-[var(--accent)] !text-[var(--accent-ink)]" : problem ? "border-[var(--error)] bg-transparent" : focus === key ? "border-[var(--text)] bg-[var(--panel)]" : "border-[var(--line)] bg-transparent hover:border-[var(--line-2)]"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---------- right: the focused cell ----------
  const [fc, fs] = focus ? [focus.slice(0, focus.lastIndexOf("-")), focus.slice(focus.lastIndexOf("-") + 1)] : [];
  const fColour = fc && colourOf(fc);
  const fValue = (focus && skus[focus]) || "";
  const fProblem = focus && problemOf(focus);
  const inspector = !fColour ? (
    <div className="flex h-full flex-col justify-center p-6 text-center">
      <CircleDot className="mx-auto mb-3 h-5 w-5 text-[var(--text-3)]" />
      <p className="text-sm text-[var(--text-2)]">Select a cell.</p>
    </div>
  ) : (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Swatch hex={fColour.hex} />
        <p className="text-2xl font-medium tracking-[-0.02em]">
          {fColour.name} · {fs}
        </p>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="label text-[var(--text-3)]">Qikink SKU</dt>
          <dd className="mt-1 break-all font-mono">{fValue.trim() || <span className="text-[var(--text-3)]">Not sold</span>}</dd>
        </div>
        <div>
          <dt className="label text-[var(--text-3)]">Shop variant</dt>
          <dd className="mt-1 font-mono text-[var(--text-2)]">{focus}</dd>
        </div>
        <div>
          <dt className="label text-[var(--text-3)]">From the pattern</dt>
          <dd className="mt-1 font-mono text-[var(--text-2)]">{applyPattern(pattern, fc, fs) || "—"}</dd>
        </div>
      </dl>
      {fValue.trim() &&
        (fProblem ? (
          <p className="flex items-start gap-2 text-sm text-[var(--error)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {fProblem}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[var(--success)]">
            <Check className="h-4 w-4" /> Looks good
          </p>
        ))}
      <p className="border-t border-[var(--line)] pt-4 text-[11px] leading-relaxed text-[var(--text-3)]">
        Qikink fulfils orders from products that already exist in your Qikink account, so this must be that product&apos;s SKU exactly. Other products may use the same SKU.
      </p>
    </div>
  );

  return (
    <div className="scroll-y h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
      <aside className="border-b border-[var(--line)] lg:overflow-y-auto lg:border-b-0 lg:border-r">{panel}</aside>
      <div className="lg:overflow-y-auto">
        {stage}
        <div className="border-t border-[var(--line)] xl:hidden">{inspector}</div>
      </div>
      <aside className="hidden border-l border-[var(--line)] xl:block xl:overflow-y-auto">{inspector}</aside>
    </div>
  );
};

export default SkusStep;
