# Monkedition Studio: design to published product in one tab

**Status:** plan, not started · **Date:** 2026-11-24 · **Projects:** monkedition-fe, monkedition-be, monkedition-mockups

## 1. Goal

Today, turning a design into a product takes many manual steps: shoot or find
model photos for every colour, place the design on each one, export, upload to
Cloudinary, then fill in the product editor. This plan replaces that with
**one new dashboard tab, "Studio"**, that runs the whole path in one go:

```
Design ─► Models & angles ─► Colours ─► Placement ─► Render & review ─► Product details ─► Qikink SKUs ─► Publish
```

The work that makes this fast:

1. **Model photos are generated once and reused.** A *model set* is one person
   in one outfit, shot from 5–6 angles with Gemini, saved to Cloudinary, kept in
   a library.
2. **Colours cost nothing.** Every angle is generated once in a chroma-green tee
   and recoloured locally into any palette colour. One AI call per angle, not one
   per colour, and every colour lines up pixel for pixel with its base.
3. **Placement is set once.** Each angle of a model set has a saved print box
   that works for every colour. A new design needs no box editing.
4. **Front/back matching is automatic.** `FR`/`LP` designs go on front angles,
   `BK` designs on back angles.
5. **The product is created and published from the same screen**, with the
   rendered images already attached per colour.

## 2. Decisions

| Topic | Decision |
|---|---|
| Storage | **Cloudinary** (the backend already signs uploads) |
| AI | **Gemini** image model, key only on the mockups server. Model set by `GEMINI_IMAGE_MODEL` (Pro for consistency, Flash for cost) |
| Garments | **Oversized tees** only, for now |
| Angles and prompts | **In code**: `monkedition-mockups/studio/catalog.py`. No database |
| Colour palette | **The backend's existing list**: `monkedition-be/src/modules/catalog/domain/colours.js` (Qikink codes + hex). One source for the shop, Qikink SKUs and recolouring |
| Angles | All 6, at least 5 per set |
| Base garment | **Chroma green** (`#00B140`): cuts out cleanly from skin, shorts and a grey backdrop |
| UI | **One new dashboard tab, "Studio"**, which replaces the current Mockups tab. It opens a **full-screen app at `/studio`** with its own layout |
| Look | **Dark theme**, its **own identity ("Monk Studio")**, motion and 3D in the current style of leading product sites. Not the dashboard's look (see §4) |
| 3D | **A 3D tee viewer** for live previews. No model file exists yet; see §4.6 |
| Devices | **Desktop, laptop and tablet** (768 px and wider), mouse and touch |

### Angles

| Key | Angle | Takes designs |
|---|---|---|
| `front` | Front | FR, LP |
| `front_45` | Front 45° | FR, LP |
| `side` | Side | none (shows the fit) |
| `back` | Back | BK |
| `rear_45` | Rear 45° | BK |
| `closeup` | Chest close-up | FR, LP |

## 3. The Studio flow, step by step

Studio is a full-screen app at `/studio` with a stepper across the top (§4).
Each step saves to a **studio draft** on the server, so work survives a refresh
and can be resumed from the Studio home screen. A drawer opens the **Model
library** at any time. This section covers what each step does; §5 specifies
exactly how each step looks and behaves.

### Step 1: Design
- Upload the print files: `FR`, `BK`, `LP` (detected from file names), and the
  `[BK]` dark-garment variants.
- Name the design and series (e.g. *Attack on Titan · D1*).
- Files go to Cloudinary under `studio/designs/{series}/{design}/`.

### Step 2: Models & angles
- Choose one or more **model sets** from the library (filter by men/women).
- Or create a new one without leaving the step:
  - **Generate:**
    1. Choose men/women, optional custom text, and tick the angles (all 6 by default, at least 5).
    2. Gemini returns 2–4 front shots and you pick one.
    3. The other angles are generated **with that front shot as a reference image**, so it's the same person and outfit.
    4. Any single angle can be regenerated.
    5. A cost estimate shows before each run.
  - **Upload:** your own photoshoot photos, each tagged with its angle.
    Uploaded photos skip recolouring and are used as-is for their colour.
