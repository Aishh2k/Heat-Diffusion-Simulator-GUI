// Utility functions and constants for the frontend UI and API wrappers.
import type { Frame } from "./types";

export const API_BASE = "/api";
export const CANVAS_SIZE = 500;
export const GRID_RES = 100;
export const FRAMES_PER_SECOND = 6;

export const DEFAULT_CFG = {
  total_time: 1.0,
  background_temp: 20,
  left_temp: 60,
  right_temp: 40,
  top_temp: 20,
  bottom_temp: 80,
  background_diffusivity: 1.0,
};

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// Map a temperature value into an RGB string using a multi-stop gradient.
export function tempToColor(t: number, tMin: number, tMax: number) {
  const STOPS: [number, number, number][] = [
    [0, 0, 255],
    [0, 255, 255],
    [0, 255, 0],
    [255, 255, 0],
    [255, 0, 0],
  ];
  if (!isFinite(tMin) || !isFinite(tMax) || tMax - tMin < 1e-9) {
    const [r, g, b] = STOPS[0]; return `rgb(${r},${g},${b})`;
  }
  const u = Math.min(1, Math.max(0, (t - tMin) / (tMax - tMin)));
  const segs = STOPS.length - 1;
  const x = Math.min(segs - 1e-9, u * segs);
  const i = Math.floor(x);
  const f = x - i;
  const [r1, g1, b1] = STOPS[i];
  const [r2, g2, b2] = STOPS[i + 1];
  const R = Math.round(r1 + (r2 - r1) * f);
  const G = Math.round(g1 + (g2 - g1) * f);
  const B = Math.round(b1 + (b2 - b1) * f);
  return `rgb(${R},${G},${B})`;
}

// Compute conservative min/max for a frame's grid. Returns a fallback range if
// frame is absent or values are invalid.
export function frameMinMax(frame?: Frame): [number, number] {
  if (!frame) return [0, 100];
  if (Number.isFinite(frame.min_temp!) && Number.isFinite(frame.max_temp!)) {
    const lo = frame.min_temp as number, hi = frame.max_temp as number;
    if (hi > lo) return [lo, hi];
  }
  let min = Infinity, max = -Infinity;
  for (const row of frame.grid ?? []) {
    for (let i = 0; i < row.length; i++) {
      const v = row[i];
      if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-9) {
    return [min - 1, max + 1];
  }
  return [min, max];
}
