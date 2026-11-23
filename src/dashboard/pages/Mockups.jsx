// Mockups: put print designs onto model/colour photos and export them in bulk.
// The compositing runs in the mockups service (monkedition-mockups); this page
// is its UI. Each tab is one photo with its own designs, print box and sliders.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw, RotateCw } from "lucide-react";
import { Button, Card, Field, Input, Notice, Page, Select } from "../ui";
import { errorText } from "../api";
import { downloadBlob, mockupsApi } from "../mockups/api";
import * as G from "../mockups/geometry";
import PlacementCanvas from "../mockups/PlacementCanvas";
import TabBar from "../mockups/TabBar";
import { isReady } from "../mockups/tabs";
import DesignList from "../mockups/DesignList";

const MAX_DESIGNS = 20;
const DRAFT_SIDE = 900; // px, longest side of the renders shown while dragging
const SHARP_SIDE = 1600; // px, once the box stays still
const DEFAULT_PARAMS = { fold: 0.9, shadow: 1.1, opacity: 0.95, mask: 1 };
const SLIDERS = [
  { key: "fold", label: "Fold strength", min: 0, max: 2, step: 0.05 },
  { key: "shadow", label: "Shadow", min: 0, max: 2, step: 0.05 },
  { key: "opacity", label: "Opacity", min: 0.3, max: 1, step: 0.02 },
  { key: "mask", label: "Mask tightness", min: 0, max: 1, step: 0.05 },
];

let nextKey = 1;
const newTab = (number) => ({
  key: nextKey++,
  name: `Tab ${number}`,
  named: false, // true once the name was typed or taken from a photo
  photo: null, // { id, width, height, quadFront, quadBack }
  placement: { quad: null, preset: "front_large", fit: "contain", anchor: "top" },
  params: { ...DEFAULT_PARAMS },
  designs: [], // { id, name, code, defaultPreset, thumb }
  overrides: {}, // designId -> placement used only for that design
  previewId: null,
  pending: null, // boxes as fractions of the photo, applied when a photo arrives
});

const baseName = (file) => file.name.replace(/\.[^.]+$/, "");
const pickParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([key, value]) => key in DEFAULT_PARAMS && value != null).map(([k, v]) => [k, Number(v)]));
const typing = () => ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName);

/** Which box edits apply to: the previewed design's own box if it has one, else the tab's. */
const editTarget = (tab) => (tab?.previewId && tab.overrides[tab.previewId] ? tab.previewId : null);
const activePlacement = (tab) => (editTarget(tab) ? tab.overrides[tab.previewId] : tab?.placement);
const withPlacement = (tab, designId, update) =>
  designId && tab.overrides[designId]
    ? { ...tab, overrides: { ...tab.overrides, [designId]: update(tab.overrides[designId]) } }
    : { ...tab, placement: update(tab.placement) };

const loadImage = (blob) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not show the photo"));
    image.src = URL.createObjectURL(blob);
  });