- Per model set, tick which angles this product uses.

### Step 3: Colours
- Multi-select from the backend palette (Black, Baby Blue, Navy Blue, ...).
- For each colour × angle not made yet, the server recolours the green base and
  saves the result. These **colourways** are cached in the library and reused by
  every later product.
- Dark garments automatically get the `[BK]` design variant.

### Step 4: Placement
- Shows each selected angle with its **saved box**. The first time an angle is
  used, the box starts from `suggest_quad` / the angle's default preset and you
  adjust it once (same canvas as today: drag, resize, rotate, live render).
- Saving stores the box and sliders on that angle of the model set, so it's used
  for every colour and every future product.
- An optional per-design box covers the rare design that needs its own.

### Step 5: Render & review
- One background job renders designs × model sets × colours × matching angles.
- A grid grouped by colour, with progress. For each image: **keep / reject /
  re-render**, and a star for the **main image** per colour.
- Kept images are uploaded to the product's Cloudinary folder
  (`monkedition/{type}/{category}/{product}/`, as the product editor does today).

### Step 6: Product details
- The same fields as the product editor: name, description, details, additional
  info, category, product type, price, discount, weight, sizes, tags.
- Prefilled where possible: name from the design name, tags from the series,
  sizes from the product type's defaults.

### Step 7: Qikink SKUs
- Qikink fulfils orders from products that already exist in the Qikink account
  (`search_from_my_products`), so each colour × size needs its Qikink SKU.
