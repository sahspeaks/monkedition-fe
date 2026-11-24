// Step 8: summary bento, then publish as a 3-stage checklist and a particle burst.
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, ExternalLink, Loader2, Plus, Rocket, Save } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import { AuroraButton, Chip, GhostButton, spring } from "../ui/primitives";
import { colourOf, plannedRenders } from "../data/sample";
import { useStudio } from "../context";
import { StageHeader, Stagger, StaggerItem } from "./common";

const STAGES = ["Upload images", "Create product", "Make it active"];

const Burst = () => {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const colours = ["#7c5cff", "#ff5c8a", "#ffb547", "#f5f5f7"];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const d = 140 + (i % 5) * 40;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ background: colours[i % 4] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
};

const PublishStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const [progress, setProgress] = useState(-1); // index of the running stage, 3 = done
  const [mode, setMode] = useState(null); // "publish" | "draft"
  const renders = plannedRenders(draft);
  const kept = renders.filter((r) => draft.review[r.id] !== "reject");
  const skus = Object.values(draft.skus).filter((v) => v.trim()).length;
  const cells = draft.colours.length * draft.details.sizes.length;
  const main = renders.find((r) => r.id === draft.mainByColour[draft.colours[0]]) ?? kept[0];
  const set = main && modelSets.find((m) => m.id === main.setId);
  const warnings = [
    ...draft.colours.flatMap((code) => draft.details.sizes.filter((s) => !draft.skus[`${code}-${s}`]?.trim()).map((s) => `${colourOf(code).name} has no Qikink SKU for ${s}: it won't be sold`)),
  ];

  const run = (which) => {
    setMode(which);
    STAGES.forEach((_, i) => setTimeout(() => setProgress(i), i * 900));
    setTimeout(() => {
      setProgress(3);
      update((d) => ({ ...d, published: true }));
    }, STAGES.length * 900);
  };

  const stats = [
    ["Colours", draft.colours.length],
    ["Sizes", draft.details.sizes.length],
    ["Images", kept.length],
    ["SKUs", `${skus} / ${cells}`],
  ];

  const stage = (
    <>
      <StageHeader step={step} index={index} />
      <AnimatePresence mode="wait">
        {progress < 3 ? (
          <motion.div key="summary" exit={{ opacity: 0, scale: 0.97 }}>
            <Stagger className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
              <StaggerItem className="glass overflow-hidden rounded-3xl md:col-span-2 md:row-span-2">
                {main && <ModelFigure angle={main.angle} tee={colourOf(main.code).hex} skin={set?.skin} hair={set?.hair} print={main.slot} className="aspect-[4/5] w-full" />}
              </StaggerItem>
              <StaggerItem className="glass rounded-3xl p-5 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">{draft.details.category || "No category"}</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{draft.details.name}</h2>
                <p className="mt-2 font-mono text-xl text-aurora">₹{Number(draft.details.price || 0).toLocaleString("en-IN")}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {draft.colours.map((c) => (
                    <span key={c} className="h-5 w-5 rounded-full" title={colourOf(c).name} style={{ background: colourOf(c).hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)" }} />
                  ))}
                </div>
              </StaggerItem>
              {stats.map(([label, value]) => (
                <StaggerItem key={label} className="glass rounded-3xl p-5">
                  <p className="font-mono text-3xl text-white">{value}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">{label}</p>
                </StaggerItem>
              ))}
            </Stagger>

            {warnings.length > 0 && (
              <div className="glass mt-4 rounded-2xl p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#ffb547]"><AlertTriangle className="h-4 w-4" /> {warnings.length} warning{warnings.length > 1 ? "s" : ""}</p>
                <ul className="space-y-1 text-xs text-[var(--text-2)]">
                  {warnings.slice(0, 4).map((w) => <li key={w}>· {w}</li>)}
                  {warnings.length > 4 && <li>· and {warnings.length - 4} more</li>}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-4">
              {progress < 0 ? (
                <>
                  <AuroraButton size="lg" onClick={() => run("publish")}>
                    <Rocket className="h-5 w-5" /> Publish to the shop
                  </AuroraButton>
                  <GhostButton onClick={() => run("draft")}><Save className="h-4 w-4" /> Save as draft product</GhostButton>
                </>
              ) : (
                <ol className="glass w-full max-w-sm space-y-3 rounded-2xl p-5">
                  {STAGES.slice(0, mode === "draft" ? 2 : 3).map((label, i) => (
                    <li key={label} className="flex items-center gap-3 text-sm">
                      {progress > i ? <Check className="h-4 w-4 text-[#3ddc97]" /> : progress === i ? <Loader2 className="h-4 w-4 animate-spin text-[#ff5c8a]" /> : <span className="h-4 w-4 rounded-full border border-white/20" />}
                      <span className={progress >= i ? "text-white" : "text-[var(--text-3)]"}>{label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" className="relative flex flex-col items-center py-10 text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Burst />
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.15 }} className="w-64 overflow-hidden rounded-3xl bg-[#f8f4ee] shadow-[0_40px_120px_-30px_rgba(255,92,138,0.6)]">
              {main && <ModelFigure angle={main.angle} tee={colourOf(main.code).hex} skin={set?.skin} hair={set?.hair} print={main.slot} className="aspect-[4/5] w-full" />}
              <p className="px-4 py-3 text-left text-sm font-semibold text-[#2a2420]">{draft.details.name}</p>
            </motion.div>
            <h2 className="mt-8 text-3xl font-semibold text-white">{mode === "draft" ? "Saved as a draft product" : "It's live"}</h2>
            <p className="mt-2 text-sm text-[var(--text-2)]">{kept.length} images across {draft.colours.length} colours.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {mode !== "draft" && <GhostButton><ExternalLink className="h-4 w-4" /> View in shop</GhostButton>}
              <Link to="/dashboard/products"><GhostButton>Open in Products</GhostButton></Link>
              <Link to="/studio"><AuroraButton><Plus className="h-4 w-4" /> New product</AuroraButton></Link>
            </div>
            <Chip className="mt-6">Prototype: nothing was actually published</Chip>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return <Workspace stage={stage} />;
};

export default PublishStep;