const Mockups = () => {
  const [tabs, setTabs] = useState(() => [newTab(1)]);
  const [activeKey, setActiveKey] = useState(tabs[0].key);
  const [presets, setPresets] = useState([]);
  const [images, setImages] = useState({}); // photo id -> HTMLImageElement
  const [freeMode, setFreeMode] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState({ url: null, photoId: null, note: "" });
  const [previewImage, setPreviewImage] = useState(null); // { image, photoId }
  const [showBox, setShowBox] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [format, setFormat] = useState("png");
  const [bulk, setBulk] = useState(null); // { done, total, current, errors, state }

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const urlsRef = useRef(new Set()); // object URLs to revoke on leave
  const renderSeq = useRef(0);
  const alive = useRef(true);

  const tab = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  const placement = activePlacement(tab);
  const customBox = Boolean(editTarget(tab));
  const previewDesign = tab.designs.find((d) => d.id === tab.previewId);
  const currentPreset = presets.find((p) => p.id === placement.preset);

  const track = (url) => {
    urlsRef.current.add(url);
    return url;
  };
  useEffect(() => {
    alive.current = true; // StrictMode mounts, unmounts and mounts again in development
    const urls = urlsRef.current;
    return () => {
      alive.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const updateTab = useCallback((key, update) => setTabs((all) => all.map((t) => (t.key === key ? update(t) : t))), []);
  const getTab = (key) => tabsRef.current.find((t) => t.key === key);
  const fail = (err) => setError(errorText(err));

  // ---- presets ----
  const loadPresets = useCallback(async () => {
    try {
      setPresets(await mockupsApi.presets());
    } catch (err) {
      fail(err);
    }
  }, []);
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  /** Sets the box from a preset, on the tab default or on one design's own box. */
  const applyPreset = async (key, presetId, photo, designId = null) => {
    try {
      const result = await mockupsApi.presetQuad(presetId, { mockup_id: photo.id, fit: "stretch" });
      updateTab(key, (t) => ({
        ...withPlacement(t, designId, (pl) => ({
          ...pl,
          quad: result.quad,
          preset: presetId,
          anchor: result.anchor === "center" ? "center" : "top",
        })),
        params: { ...t.params, ...pickParams(result.params) },
      }));
    } catch (err) {
      fail(err);
    }
  };

  // ---- photos ----
  const loadPhoto = async (key, file) => {
    const before = getTab(key);
    // Replacing a photo keeps the boxes, as fractions of the photo.
    let pending = before.pending;
    if (before.photo && before.placement.quad) {
      const { width, height } = before.photo;
      pending = {
        quad: G.toFraction(before.placement.quad, width, height),
        overrides: Object.fromEntries(
          Object.entries(before.overrides).map(([id, o]) => [id, { ...o, quad: G.toFraction(o.quad, width, height) }]),
        ),
      };
    }
    const uploaded = await mockupsApi.uploadPhoto(file);
    const image = await loadImage(await mockupsApi.photo(uploaded.id));
    track(image.src);
    setImages((all) => ({ ...all, [uploaded.id]: image }));
    const photo = {
      id: uploaded.id,
      width: uploaded.width,
      height: uploaded.height,
      quadFront: uploaded.quad_front,
      quadBack: uploaded.quad_back,
    };
    const { width, height } = photo;
    updateTab(key, (t) => ({
      ...t,
      photo,
      name: t.named ? t.name : baseName(file),
      named: true,
      pending: null,
      placement: { ...t.placement, quad: pending?.quad ? G.fromFraction(pending.quad, width, height) : null },
      overrides: pending?.overrides
        ? Object.fromEntries(
            Object.entries(pending.overrides).map(([id, o]) => [id, { ...o, quad: G.fromFraction(o.quad, width, height) }]),
          )
        : t.overrides,
    }));
    if (!pending?.quad) await applyPreset(key, before.placement.preset, photo);
  };

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setStatus(`Uploading ${file.name}…`);
    try {
      await loadPhoto(tab.key, file);
    } catch (err) {
      fail(err);
    } finally {
      setStatus("");
    }
  };

  const onPhotosAsTabs = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;
    setError("");
    let firstKey = null;
    for (const file of files) {
      let key;
      if (!getTab(tab.key).photo && firstKey === null) {
        key = tab.key;
      } else {
        const created = { ...newTab(tabsRef.current.length + 1), name: baseName(file), named: true };
        tabsRef.current = [...tabsRef.current, created]; // so loadPhoto can find it before the next render
        setTabs((all) => [...all, created]);
        key = created.key;
      }
      firstKey ??= key;
      setStatus(`Uploading ${file.name}…`);
      try {
        await loadPhoto(key, file);
      } catch (err) {
        fail(err);
      }
    }
    setStatus("");
    setActiveKey(firstKey);
  };

  // ---- tabs ----
  const addTab = () => {
    const created = newTab(tabs.length + 1);
    setTabs((all) => [...all, created]);
    setActiveKey(created.key);
  };

  const duplicateTab = () => {
    const created = {
      ...newTab(tabs.length + 1),
      name: `${tab.name} copy`,
      named: true,
      photo: tab.photo,
      placement: { ...tab.placement, quad: tab.placement.quad && G.clone(tab.placement.quad) },
      params: { ...tab.params },
    };
    setTabs((all) => [...all, created]);
    setActiveKey(created.key);
  };

  const closeTab = (key) => {
    const closing = tabs.find((t) => t.key === key);
    if (!window.confirm(tabs.length === 1 ? "Clear this tab?" : `Close “${closing.name}”?`)) return;
    if (tabs.length === 1) {
      const fresh = newTab(1);
      setTabs([fresh]);
      setActiveKey(fresh.key);
      return;
    }
    const index = tabs.findIndex((t) => t.key === key);
    const rest = tabs.filter((t) => t.key !== key);
    setTabs(rest);
    if (key === activeKey) setActiveKey(rest[Math.max(0, index - 1)].key);
  };

  // ---- designs ----
  const onDesigns = async (event) => {
    let files = [...(event.target.files ?? [])].filter((f) => !f.name.startsWith("."));
    event.target.value = "";
    if (!files.length) return;
    const key = tab.key;
    const room = MAX_DESIGNS - tab.designs.length;
    setError("");
    if (files.length > room) {
      setError(`A tab holds up to ${MAX_DESIGNS} designs. Added the first ${Math.max(room, 0)} of ${files.length}.`);
      files = files.slice(0, Math.max(room, 0));
    }
    if (!files.length) return;
    setStatus(`Uploading ${files.length} design${files.length > 1 ? "s" : ""}…`);
    try {
      const results = await mockupsApi.uploadDesigns(files);
      const failed = results.filter((r) => r.error).map((r) => `${r.name}: ${r.error}`);
      if (failed.length) setError(failed.join("\n"));
      const added = results
        .map((r, i) => !r.error && { id: r.id, name: r.name, code: r.code, defaultPreset: r.default_preset, thumb: track(URL.createObjectURL(files[i])) })
        .filter(Boolean);
      const wasEmpty = !getTab(key).designs.length;
      updateTab(key, (t) => ({ ...t, designs: [...t.designs, ...added], previewId: t.previewId ?? added[0]?.id ?? null }));
      // First designs in a tab: use the preset their file name asks for (FR / BK / LP).
      const photo = getTab(key).photo;
      if (wasEmpty && photo && added[0]?.code) await applyPreset(key, added[0].defaultPreset, photo);
    } catch (err) {
      fail(err);
    } finally {
      setStatus("");
    }
  };

  const removeDesign = (id) =>
    updateTab(tab.key, (t) => {
      const designs = t.designs.filter((d) => d.id !== id);
      const overrides = { ...t.overrides };
      delete overrides[id];
      return { ...t, designs, overrides, previewId: t.previewId === id ? (designs[0]?.id ?? null) : t.previewId };
    });

  const toggleCustomBox = () => {
    if (!tab.previewId || !tab.placement.quad) return;
    if (customBox) {
      if (!window.confirm("Remove this design's own box and use the tab's box?")) return;
      updateTab(tab.key, (t) => {
        const overrides = { ...t.overrides };
        delete overrides[t.previewId];
        return { ...t, overrides };
      });
    } else {
      updateTab(tab.key, (t) => ({
        ...t,
        overrides: { ...t.overrides, [t.previewId]: { ...t.placement, quad: G.clone(t.placement.quad) } },
      }));
    }
  };

  // ---- box edits ----
  const setQuad = useCallback(
    (quadOrUpdate) =>
      updateTab(activeKey, (t) =>
        withPlacement(t, editTarget(t), (pl) =>
          pl.quad ? { ...pl, quad: typeof quadOrUpdate === "function" ? quadOrUpdate(pl.quad) : quadOrUpdate } : pl,
        ),
      ),
    [activeKey, updateTab],
  );
  const setPlacementField = (field, value) => updateTab(tab.key, (t) => withPlacement(t, editTarget(t), (pl) => ({ ...pl, [field]: value })));
  const setParam = (key, value) => updateTab(tab.key, (t) => ({ ...t, params: { ...t.params, [key]: value } }));

  useEffect(() => {
    const onKey = (event) => {
      if (typing()) return;
      const step = event.shiftKey ? 10 : 2;
      const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key];
      if (arrows) {
        event.preventDefault();
        setQuad((q) => G.move(q, arrows[0] * step, arrows[1] * step));
      } else if (event.key === "+" || event.key === "=") setQuad((q) => G.scale(q, 1.03));
      else if (event.key === "-" || event.key === "_") setQuad((q) => G.scale(q, 1 / 1.03));
      else if (event.code === "BracketLeft" || event.code === "BracketRight") {
        event.preventDefault();
        setQuad((q) => G.rotate(q, (event.code === "BracketLeft" ? -1 : 1) * (event.shiftKey ? 5 : 1)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setQuad]);

  // ---- live preview ----
  // Every change asks for a fast draft right away (one request at a time, always
  // the newest box), then a sharper render once things stay still. Both are drawn
  // in the placement canvas under the box.
  const bodyFor = (t, pl, quad = pl.quad) => ({
    mockup_id: t.photo.id,
    design_id: t.previewId,
    quad,
    fit: pl.fit,
    anchor: pl.anchor === "center" ? "center" : "top",
    params: t.params,
  });
  const latest = useRef(null);
  latest.current = { tab, placement };
  const drafts = useRef({ busy: false, next: null });

  const showRender = (blob, photoId) => setPreview({ url: URL.createObjectURL(blob), photoId, note: "" });

  const requestDraft = useCallback(async (body) => {
    const queue = drafts.current;
    queue.next = body;
    if (queue.busy) return;
    queue.busy = true;
    while (queue.next) {
      const next = queue.next;
      queue.next = null;
      const mine = ++renderSeq.current;
      try {
        const blob = await mockupsApi.render({ ...next, max_side: DRAFT_SIDE, format: "jpg" });
        if (mine === renderSeq.current && alive.current) showRender(blob, next.mockup_id);
      } catch (err) {
        if (mine === renderSeq.current && alive.current) setPreview((p) => ({ ...p, note: errorText(err) }));
      }
    }
    queue.busy = false;
  }, []);

  const onDrag = useCallback(
    (quad) => {
      const { tab: t, placement: pl } = latest.current;
      if (t.photo && t.previewId) requestDraft(bodyFor(t, pl, quad));
    },
    [requestDraft],
  );

  const renderKey = JSON.stringify([tab.photo?.id, tab.previewId, placement, tab.params]);
  useEffect(() => {
    if (!tab.photo || !placement.quad || !tab.previewId) {
      setPreview({ url: null, photoId: null, note: "" });
      return undefined;
    }
    const body = bodyFor(tab, placement);
    requestDraft(body);
    const timer = setTimeout(async () => {
      const mine = ++renderSeq.current;
      try {
        const blob = await mockupsApi.render({ ...body, max_side: SHARP_SIDE, format: "jpg" });
        if (mine === renderSeq.current && alive.current) showRender(blob, body.mockup_id);
      } catch (err) {
        if (mine === renderSeq.current && alive.current) setPreview((p) => ({ ...p, note: errorText(err) }));
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  // Decode each render, then free its blob URL: the decoded image is all the canvas needs.
  useEffect(() => {
    if (!preview.url) {
      setPreviewImage(null);
      return undefined;
    }
    let current = true;
    const { url, photoId } = preview;
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (current) setPreviewImage({ image, photoId });
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    return () => {
      current = false;
    };
  }, [preview]);

  const [exporting, setExporting] = useState(false);
  const exportPreview = async () => {
    setExporting(true);
    try {
      downloadBlob(await mockupsApi.render(bodyFor(tab, placement)), `${tab.name || "preview"}.png`);
    } catch (err) {
      fail(err);
    } finally {
      setExporting(false);
    }
  };

  // ---- presets: save / delete ----
  const savePreset = async () => {
    const name = presetName.trim();
    if (!tab.photo || !placement.quad || !name) return;
    try {
      const saved = await mockupsApi.savePreset({
        mockup_id: tab.photo.id,
        name,
        side: currentPreset?.side ?? "front",
        quad: placement.quad,
        params: tab.params,
      });
      setPresetName("");
      await loadPresets();
      setPlacementField("preset", saved.id);
    } catch (err) {
      fail(err);
    }
  };

  const deletePreset = async () => {
    if (!currentPreset || currentPreset.builtin) return;
    if (!window.confirm(`Delete preset “${currentPreset.label}”?`)) return;
    try {
      await mockupsApi.deletePreset(currentPreset.id);
      await loadPresets();
      if (tab.photo) await applyPreset(tab.key, "front_large", tab.photo, editTarget(tab));
      else setPlacementField("preset", "front_large");
    } catch (err) {
      fail(err);
    }
  };

  const onPresetChange = (presetId) => {
    if (tab.photo) applyPreset(tab.key, presetId, tab.photo, editTarget(tab));
    else setPlacementField("preset", presetId);
  };

  const saveCalibration = () => {
    const data = {
      name: tab.name,
      width: tab.photo?.width,
      height: tab.photo?.height,
      ...tab.placement,
      ...tab.params,
      design_overrides: Object.fromEntries(
        Object.entries(tab.overrides).map(([id, o]) => [tab.designs.find((d) => d.id === id)?.name ?? id, o]),
      ),
    };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${tab.name || "calibration"}.json`);
  };

  // ---- bulk ----
  const ready = tabs.filter(isReady);
  const imageCount = ready.reduce((n, t) => n + t.designs.length, 0);
  const skipped = tabs.filter((t) => !isReady(t) && (t.photo || t.designs.length)).length;
  const running = bulk?.state === "running";

  const startBulk = async () => {
    setError("");
    setBulk({ state: "running", done: 0, total: imageCount, current: "Starting…", errors: [] });
    try {
      const job = await mockupsApi.startBulk({
        format,
        tabs: ready.map((t) => ({
          name: t.name || "Untitled",
          mockup_id: t.photo.id,
          quad: t.placement.quad,
          fit: t.placement.fit,
          anchor: t.placement.anchor === "center" ? "center" : "top",
          params: t.params,
          design_ids: t.designs.map((d) => d.id),
          overrides: Object.fromEntries(
            Object.entries(t.overrides)
              .filter(([id]) => t.designs.some((d) => d.id === id))
              .map(([id, o]) => [id, { quad: o.quad, fit: o.fit, anchor: o.anchor === "center" ? "center" : "top" }]),
          ),
        })),
      });
      let state;
      do {
        await new Promise((resolve) => setTimeout(resolve, 700));
        if (!alive.current) return;
        state = await mockupsApi.bulkStatus(job.id);
        setBulk(state);
      } while (state.state === "running");
      if (state.ready) {
        setBulk({ ...state, current: "Downloading ZIP…" });
        downloadBlob(await mockupsApi.bulkZip(job.id), `monkedition_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`);
      }
      setBulk({ ...state, current: "" });
    } catch (err) {
      setBulk(null);
      fail(err);
    }
  };

  const photoImage = tab.photo && images[tab.photo.id];
  // Show the composite once there is one for this photo, otherwise the bare photo.
  const canvasImage = tab.previewId && previewImage?.photoId === tab.photo?.id ? previewImage.image : photoImage;
  const groupedPresets = useMemo(
    () => [
      ["Front", presets.filter((p) => p.side === "front")],
      ["Back", presets.filter((p) => p.side === "back")],
    ],
    [presets],
  );

  return (
    <Page title="Mockups" subtitle="Put designs on model photos and export them in bulk. Each tab is one photo.">
      <Notice>{error}</Notice>
      <TabBar tabs={tabs} activeKey={tab.key} onSelect={setActiveKey} onClose={closeTab} onAdd={addTab} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ---- controls ---- */}
        <div className="space-y-4">
          <Card title="Photo">
            <Field label="Tab name">
              <Input
                value={tab.name}
                placeholder="e.g. Men-M1-Black"
                onChange={(e) => updateTab(tab.key, (t) => ({ ...t, name: e.target.value, named: true }))}
              />
            </Field>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-orange-400">
              <input type="file" accept="image/*" hidden onChange={onPhoto} />
              <ImagePlus className="h-4 w-4" />
              {tab.photo ? "Replace model photo" : "Add model photo"}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">
                Photos as tabs
                <input type="file" accept="image/*" multiple hidden onChange={onPhotosAsTabs} />
              </label>
              <Button onClick={duplicateTab} title="New tab with this tab's photo, box and settings, but no designs">
                Duplicate tab
              </Button>
            </div>
            {status && <p className="mt-2 text-xs text-gray-500">{status}</p>}
          </Card>

          <Card title={`Designs · ${tab.designs.length} / ${MAX_DESIGNS}`}>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-orange-400">
              <input type="file" accept="image/png,image/*" multiple hidden onChange={onDesigns} />+ Add designs (PNG, up to {MAX_DESIGNS})
            </label>
            <DesignList
              designs={tab.designs}
              previewId={tab.previewId}
              overrides={tab.overrides}
              onPreview={(id) => updateTab(tab.key, (t) => ({ ...t, previewId: id }))}
              onRemove={removeDesign}
            />
            <p className="mt-2 text-xs text-gray-500">These designs render only on this tab&apos;s photo.</p>
          </Card>

          <Card title="Placement">
            <Field label="Preset" hint={previewDesign?.code ? `File code: ${previewDesign.code}` : undefined}>
              <Select value={placement.preset} onChange={(e) => onPresetChange(e.target.value)}>
                {groupedPresets.map(([label, items]) =>
                  items.length ? (
                    <optgroup key={label} label={label}>
                      {items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                          {p.code ? ` [${p.code}]` : ""}
                          {p.builtin ? "" : " ★"}
                        </option>
                      ))}
                    </optgroup>
                  ) : null,
                )}
              </Select>
            </Field>
            <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300 text-sm">
              {[
                ["contain", "Keep aspect"],
                ["stretch", "Stretch to box"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={placement.fit === value}
                  onClick={() => setPlacementField("fit", value)}
                  className={`py-2 ${placement.fit === value ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button disabled={!tab.photo || !placement.quad} onClick={() => setQuad(G.clone(tab.photo.quadFront))}>
                Auto front
              </Button>
              <Button disabled={!tab.photo || !placement.quad} onClick={() => setQuad(G.clone(tab.photo.quadBack))}>
                Auto back
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Name this box…"
                aria-label="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <Button disabled={!tab.photo || !presetName.trim()} onClick={savePreset}>
                Save preset
              </Button>
            </div>
            {currentPreset && !currentPreset.builtin && (
              <Button variant="danger" className="mt-2 w-full" onClick={deletePreset}>
                Delete this custom preset
              </Button>
            )}
          </Card>

          <Card title="Tune">
            {SLIDERS.map(({ key, label, min, max, step }) => (
              <label key={key} className="mb-3 block text-sm text-gray-700">
                <span className="flex justify-between">
                  {label} <b className="font-medium text-gray-900">{Number(tab.params[key]).toFixed(2)}</b>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={tab.params[key]}
                  onChange={(e) => setParam(key, Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={!tab.photo || !placement.quad || !tab.previewId || exporting} onClick={exportPreview} title="Full-size PNG of the selected design">
                <Download className="mr-1 inline h-4 w-4" />
                Preview PNG
              </Button>
              <Button disabled={!placement.quad} onClick={saveCalibration}>
                Save calibration
              </Button>
            </div>
          </Card>

          <Card title="Bulk render">
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300 text-sm">
              {[
                ["png", "PNG (best)"],
                ["jpg", "JPG 98%"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={format === value}
                  onClick={() => setFormat(value)}
                  className={`py-2 ${format === value ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="accent" className="mt-3 w-full" disabled={!ready.length || running} onClick={startBulk}>
              {ready.length
                ? `Render ${ready.length} tab${ready.length > 1 ? "s" : ""} · ${imageCount} image${imageCount > 1 ? "s" : ""} → ZIP`
                : "Render all → ZIP"}
            </Button>
            {bulk && (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded bg-gray-100">
                  <div className="h-full bg-orange-400 transition-all" style={{ width: `${bulk.total ? (100 * bulk.done) / bulk.total : 0}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {bulk.state === "done" && !bulk.current
                    ? `Done: ${bulk.total - bulk.errors.length} image${bulk.total - bulk.errors.length === 1 ? "" : "s"}.`
                    : `${bulk.done} / ${bulk.total}${bulk.current ? ` · ${bulk.current}` : ""}`}
                </p>
                {bulk.errors.length > 0 && (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-red-700">
                    {bulk.errors.length} failed:{"\n"}
                    {bulk.errors.slice(0, 5).join("\n")}
                  </p>
                )}
              </>
            )}
            {!bulk && (
              <p className="mt-2 text-xs text-gray-500">
                {skipped
                  ? `${skipped} tab${skipped > 1 ? "s" : ""} skipped: each needs a photo and at least one design.`
                  : ready.length
                    ? "Each tab renders only its own designs."
                    : "Add a model photo and some designs to start."}
              </p>
            )}
          </Card>
        </div>

        {/* ---- placement canvas ---- */}
        <Card
          title={
            <span className="flex items-center gap-2">
              Placement
              <span className={`text-xs font-normal ${customBox ? "text-orange-700" : "text-gray-500"}`}>
                {customBox ? `Own box for “${previewDesign?.name}”` : "Tab box"}
              </span>
              {preview.note && <span className="text-xs font-normal text-gray-500">· {preview.note}</span>}
            </span>
          }
          actions={
            <Button className="py-1" disabled={!previewDesign || !tab.placement.quad} onClick={toggleCustomBox} aria-pressed={customBox}>
              {customBox ? "Use tab box" : "Own box for this design"}
            </Button>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {[
              ["←", -1, 0],
              ["↑", 0, -1],
              ["↓", 0, 1],
              ["→", 1, 0],
            ].map(([label, dx, dy]) => (
              <Button key={label} className="px-2.5 py-1" disabled={!placement.quad} aria-label={`Move ${label}`} onClick={(e) => setQuad((q) => G.move(q, dx * (e.shiftKey ? 50 : 10), dy * (e.shiftKey ? 50 : 10)))}>
                {label}
              </Button>
            ))}
            <Button className="px-2.5 py-1" disabled={!placement.quad} aria-label="Smaller" onClick={() => setQuad((q) => G.scale(q, 0.95))}>
              −
            </Button>
            <Button className="px-2.5 py-1" disabled={!placement.quad} aria-label="Bigger" onClick={() => setQuad((q) => G.scale(q, 1.05))}>
              +
            </Button>
            <Button className="px-2.5 py-1" disabled={!placement.quad} aria-label="Rotate anticlockwise" onClick={(e) => setQuad((q) => G.rotate(q, e.shiftKey ? -5 : -1))}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button className="px-2.5 py-1" disabled={!placement.quad} aria-label="Rotate clockwise" onClick={(e) => setQuad((q) => G.rotate(q, e.shiftKey ? 5 : 1))}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <span className="px-1 text-xs text-gray-500">{placement.quad ? `${G.angle(placement.quad).toFixed(1)}°` : ""}</span>
            <Button className="px-2.5 py-1" disabled={!placement.quad} onClick={() => setQuad((q) => G.rotate(q, -G.angle(q)))}>
              Straighten
            </Button>
            <Button className="px-2.5 py-1" aria-pressed={freeMode} onClick={() => setFreeMode((v) => !v)} title="Corners keep proportions, or reshape freely (or hold Alt/Option while dragging)">
              {freeMode ? "Free reshape" : "Keep proportions"}
            </Button>
            <Button className="px-2.5 py-1" aria-pressed={!showBox} disabled={!placement.quad} onClick={() => setShowBox((v) => !v)} title="Hide the box to see the result clean">
              {showBox ? "Hide box" : "Show box"}
            </Button>
          </div>
          {photoImage ? (
            <PlacementCanvas
              image={canvasImage}
              width={tab.photo.width}
              height={tab.photo.height}
              quad={placement.quad}
              custom={customBox}
              freeMode={freeMode}
              showBox={showBox}
              onDrag={onDrag}
              onCommit={setQuad}
            />
          ) : (
            <p className="rounded-lg border-2 border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">Add a model photo for this tab.</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            The photo shows the selected design as it will print. Green box = print zone ({placement.fit === "contain" ? "each design is fitted inside without stretching" : "designs fill the box"}). Shortcuts: arrows move
            (Shift ×5), + / − resize, [ / ] rotate. Shift while rotating snaps to 15°.
          </p>
        </Card>
      </div>
    </Page>
  );
};

export default Mockups;
