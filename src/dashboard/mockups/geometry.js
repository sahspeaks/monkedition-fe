// Print-box maths. A quad is 4 [x, y] points in photo pixels: TL, TR, BR, BL.
// Pure functions; every one returns a new quad.

export const clone = (quad) => quad.map(([x, y]) => [x, y]);

export const center = (quad) => [quad.reduce((a, p) => a + p[0], 0) / 4, quad.reduce((a, p) => a + p[1], 0) / 4];

/** Rotation of the top edge (TL→TR) in degrees, -180..180. */
export const angle = (quad) => {
  let a = (Math.atan2(quad[1][1] - quad[0][1], quad[1][0] - quad[0][0]) * 180) / Math.PI;
  a = ((((a + 180) % 360) + 360) % 360) - 180;
  return Math.abs(a) < 0.05 ? 0 : a;
};

export const rotateAround = (quad, [cx, cy], degrees) => {
  const r = (degrees * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return quad.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
};

export const rotate = (quad, degrees) => rotateAround(quad, center(quad), degrees);

export const move = (quad, dx, dy) => quad.map(([x, y]) => [x + dx, y + dy]);

export const scale = (quad, factor) => {
  const [cx, cy] = center(quad);
  return quad.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
};

/** Drag corner `index` to (mx, my), keeping proportions: scales about the opposite corner. */
export const resizeFromCorner = (start, index, mx, my) => {
  const [ax, ay] = start[(index + 2) % 4];
  const [sx, sy] = start[index];
  const vx = sx - ax;
  const vy = sy - ay;
  const f = Math.max(0.05, ((mx - ax) * vx + (my - ay) * vy) / (vx * vx + vy * vy || 1));
  return start.map(([x, y]) => [ax + (x - ax) * f, ay + (y - ay) * f]);
};

/** Where the rotate handle sits: `offset` px (photo units) out from the top edge's midpoint. */
export const rotateHandle = (quad, offset) => {
  const [cx, cy] = center(quad);
  const mx = (quad[0][0] + quad[1][0]) / 2;
  const my = (quad[0][1] + quad[1][1]) / 2;
  let dx = mx - cx;
  let dy = my - cy;
  let length = Math.hypot(dx, dy);
  if (length < 1e-6) [dx, dy, length] = [0, -1, 1];
  return [mx + (dx / length) * offset, my + (dy / length) * offset];
};

export const contains = (quad, px, py) => {
  let inside = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const [xi, yi] = quad[i];
    const [xj, yj] = quad[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Photo-size independent copies, so a box survives a photo swap or tab duplicate. */
export const toFraction = (quad, width, height) => quad.map(([x, y]) => [x / width, y / height]);
export const fromFraction = (quad, width, height) => quad.map(([x, y]) => [x * width, y * height]);
