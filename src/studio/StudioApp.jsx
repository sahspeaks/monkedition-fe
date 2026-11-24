// Monk Studio: a full-screen app at /studio for staff, from design file to
// published product. This round: the drafts list and the stepper, with
// placeholder steps; drafts live in localStorage, the model library in the
// backend (built-in sets ship in public/). See docs/STUDIO_PLAN.md.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/NewAuthContext";
import { StudioContext } from "./context";
import Wizard from "./Wizard";
import Drafts from "./Drafts";
import { loadDrafts, saveDrafts } from "./draftStore";
import { BUILTIN_SETS, deleteModelSet, fetchModelSets } from "./modelStore";
import { errorText } from "../dashboard/api";
import { useTheme } from "./useTheme";
import { Wordmark } from "./ui/Shell";
import "./theme.css";

const STAFF_ROLES = ["ADMIN", "OPS"];

const Gate = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !user.roles?.some((r) => STAFF_ROLES.includes(r))) {
    return (
      <div className="grid h-full place-items-center text-center">
        <div>
          <Wordmark />
          <p className="mt-4 text-[var(--text-2)]">{user ? "This account is not staff." : "Sign in with a staff account to open Studio."}</p>
          {!user && (
            <Link to="/login?returnTo=/studio" className="label mt-6 inline-flex h-10 items-center rounded-md bg-[var(--accent)] px-4 text-[var(--accent-ink)]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    );
  }
  return children;
};

const StudioApp = () => {
  const [drafts, setDrafts] = useState(loadDrafts);
  const { theme, toggle: toggleTheme } = useTheme();

  const { user } = useAuth();
  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r)));
  // the model library: built-in sets + the ones saved in the database
  const [library, setLibrary] = useState({ status: "loading", sets: [], error: "" });
  const reloadLibrary = useCallback(async () => {
    setLibrary((l) => ({ ...l, status: "loading", error: "" }));
    try {
      setLibrary({ status: "ready", sets: await fetchModelSets(), error: "" });
    } catch (err) {
      setLibrary((l) => ({ ...l, status: "error", error: errorText(err) }));
    }
  }, []);
  useEffect(() => {
    if (isStaff) reloadLibrary();
  }, [isStaff, reloadLibrary]);
  const modelSets = useMemo(() => [...BUILTIN_SETS, ...library.sets], [library.sets]);
  const addModelSet = useCallback((set) => setLibrary((l) => ({ ...l, sets: [set, ...l.sets.filter((s) => s.id !== set.id)] })), []);
  const removeModelSet = useCallback(async (id) => {
    await deleteModelSet(id);
    setLibrary((l) => ({ ...l, sets: l.sets.filter((s) => s.id !== id) }));
  }, []);

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    const prev = document.title;
    document.title = "Monk Studio";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <StudioContext.Provider value={{ drafts, setDrafts, modelSets, libraryStatus: library.status, libraryError: library.error, reloadLibrary, addModelSet, removeModelSet, theme, toggleTheme }}>
      <div id="studio-root" className="studio" data-theme={theme}>
        <Gate>
          <Routes>
            {/* drafts first; with none, Drafts opens a new untitled product */}
            <Route index element={<Drafts />} />
            <Route path="d/:draftId/:stepKey" element={<Wizard />} />
            <Route path="*" element={<Navigate to="/studio" replace />} />
          </Routes>
        </Gate>
      </div>
    </StudioContext.Provider>
  );
};

export default StudioApp;