- A **SKU pattern** per product type auto-fills the grid (e.g.
  `{type}-{colourCode}-{size}`, using the palette's codes). Every cell stays
  editable; empty cells are not sold.
- *Open question:* whether Qikink's API can create the Qikink product and design
  from here. If it can, this step becomes automatic (see §10).

### Step 8: Publish
- Creates the product through the existing admin endpoints: `POST
  /api/v2/admin/products` with `colorImages` from step 5, then `PATCH
  /api/v2/admin/products/{id}/status` to make it active (or saves it as a draft).
- Links to the product in Products and on the shop.

## 4. Design & experience

Studio should feel like a creative tool (in the spirit of Linear, Framer,
Spline, Arc and Apple product pages), not an admin form. It is a separate
full-screen app with its own identity; the dashboard keeps its current look.

### 4.1 Identity: "Monk Studio"

**Solid colours only: no gradients, no glass, no glow.** Direction taken from
annakurilets.com, vs-goods.store, mowa.studio and kivoagentic.ai: near-black
ground, warm off-white type, one signal accent, editorial grotesk type, small
uppercase tracked labels, hairline borders.

| Element | Choice |
|---|---|
| Wordmark | **MONK / STUDIO**, uppercase, wide tracking, the slash in the accent |
| Background | Solid ink `#0E0E0E` |
| Surfaces | Solid panel `#161616`, hover `#1D1D1D`; **hairline borders** `#262626` (`#3A3A3A` stronger) |
| Accent | **Signal orange `#FF4F1A`**, the only accent: current step, primary button, focus ring |
| Text | Warm off-white `#F2EFE9`, secondary `#A8A49C`, hints `#8A8780`, locked `#4A4A4A` |
| Status | success `#7EE0A1`, error `#FF6B5B` |
| Fonts (open licence) | **Schibsted Grotesk** for everything, **JetBrains Mono** for numbers, counters and SKUs |
| Labels | 11 px, uppercase, 0.14em tracking |
| Corners | Small: 6 px on buttons and panels, full round only for dots |
| Rule | No green in the UI: chroma green is reserved for base garments |
| Light mode | Warm paper `#F4F1EA`, panels `#EBE7DE`, hairlines `#D9D3C7`, text `#121212` / `#4D4A44` / `#6B675F`, accent `#E8440F`. Same rules: solid only |
| Theme switch | Sun/moon toggle in the top bar and on Drafts. The new theme is revealed as a **circle growing from the toggle** (View Transitions API, 700 ms); instant where unsupported or with reduced motion. Choice remembered per browser; dark by default |

The theme lives in CSS variables scoped to the Studio root (`.studio`), so the
shop and dashboard styles are untouched.

### 4.1a The stepper (built, round 1)

- A full-width band under the top bar, **8 equal columns** split by hairlines.
- Each column: mono index (`01`–`08`), uppercase label, and a 3 px bar at the bottom.
- **States:** done = off-white bar and a check; current = orange index and bar
  (the bar fills in on arrival) on a raised panel; open = dark bar; locked =
  dimmed with a lock, tooltip names the step to finish first.
- Tablet: only the current step shows its label; the others show their index.
- Action bar: Back · status line (what is missing, or "Ready") · `03 / 08` counter · solid orange **Next**.
- Step change: content slides in the direction of travel; the big step number rolls like an odometer.
- Keys: Alt+← / Alt+→ move between steps. No command palette (removed by request).

### 4.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ monk/studio   Draft: AOT D1   ●━━━━●━━━━○━━━━○━━━━○━━━━○━━━━○━━━━○       ⏻ │  top bar: stepper
├────────────┬─────────────────────────────────────────┬───────────────┤
│ Step panel │                 Stage                   │   Inspector   │
│ (inputs,   │  canvas / 3D tee / grid, full height,   │  (properties  │
│  lists)    │  zoom and pan                           │   of the      │
│            │                                         │   selection)  │
├────────────┴─────────────────────────────────────────┴───────────────┤
│ ← Back                    3 jobs running ▸                 Next step → │  action bar
└──────────────────────────────────────────────────────────────────────┘
```

- **Tablet (768–1279 px):** the step panel collapses to an icon rail, the
  inspector becomes a **bottom sheet** you drag up, the stage keeps the space.
  Touch targets at least 44 px; pinch to zoom and two-finger pan on the canvas.
- The model library opens as a **full-height solid drawer** from the left.

### 4.3 Motion

| Where | What it does |
|---|---|
| Step changes | The current step's bar fills with the accent; the outgoing step slides and fades out, the next slides in; the step number rolls |
| Step titles | Short **kinetic type**: words rise in one after another |
| Cards (library, colours, renders) | Subtle **3D tilt** toward the pointer; enter in a short stagger |
| Buttons | **Magnetic** primary buttons that lean toward the cursor; press feedback with a spring |
| Generation | Each angle shows a **shimmering placeholder**; finished photos **develop in** (blur and exposure settle, like a Polaroid) |
| Colours | Picking a colour sends a **ripple fill** across the shirt; a **before/after slider** compares the green base with the colour |
| Review | **Masonry grid**; swipe or `←`/`→` to reject/keep, `S` stars the main image, with the card flicking off in the swipe direction |
| Publish | A short **particle burst** in the accent colours, then the finished product card flies into place with links |
| Waiting | Skeletons with a soft shimmer, never a bare spinner; progress shows real counts ("38 / 114") |

Principles: springs, not linear easing; 150–400 ms for UI and up to 800 ms for
reveals; nothing blocks input while animating. **"Reduce motion"** in the OS
turns tilt, parallax, ripples and particles off and keeps simple fades.

### 4.4 Screens, step by step

| Step | Stage shows | Feel |
|---|---|---|
| 1 Design | Large drop zone that **glows and expands** on drag-over; each file lands as a card tagged FR / BK / LP | Bento grid of the design files |
| 2 Models & angles | The **library as a tilting card wall**; generating opens a full-stage "photoshoot" view where the 6 angles develop in one by one | Like a contact sheet coming to life |
| 3 Colours | The **3D tee** in the centre, changing colour live as you hover swatches; selected swatches stack into a "palette tray" | Colour orbs with a glossy sheen |
| 4 Placement | The current canvas, restyled: solid toolbar, accent-outlined box, live render, angle switcher as a filmstrip | Precise, calm, few colours |
| 5 Render & review | Masonry grid grouped by colour, with a progress ring per colour | Fast keyboard and swipe triage |
| 6 Product details | Form on the left, a **live product card** on the right that updates as you type (as it will look in the shop) | Editing the real thing |
| 7 Qikink SKUs | A grid in the mono font; pattern auto-fill animates cell by cell; empty cells marked "not sold" | Spreadsheet-like, but legible |
| 8 Publish | Summary bento (images, colours, sizes, price), one big solid orange **Publish** button, then the burst | A clear finish line |

### 4.5 Productivity

- Keyboard shortcuts on every step, shown in a `?` overlay.
- **Toasts** for background jobs that finish while you are on another step.
- Autosave indicator in the top bar ("Saved · just now").

### 4.6 The 3D tee viewer

- Built with **three.js** through `@react-three/fiber` and `@react-three/drei`.
- An **oversized-tee 3D model (`.glb`)**, slowly turning on a soft studio stage
  with an HDR environment light and a contact shadow. Drag to spin; buttons
  for front, back and side; double-click to reset.
- The **chosen colour** sets the fabric material; the **design is projected as
  a decal** on the chest or back (drei `<Decal>`), with a fabric normal map so
  it reads as printed cloth.
- It is for **live previews** in steps 3 and 8. The product photos still come
  from the 2D model sets.
- **Getting the 3D model** (there is none yet), in order of preference:
  1. **Generate one** from a front and back tee photo with an image-to-3D
     service (e.g. Meshy, Tripo or Rodin), then clean it up once. Quick and
     matches the real oversized fit.
  2. **A free tee model with an open licence** (CC0 / CC-BY), adjusted to an
     oversized shape. Licence checked before use.
  3. **Commission a 3D artist** (Blender / Marvelous Designer) for the best fit
     and fabric folds.
  The prototype starts with option 1 or 2; the file can be swapped later without
  code changes.
- **Performance:** three.js loads only on the steps that use it; the model stays
  under ~2 MB; pixel ratio capped at 1.5 on tablets; a still image shows if WebGL
  is unavailable.

### 4.7 Libraries

| Library | For |
|---|---|
| `framer-motion` (installed) | transitions, springs, gestures, shared layout |
| `three`, `@react-three/fiber`, `@react-three/drei` | the 3D tee viewer |
| `@use-gesture/react` | swipe, pinch and drag on touch devices |
| Fonts | Schibsted Grotesk, JetBrains Mono (self-hosted) |

Studio loads as its own chunk, so the shop and dashboard bundles do not grow.

## 5. Step design specs

Every screen is designed in full before it is built: layout, components,
every state, tablet behaviour, shortcuts and the rule for moving on. A step is
built only after its design is **approved** (§5.11).

Each spec uses the same parts:
**Panel** (left), **Stage** (centre), **Inspector** (right), **States**,
**Tablet**, **Shortcuts**, **Done when** (what unlocks "Next").

### 5.1 Shell (every screen)

| Part | Spec |
|---|---|
| Top bar | Wordmark · draft name (click to rename) · stepper · autosave status ("Saved · just now" / "Saving…" / "Offline, will retry") · account menu |
| Stepper | See §4.1a. Click any done or reachable step to jump |
| Action bar | ← Back · running jobs ("2 jobs running ▸", opens a jobs sheet) · **Next →** (solid orange; when disabled, its tooltip says what is missing) |
| Leaving | Closing the tab or going to the dashboard mid-step keeps the draft; unsaved input triggers a confirm |
| Errors | Field errors inline; request errors as a toast with **Retry**; an expired session opens a sign-in sheet and keeps the draft |
| Loading | Skeletons shaped like the final content; never a blank stage |

### 5.2 Home (drafts hub)

| Part | Spec |
|---|---|
| Stage | Bento grid: a large **New product** card (accent border, magnetic hover); **Continue** cards for recent drafts (cover image, name, "Step 4 of 8", progress line, edited time); **Model library** card (count + 4 faces); **Running jobs** card |
| States | First visit: only "New product" and a short 3-line intro of the flow. No drafts: hides the Continue row |
| Done when | n/a. Opens a draft or starts a new one |

### 5.3 Step 1: Design

| Part | Spec |
|---|---|
| Panel | Design name (required), **series: a dropdown of the shop's categories from the backend** (`GET /api/v2/categories/tree`, grouped by top level, with thumbnails; no free text), slot checklist. No notes field (a draft-level note can come with shared drafts in phase 4) |
| Stage | Three **slots**: FR (front), BK (back), LP (pocket). Each slot has a main file and an optional **[BK] dark-garment variant** sub-slot. The whole stage is a drop zone that glows on drag-over; dropped files sort themselves into slots by file name |
| Inspector | Selected file on a checkerboard; size, pixel dimensions, detected code; checks with icons: **transparent background** (warn if none), **resolution** (warn under 2400 px on the long side), **file size** (error over 40 MB); Replace / Remove |
| States | Empty: large drop zone, "Drop FR / BK / LP PNGs, or browse". Uploading: progress ring on each card. Unrecognised name: card asks "Which slot?" with three chips. Wrong type: card shakes, error text |
| Tablet | Slots in 2 columns; a **Browse** button is primary (drag and drop is rare on tablets) |
| Done when | Name set and at least one of FR / BK / LP uploaded |

### 5.4 Step 2: Models & angles

| Part | Spec |
|---|---|
| Panel | Filters: Men / Women, Generated / Uploaded; search; **+ New model set** |
| Stage | **Card wall** of model sets: cover = front shot, hovering cycles through its angles, 3D tilt; selected sets get an orange outline and a number badge |
| Inspector | Selected set: angle **filmstrip** with a checkbox per angle (which angles this product uses). Angles that cannot take any of this product's designs are dimmed with the reason ("No BK file"). Per angle: box status ("Box saved" / "Needs a box") |
| New model set | A full-stage **photoshoot** overlay in 4 parts: **Brief** (gender, custom text, angle toggles with a minimum of 5, model choice, cost estimate) → **Front** (2–4 candidates develop in; pick one or regenerate) → **Angles** (contact sheet; each angle develops in; regenerate one; accept) → **Save** (name; saved to the library) |
| Upload path | Drop photos; each gets an angle chip to tag it; warns under 5 angles |
| States | Empty library: hero card "Create your first model set". Generating: shimmer placeholders with live counts. Failed or refused angle: card with the reason and Retry |
| Tablet | Card wall in 2 columns; the photoshoot overlay is full screen with large buttons |
| Done when | At least one set selected with at least one checked angle that can take one of the designs |

### 5.5 Step 3: Colours

| Part | Spec |
|---|---|
| Panel | Palette as glossy **colour orbs** grouped Darks / Lights / Brights, with search; quick picks ("All darks", "Last used") |
| Stage | The **3D tee** with the design, showing the hovered or selected colour; underneath, a **palette tray** of chosen colours (drag to reorder; this is the colour order in the shop) |
| Inspector | Selected colour: **before/after slider** (green base vs recoloured) on the selected set's front angle; colourway status per model set (Ready / Making / Failed); design variant used (Normal / [BK]) with an override |
| States | Making colourways: progress per colour orb. Failed: orb with a warning badge and Retry |
| Tablet | Orbs in a horizontal scroller above the stage; the inspector is a bottom sheet |
| Done when | At least one colour chosen and all its colourways ready |

### 5.6 Step 4: Placement

| Part | Spec |
|---|---|
| Panel | Checklist of model set × angle with status chips (Saved / Needs box); **Next needing a box** button |
| Stage | Placement canvas with the live render and the orange box; below it, a **colour filmstrip** showing the same box on every chosen colour |
| Inspector | Preset, fit (keep aspect / stretch), the 4 sliders, nudge and rotate, "Own box for this design", **Save as this angle's box** |
| States | All boxes saved: the stage shows an "All set" summary and Next is enabled. Render error: message over the canvas with Retry |
| Tablet | Drag with a finger, pinch to zoom, two fingers to pan; sliders in the bottom sheet |
| Shortcuts | Arrows move (Shift ×5), + / − resize, [ / ] rotate, ⌘S save the box |
| Done when | Every used angle that takes a design has a saved box |

### 5.7 Step 5: Render & review

| Part | Spec |
|---|---|
| Panel | Filters by colour, model set and angle; counts: kept / rejected / to review |
| Stage | **Masonry grid** grouped by colour, each group with a progress ring while rendering; click opens a lightbox with zoom |
| Inspector | Selected image: details, **re-render** (opens placement for just that image), star as the **main image** for its colour |
| States | Rendering: images fill in live. Failed images: card with Retry. All reviewed: a "Review complete" banner |
| Tablet | Swipe left / right to reject / keep; long-press to star |
| Shortcuts | ← reject, → keep, S star, Space zoom, U undo |
| Done when | Every colour has at least one kept image and a main image |

### 5.8 Step 6: Product details

| Part | Spec |
|---|---|
| Panel + Stage | Form cards: **Basics** (name, description, details, additional info, tags), **Pricing** (price, discount, the shown MRP calculated live), **Organisation** (category, product type), **Sizes** (chips), weight |
| Inspector | **Live shop card**: how the product will look in the shop, updating as you type; colour swatches switch its images |
| States | Prefilled fields marked "suggested"; inline validation with the product editor's rules |
| Tablet | Form full width; the shop card is a tab at the top |
| Done when | All required fields valid |

### 5.9 Step 7: Qikink SKUs

| Part | Spec |
|---|---|
| Stage | Grid of colours × sizes in the mono font. A **pattern** field above with token chips (`{type}`, `{colourCode}`, `{size}`); **Fill from pattern** fills cells one by one. Empty cells show "Not sold" |
| Inspector | The tokens explained, with an example for the selected cell |
| States | Duplicate SKUs or invalid characters: the cell turns red with the reason |
| Tablet | Grid scrolls sideways with the colour column fixed |
| Done when | At least one SKU, no duplicates or invalid cells |

### 5.10 Step 8: Publish

| Part | Spec |
|---|---|
| Stage | **Summary bento**: main image, colours, sizes, price, image count, SKU count; a warnings list (e.g. "Maroon has no Qikink SKU for XXL") |
| Actions | **Publish** (large solid orange button) or **Save as draft product** |
| States | Publishing as a 3-line checklist: upload images → create product → make it active. A failed line shows Retry and keeps what is done. Success: particle burst, then the product card with **View in shop**, **Open in Products** and **New product from this design** |
| Done when | Published, or saved as a draft product |

### 5.11 Design sign-off

Each screen goes through four stages, and is built against the real APIs only
after the last one:

1. **Wireframe:** layout and content, no styling.
2. **Hi-fi prototype:** clickable in `/studio` with sample data, final look and motion, desktop and tablet.
3. **Review** with you: comments are fixed in the prototype.
4. **Approved.**

Every screen must pass this checklist before approval:
- All states designed: empty, loading, partial, error, success.
- Desktop (1280 px+) and tablet (768–1279 px, portrait and landscape) layouts.
- Works with the keyboard only; shortcuts listed in the `?` overlay.
- Reduce-motion version checked.
- Text contrast at least WCAG AA on the dark theme.
- Copy reviewed: labels, empty states, errors.

| Screen | Wireframe | Prototype | Review | Approved |
|---|---|---|---|---|
| Shell | ☐ | ☐ | ☐ | ☐ |
| Home | ☐ | ☐ | ☐ | ☐ |
| 1 Design | ☐ | ☐ | ☐ | ☐ |
| 2 Models & angles + photoshoot | ☐ | ☐ | ☐ | ☐ |
| 3 Colours + 3D tee | ☐ | ☐ | ☐ | ☐ |
| 4 Placement | ☐ | ☐ | ☐ | ☐ |
| 5 Render & review | ☐ | ☐ | ☐ | ☐ |
| 6 Product details | ☐ | ☐ | ☐ | ☐ |
| 7 Qikink SKUs | ☐ | ☐ | ☐ | ☐ |
| 8 Publish | ☐ | ☐ | ☐ | ☐ |

## 6. Architecture

```
monkedition-fe  (Studio tab)
   │  staff token
   ├──────────────► monkedition-be   data: model sets, colourways, drafts, products
   │                    │  Cloudinary (signed uploads), MongoDB
   └──────────────► monkedition-mockups   compute: Gemini, recolour, render, bulk
                        │  loads images from Cloudinary URLs, uploads results
```

### monkedition-mockups (Python): image work only, no data

New `studio/` package:
- `catalog.py`: angles, prompt templates, base garment colour.
- `gemini.py`: generation with reference images, retries, model from env.
- `recolor.py`: chroma-key garment mask (soft edges), recolouring that keeps
  the fabric's light and shadow (LAB), green-spill removal on skin and edges.
- `cloudinary.py`: signed uploads of generated images, colourways and renders.

New endpoints (`/api/v1/studio/...`), all staff-only and run as background jobs
with progress polling:

| Method | Path | Does |
|---|---|---|
| POST | `/studio/generate/front` | 2–4 front candidates for a prompt |
| POST | `/studio/generate/angles` | Other angles from a chosen front image |
| POST | `/studio/recolor` | Shot images × colours → colourway images |
| POST | `/studio/render` | Designs × colourways with saved boxes → images |
| GET | `/studio/jobs/{id}` | Progress, results, errors |

The existing `/render` and `/bulk` endpoints stay, and take Cloudinary URLs
as well as upload ids. Images are cached in memory by URL.

### monkedition-be (Node): the data

New `studio` module, staff-only under `/api/v2/admin/studio/*`:

| Collection | Holds |
|---|---|
| `modelSets` | name, gender, source (generated / uploaded), prompt used, created by |
| `modelShots` | set id, angle, base image URL, saved box + sliders, preset |
| `colourways` | shot id, colour code, image URL (unique per shot + colour) |
| `studioDrafts` | wizard state per step, owner, linked product id once published |

It also exposes the colour palette (`colours.js`) to the dashboard.
Publishing reuses the existing product endpoints, so validation stays in one place.

### monkedition-fe: the Studio app

- Route `/studio/*`, lazy-loaded, staff-only (same check as the dashboard),
  outside the dashboard layout. The dashboard's "Studio" tab links to it.
- `src/studio/StudioApp.jsx`: shell (top bar, stepper, panels, action bar) and drafts.
- `src/studio/theme.css`: the Monk Studio tokens, scoped to `.studio`.
- `src/studio/ui/*`: Studio's own components (panel, button, tilt card, swatch, stepper, sheet, toast).
- `src/studio/steps/*`: one component per step.
- `src/studio/library/*`: the model library drawer (browse, generate, upload, delete).
- `src/studio/three/TeeViewer.jsx`: the 3D tee viewer.
- Reuses `PlacementCanvas`, `geometry.js` and the mockups API client from the current tab, restyled.
- The old **Mockups** tab is removed once Studio covers it.

## 7. Phases

| Phase | Delivers | Est. |
|---|---|---|
| **0a. Test the risky parts** | Script: generate one men's set (6 angles, reference-based), recolour to black, white, navy, baby blue, mustard, maroon; one comparison sheet. Answers: same person across angles? Real-looking dark and light colours? | ½ day |
| **0b. Design every screen** | Monk Studio theme and components, then every screen in §5 taken through wireframe → hi-fi clickable prototype (sample data, desktop and tablet) → your review → approval (§5.11). Nothing in phase 4 is built before its screen is approved | 3–4 days |
| **1. Library and saved placement** | Backend `studio` module (model sets, shots), Cloudinary folders, uploading your own photos with angle tags, saved box per angle. Useful even without AI | 1–2 days |
| **2. Colours** | `recolor.py`, colourway caching, the Colours step | 1–2 days |
| **3. Generation** | Gemini front candidates + reference-based angles, regenerate one angle, cost estimate | 1–2 days |
| **4. The Studio app** | Connect the approved screens to the real APIs, step by step: drafts and all 8 steps. Each step is checked against its approved prototype | 3–4 days |
| **4b. 3D tee viewer** | The `.glb` tee (generated or sourced, §4.6), colour material, front/back decals, fallback image | 1–2 days |
| **5. Cleanup** | Mockups service on Python 3.12 (newer Gemini SDK needs 3.10+), remove the old Mockups tab, READMEs, deployment notes | ½ day |

**Phase 0a result (2026-11-24): recolouring passes.** Tested on the Men 01
set (5 angles × black, white, navy, baby blue, mustard, maroon) with
`monkedition-mockups/studio/recolor.py`: folds, seams and hems survive in
every colour, no green halo on skin, about 0.1 s per colour per photo. Dark
colours needed their own shading curve (strong highlights, soft shadows); no
second dark base or Gemini edit is needed. Follow-ups: each palette colour
needs a **fabric hex** (the shop's swatch hex like Black `#000000` is a screen
colour, too pure for cloth); a faint light fringe on some white sleeve edges.
Gemini consistency across angles: confirmed by hand (the Men 01 photos were
generated from one reference); automating it waits for the API key.

**Change after phase 0a: colourways are not stored.** Recolouring a photo
takes ~0.15 s (≈1 ms when cached), so step 3 previews and the step 5 renders
make colourways on demand through the mockups service
(`GET /api/v1/studio/recolor?src&hex&w`, cached in memory) instead of saving
one image per colour to Cloudinary and a `colourways` collection. Step 3 is
built this way; fabric colours live in `monkedition-fe/src/studio/palette.js`
for now and should move next to the backend palette.

Phases 0a and 0b can run in parallel. 0a decides whether phases 2–3 go ahead
as written or change (e.g. a second dark base per angle). 0b finalises the
design of every screen; phase 4 builds only approved screens.

## 8. Risks

| Risk | Mitigation |
|---|---|
| The person changes between angles | Reference-based generation, regenerate one angle, Pro model. Checked in phase 0 |
| Dark colours look flat when recoloured from green | Tune shading strength per colour; fallback: a dark base or a Gemini edit for those colours. Checked in phase 0 |
| Green spill on skin and hair near the shirt | Spill removal around the mask edge, as with a green screen |
| Gemini cost, limits and safety refusals | One generation per angle, recolouring is free; cost shown first; retries with backoff; clear errors per angle |
| Cloudinary storage grows | Base and colourway images kept once and reused; renders stored only when kept in review |
| Qikink SKUs must exist before publishing | SKU pattern auto-fill + validation; investigate Qikink product API (§10) |
| Long jobs and closed tabs | Jobs run on the server; drafts keep state; Studio shows running jobs on return |
| Heavy effects slow down tablets | Effects scale down by device (blur, grain and particles off on low-end GPUs), DPR capped, 3D only where used, reduce-motion respected |
| No 3D tee model yet | Generated or open-licence model for the prototype (§4.6); swappable file |

## 9. Setup needed

- `GEMINI_API_KEY` (and optionally `GEMINI_IMAGE_MODEL`) in `monkedition-mockups/.env`.
- Cloudinary credentials in `monkedition-mockups/.env` (the same account as the backend).
- Python 3.12 for the mockups service (already installed through Homebrew).
- For a generated 3D tee: an account on an image-to-3D service (free tiers are
  enough for one model), plus clean front and back photos of a plain oversized tee.

## 10. Open questions

1. **Qikink:** does its API let us create the product and attach the design, so
   step 7 needs no manual SKUs? Otherwise, what SKU pattern does your Qikink
   account use?
2. **Gemini model:** Pro (best consistency) or Flash (cheaper)? Phase 0 can
   compare both on the same prompt.
3. **Women's sets:** same 6 angles and outfit style as men's?
4. **Review:** must every image be approved before publishing, or is "keep all"
   the default?
5. **3D tee:** generate it from tee photos (recommended), use an open-licence
   model, or commission one?
6. **Studio name:** is "Monk Studio" right, or do you want a different name?
