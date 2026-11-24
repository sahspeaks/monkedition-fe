// Step 7: Qikink SKUs per colour × size, filled from a pattern.
import { useState } from "react";
import { Wand2 } from "lucide-react";
import Workspace from "../ui/Workspace";
import { AuroraButton, Chip, GhostButton, Label } from "../ui/primitives";
import { colourOf } from "../data/sample";
import { StageHeader } from "./common";

const TOKENS = [
  ["{type}", "Product type code", "OVT"],
  ["{colourCode}", "Palette code", "Bk"],
  ["{size}", "Size", "M"],
];
const VALID = /^[A-Za-z0-9._-]*$/;

const SkusStep = ({ draft, update, step, index }) => {
  const sizes = draft.details.sizes;
  const [focus, setFocus] = useState(null);
  const [filling, setFilling] = useState(false);
  const [flash, setFlash] = useState(null); // cell just filled from the pattern
  const skus = draft.skus;
  const keyOf = (code, size) => `${code}-${size}`;
  const fromPattern = (code, size) => draft.skuPattern.replaceAll("{type}", "OVT").replaceAll("{colourCode}", code).replaceAll("{size}", size);

  const counts = Object.values(skus).reduce((m, v) => (v.trim() ? { ...m, [v.trim()]: (m[v.trim()] ?? 0) + 1 } : m), {});
  const problem = (v) => (!v ? null : !VALID.test(v) ? "Only letters, numbers, . _ -" : counts[v.trim()] > 1 ? "Duplicate SKU" : null);

  const fill = () => {
    setFilling(true);
    const cells = draft.colours.flatMap((code) => sizes.map((size) => [code, size]));
    cells.forEach(([code, size], i) =>
      setTimeout(() => {
        update((d) => ({ ...d, skus: { ...d.skus, [keyOf(code, size)]: fromPattern(code, size) } }));
        setFlash(keyOf(code, size));
        if (i === cells.length - 1) setTimeout(() => (setFilling(false), setFlash(null)), 300);
      }, i * 45),
    );
  };

  const stage = (
    <>
      <StageHeader step={step} index={index} />
      <div className="glass mb-5 rounded-2xl p-5">
        <Label hint="click a token to add it">Pattern</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input value={draft.skuPattern} onChange={(e) => update((d) => ({ ...d, skuPattern: e.target.value }))} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-sm text-white focus:outline-none" aria-label="SKU pattern" />
          <AuroraButton onClick={fill} disabled={filling || !draft.colours.length || !sizes.length}>
            <Wand2 className="h-4 w-4" /> Fill from pattern
          </AuroraButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOKENS.map(([token]) => (
            <GhostButton key={token} size="xs" onClick={() => update((d) => ({ ...d, skuPattern: d.skuPattern + token }))} className="font-mono">{token}</GhostButton>
          ))}
        </div>
      </div>
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#121217] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">Colour</th>
              {sizes.map((s) => (
                <th key={s} className="px-2 py-3 text-left font-mono text-xs text-[var(--text-3)]">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.colours.map((code) => {
              const c = colourOf(code);
              return (
                <tr key={code} className="border-t border-white/[0.05]">
                  <th className="sticky left-0 z-10 bg-[#121217] px-4 py-2 text-left font-normal">
                    <span className="flex items-center gap-2 whitespace-nowrap text-white">
                      <span className="h-4 w-4 rounded-full" style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)" }} /> {c.name}
                    </span>
                  </th>
                  {sizes.map((size) => {
                    const k = keyOf(code, size);
                    const v = skus[k] ?? "";
                    const err = problem(v);
                    return (
                      <td key={size} className="px-2 py-2">
                        <input
                          value={v}
                          placeholder="Not sold"
                          onFocus={() => setFocus(k)}
                          onChange={(e) => update((d) => ({ ...d, skus: { ...d.skus, [k]: e.target.value } }))}
                          aria-label={`SKU for ${c.name} ${size}`}
                          aria-invalid={Boolean(err)}
                          title={err ?? undefined}
                          className={`w-36 rounded-lg border px-2.5 py-1.5 font-mono text-xs text-white transition-all duration-300 placeholder:text-white/20 focus:outline-none ${flash === k ? "scale-105 bg-[#ff5c8a]/25" : "bg-white/[0.03]"} ${err ? "border-[#ff5c6c]/70" : "border-white/10 focus:border-[#7c5cff]/60"}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const [fc, fs] = focus ? focus.split("-") : [draft.colours[0], sizes[0]];
  const inspector = (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-2)]">Qikink prints from products that already exist in your Qikink account. Each cell is the SKU of that colour and size there. Empty cells are not sold.</p>
      <ul className="space-y-2">
        {TOKENS.map(([token, label, example]) => (
          <li key={token} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
            <span className="font-mono text-white">{token}</span>
            <span className="text-[var(--text-3)]">{label} · e.g. {example}</span>
          </li>
        ))}
      </ul>
      {fc && fs && (
        <div>
          <Label>Example</Label>
          <p className="rounded-xl bg-white/[0.04] px-3 py-3 font-mono text-sm text-white">{fromPattern(fc, fs)}</p>
          <p className="mt-1 text-[11px] text-[var(--text-3)]">{colourOf(fc)?.name} · {fs}</p>
        </div>
      )}
      {focus && problem(skus[focus]) && <Chip tone="error">{problem(skus[focus])}</Chip>}
    </div>
  );

  return <Workspace stage={stage} inspector={inspector} inspectorTitle="Tokens" />;
};

export default SkusStep;
