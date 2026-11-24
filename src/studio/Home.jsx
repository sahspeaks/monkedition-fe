// Studio home: a bento hub with "New product", drafts to continue, the model
// library and running jobs.
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Layers, Loader2, Plus } from "lucide-react";
import { STEPS, firstBlocked } from "./steps";
import { useStudio } from "./context";
import ModelFigure from "./ui/ModelFigure";
import { Chip, KineticTitle, TiltCard } from "./ui/primitives";
import { Stagger, StaggerItem } from "./steps/common";
import { newDraft } from "./data/sample";

const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const Home = () => {
  const { drafts, setDrafts, modelSets } = useStudio();
  const navigate = useNavigate();

  const start = () => {
    const d = newDraft();
    setDrafts((all) => [d, ...all]);
    navigate(`/studio/d/${d.id}/design`);
  };
  const open = (d) => {
    const blocked = firstBlocked(d);
    navigate(`/studio/d/${d.id}/${STEPS[blocked === -1 ? STEPS.length - 1 : blocked].key}`);
  };

  return (
    <div className="scroll-y h-full">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-3)]">Design → model → colour → publish</p>
        <KineticTitle text="What are we launching today?" className="max-w-3xl text-4xl font-semibold leading-[1.05] text-white md:text-6xl" />
        <p className="mt-4 max-w-xl text-[var(--text-2)]">Turn a print file into a live product with model photos in every colour, in one flow.</p>

        <Stagger className="mt-10 grid auto-rows-[minmax(11rem,auto)] gap-4 md:grid-cols-4">
          <StaggerItem className="md:col-span-2 md:row-span-2">
            <TiltCard onClick={start} className="h-full" aria-label="New product">
              <div className="relative flex h-full min-h-[18rem] flex-col justify-between overflow-hidden p-7">
                <motion.div aria-hidden="true" className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-aurora opacity-30 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-aurora shadow-[0_10px_40px_-10px_rgba(255,92,138,0.8)]">
                  <Plus className="h-7 w-7 text-white" />
                </span>
                <div className="relative">
                  <h2 className="text-3xl font-semibold text-white">New product</h2>
                  <p className="mt-2 max-w-sm text-sm text-[var(--text-2)]">Start from a design file. 8 steps, from artwork to the shop.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white">
                    Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem className="md:col-span-2">
            <TiltCard onClick={() => drafts[0] && open(drafts[0])} className="h-full">
              <div className="flex h-full items-center gap-5 p-5">
                <div className="grid h-full grid-cols-3 gap-1.5">
                  {modelSets.slice(0, 3).map((m) => (
                    <ModelFigure key={m.id} angle="front" tee="#00b140" skin={m.skin} hair={m.hair} className="h-28 w-[4.4rem] rounded-xl" />
                  ))}
                </div>
                <div>
                  <p className="flex items-center gap-2 font-semibold text-white"><Layers className="h-4 w-4" /> Model library</p>
                  <p className="mt-1 text-sm text-[var(--text-2)]">{modelSets.length} model sets · opens inside any draft</p>
                </div>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <div className="glass flex h-full flex-col justify-between rounded-2xl p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-white"><Loader2 className="h-4 w-4 animate-spin text-[#ff5c8a]" /> Running jobs</p>
              <div>
                <p className="font-mono text-3xl text-white">1</p>
                <p className="text-xs text-[var(--text-3)]">Recolouring Kabir · street · 12 / 19</p>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="glass flex h-full flex-col justify-between rounded-2xl p-5">
              <p className="text-sm font-medium text-white">This week</p>
              <div>
                <p className="font-mono text-3xl text-aurora">7</p>
                <p className="text-xs text-[var(--text-3)]">products published</p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        {drafts.length > 0 && (
          <>
            <h3 className="mb-4 mt-12 text-sm font-medium uppercase tracking-[0.16em] text-[var(--text-3)]">Continue</h3>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((d) => {
                const blocked = firstBlocked(d);
                const at = blocked === -1 ? STEPS.length : blocked;
                return (
                  <StaggerItem key={d.id}>
                    <TiltCard onClick={() => open(d)}>
                      <div className="flex gap-4 p-4">
                        <div className="checker grid h-20 w-16 shrink-0 place-items-center rounded-xl">
                          {d.design.files.length ? <div className="h-10 w-8 rounded bg-aurora opacity-80" /> : <Plus className="h-5 w-5 text-[var(--text-3)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">{d.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-3)]">Edited {ago(d.updatedAt)}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full bg-aurora" style={{ width: `${(at / STEPS.length) * 100}%` }} />
                            </div>
                            <Chip>{at >= STEPS.length ? "Done" : `Step ${at + 1} / 8`}</Chip>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-3)] transition group-hover:text-white" />
                      </div>
                    </TiltCard>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
