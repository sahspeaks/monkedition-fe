// Panel | Stage | Inspector. On tablets (below 1024 px) the panel opens as a
// drawer from a slim rail; below 1280 px the inspector is a bottom sheet you
// drag up. See docs/STUDIO_PLAN.md §4.2.
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftOpen, SlidersHorizontal, X } from "lucide-react";
import { spring } from "./primitives";

const Section = ({ title, children }) => (
  <div className="scroll-y flex-1 p-5">
    {title && <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">{title}</p>}
    {children}
  </div>
);

const Workspace = ({ panel, panelTitle, stage, inspector, inspectorTitle = "Inspector" }) => {
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState(false);

  return (
    <div className="relative flex min-h-0 flex-1">
      {/* panel: column on desktop, drawer on tablet */}
      {panel && (
        <>
          <aside className="glass hidden w-72 shrink-0 flex-col rounded-none border-y-0 border-l-0 lg:flex xl:w-80">
            <Section title={panelTitle}>{panel}</Section>
          </aside>
          <div className="flex w-12 shrink-0 flex-col items-center border-r border-white/[0.06] py-3 lg:hidden">
            <button type="button" onClick={() => setDrawer(true)} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-white/5 hover:text-white" aria-label={`Open ${panelTitle ?? "panel"}`}>
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>
          <AnimatePresence>
            {drawer && (
              <>
                <motion.div className="absolute inset-0 z-30 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
                <motion.aside
                  className="glass-strong absolute inset-y-0 left-0 z-40 flex w-[22rem] max-w-[85vw] flex-col lg:hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={spring}
                >
                  <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-3 rounded-lg p-2 text-[var(--text-2)] hover:bg-white/5" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                  <Section title={panelTitle}>{panel}</Section>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* stage */}
      <main className="scroll-y relative min-w-0 flex-1 p-4 md:p-6">{stage}</main>

      {/* inspector: column on wide screens, bottom sheet otherwise */}
      {inspector && (
        <>
          <aside className="glass hidden w-80 shrink-0 flex-col rounded-none border-y-0 border-r-0 xl:flex">
            <Section title={inspectorTitle}>{inspector}</Section>
          </aside>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="glass-strong absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white shadow-2xl xl:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> {inspectorTitle}
          </button>
          <AnimatePresence>
            {sheet && (
              <>
                <motion.div className="absolute inset-0 z-30 bg-black/50 xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
                <motion.section
                  role="dialog"
                  aria-label={inspectorTitle}
                  className="glass-strong absolute inset-x-0 bottom-0 z-40 flex max-h-[75%] flex-col rounded-t-3xl xl:hidden"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={spring}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={(_, info) => info.offset.y > 120 && setSheet(false)}
                >
                  <div className="flex justify-center pt-3">
                    <span className="h-1.5 w-12 rounded-full bg-white/20" aria-hidden="true" />
                  </div>
                  <Section title={inspectorTitle}>{inspector}</Section>
                </motion.section>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Workspace;
