// The model photo with its print box. Drag a corner to resize (keeping
// proportions, or freely with Alt/Option or free mode), drag inside to move,
// drag the round handle to rotate (Shift snaps to 15°). The box is edited
// locally while dragging: each move goes to onDrag (for live drafts) and the
// final box to onCommit, on release.
import { useEffect, useRef, useState } from "react";
import * as G from "./geometry";

const HANDLE_RADIUS = 7;
const HIT_RADIUS = 12;
const ROTATE_STALK = 30; // screen px from the top edge to the rotate handle
const COLOURS = { tab: "#16a34a", custom: "#ea580c" };

const PlacementCanvas = ({ image, width, height, quad, custom, freeMode, showBox = true, onDrag, onCommit }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [live, setLive] = useState(quad);
  const [cursor, setCursor] = useState("crosshair");

  useEffect(() => {
    if (!dragRef.current) setLive(quad);
  }, [quad]);

  // Fit the whole photo in the column (and 80% of the window height); never upscale.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !width) return undefined;
    const fit = () => setScale(Math.min(wrap.clientWidth / width, (window.innerHeight * 0.8) / height, 1));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    if (!live || !showBox) return;

    const colour = custom ? COLOURS.custom : COLOURS.tab;
    const points = live.map(([x, y]) => [x * scale, y * scale]);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = colour;
    points.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    const [hx, hy] = G.rotateHandle(live, ROTATE_STALK / scale).map((v) => v * scale);
    ctx.beginPath();
    ctx.moveTo((points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.stroke();
  }, [image, width, height, scale, live, custom, showBox]);

  const toPhoto = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * width, ((event.clientY - rect.top) / rect.height) * height];
  };
  const near = ([px, py], [x, y]) => Math.hypot((px - x) * scale, (py - y) * scale) < HIT_RADIUS;
  const cornerAt = (point) => live.findIndex((corner) => near(point, corner));
  const onRotateHandle = (point) => near(point, G.rotateHandle(live, ROTATE_STALK / scale));

  const onPointerDown = (event) => {
    if (!live || !showBox) return;
    const point = toPhoto(event);
    const start = G.clone(live);
    const corner = cornerAt(point);
    if (corner < 0 && onRotateHandle(point)) {
      const c = G.center(live);
      dragRef.current = { kind: "rotate", start, c, a0: Math.atan2(point[1] - c[1], point[0] - c[0]), base: G.angle(live) };
    } else if (corner >= 0) {
      dragRef.current = { kind: "corner", start, corner, free: freeMode || event.altKey };
    } else if (G.contains(live, ...point)) {
      dragRef.current = { kind: "move", start, from: point };
    } else {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!live || !showBox) return;
    const point = toPhoto(event);
    const drag = dragRef.current;
    if (!drag) {
      const corner = cornerAt(point);
      if (corner >= 0) setCursor(freeMode || event.altKey ? "pointer" : corner % 2 === 0 ? "nwse-resize" : "nesw-resize");
      else if (onRotateHandle(point)) setCursor("grab");
      else setCursor(G.contains(live, ...point) ? "move" : "crosshair");
      return;
    }
    let next;
    if (drag.kind === "rotate") {
      let degrees = ((Math.atan2(point[1] - drag.c[1], point[0] - drag.c[0]) - drag.a0) * 180) / Math.PI;
      if (event.shiftKey) degrees = Math.round((drag.base + degrees) / 15) * 15 - drag.base;
      next = G.rotateAround(drag.start, drag.c, degrees);
    } else if (drag.kind === "move") {
      next = G.move(drag.start, point[0] - drag.from[0], point[1] - drag.from[1]);
    } else if (drag.free) {
      next = drag.start.map((p, i) => (i === drag.corner ? point : p));
    } else {
      next = G.resizeFromCorner(drag.start, drag.corner, ...point);
    }
    setLive(next);
    onDrag?.(next); // lets the page render the design live while dragging
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    onCommit(live);
  };

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-gray-100 touch-none select-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Photo with the print box. Drag to move, resize or rotate it."
      />
    </div>
  );
};

export default PlacementCanvas;
