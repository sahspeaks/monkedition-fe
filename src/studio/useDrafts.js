// Studio's drafts, kept in sync with the backend.
//  - Loads every draft once the person is signed in as staff.
//  - Saves a draft ~0.8 s after it stops changing; one save per draft at a
//    time, and a change made during a save is saved right after.
//  - If someone else saved first (409), their version replaces this one and
//    a notice says so.
//  - Imports drafts this browser kept before drafts moved to the backend.
import { useCallback, useEffect, useRef, useState } from "react";
import { errorText } from "../dashboard/api";
import { fetchDrafts, keepLocalDrafts, normalise, putDraft, readLocalDrafts, removeDraft } from "./draftStore";

const DEBOUNCE = 800;

export const useDrafts = (enabled) => {
  const [drafts, setDraftsState] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState({}); // id -> { state: "saving" | "saved" | "error", error }
  const [notice, setNotice] = useState("");

  const versions = useRef({}); // id -> server version (0 = not saved yet)
  const known = useRef({}); // id -> the draft object last saved or loaded
  const timers = useRef({});
  const inFlight = useRef({});
  const latest = useRef([]);
  latest.current = drafts;

  const markSave = (id, state, error = "") => setSaveState((s) => ({ ...s, [id]: { state, error } }));

  const save = useCallback(async (id) => {
    if (inFlight.current[id]) {
      inFlight.current[id].again = true;
      return;
    }
    const draft = latest.current.find((d) => d.id === id);
    if (!draft || known.current[id] === draft) return;
    inFlight.current[id] = { again: false };
    markSave(id, "saving");
    try {
      versions.current[id] = await putDraft(draft, versions.current[id] ?? 0);
      known.current[id] = draft;
      markSave(id, "saved");
    } catch (err) {
      const theirs = err?.status === 409 && err.body?.errors;
      if (theirs?.data) {
        // someone else saved first: take their version
        const draftFromServer = normalise({ ...theirs.data, id });
        versions.current[id] = theirs.version;
        known.current[id] = draftFromServer;
        setDraftsState((all) => all.map((d) => (d.id === id ? draftFromServer : d)));
        setNotice(`“${draftFromServer.name}” was changed by someone else; you're now seeing their version.`);
        markSave(id, "saved");
      } else {
        markSave(id, "error", errorText(err));
      }
    } finally {
      const again = inFlight.current[id]?.again;
      delete inFlight.current[id];
      if (again) save(id);
    }
  }, []);

  // any draft that differs from what the server has is saved after a pause
  useEffect(() => {
    if (status !== "ready") return;
    for (const d of drafts) {
      if (known.current[d.id] === d) continue;
      clearTimeout(timers.current[d.id]);
      markSave(d.id, "saving");
      timers.current[d.id] = setTimeout(() => save(d.id), DEBOUNCE);
    }
  }, [drafts, status, save]);

  const load = useCallback(async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const rows = await fetchDrafts();
      const list = rows.map((r) => r.draft);
      rows.forEach(({ draft, version }) => {
        versions.current[draft.id] = version;
        known.current[draft.id] = draft;
      });
      // one-time import of drafts this browser kept before
      const local = readLocalDrafts().filter((d) => !versions.current[d.id]);
      const failed = [];
      for (const d of local) {
        try {
          versions.current[d.id] = await putDraft(d, 0);
          known.current[d.id] = d;
          list.push(d);
        } catch {
          failed.push(d);
        }
      }
      if (local.length || !failed.length) keepLocalDrafts(failed);
      if (local.length - failed.length > 0) setNotice(`${local.length - failed.length} draft${local.length - failed.length > 1 ? "s" : ""} from this browser moved to the shared drafts.`);
      setDraftsState(list.sort((a, b) => b.updatedAt - a.updatedAt));
      setStatus("ready");
    } catch (err) {
      setLoadError(errorText(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const deleteDraft = useCallback(async (id) => {
    clearTimeout(timers.current[id]);
    if (versions.current[id]) await removeDraft(id);
    delete versions.current[id];
    delete known.current[id];
    setDraftsState((all) => all.filter((d) => d.id !== id));
  }, []);

  // save anything pending before the page closes
  useEffect(() => {
    const flush = () => Object.keys(timers.current).forEach((id) => (clearTimeout(timers.current[id]), save(id)));
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [save]);

  return { drafts, setDrafts: setDraftsState, status, loadError, reload: load, saveState, deleteDraft, notice, dismissNotice: () => setNotice("") };
};
