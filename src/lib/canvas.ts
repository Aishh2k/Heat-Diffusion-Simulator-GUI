import type { Frame, AnyShape, ToolMode, Vec2 } from "./types";
import { GRID_RES, tempToColor } from "./utils";

// Canvas rendering helpers for the simulation UI.
// Usage: call these from component lifecycle hooks 
// and pass a CanvasRenderingContext2D along with the data to render.

export function renderHeatField(
  ctx: CanvasRenderingContext2D,
  frame: Frame | undefined,
  nextFrame: Frame | undefined,
  alpha: number,
  tMin: number,
  tMax: number,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);

  if (!frame) {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const cell = width / GRID_RES;
  const useBlend = nextFrame && nextFrame.grid && alpha > 0 && alpha < 1;

  for (let y = 0; y < GRID_RES; y++) {
    for (let x = 0; x < GRID_RES; x++) {
      let v = frame.grid[y][x];
      if (useBlend) {
        const v2 = (nextFrame as Frame).grid[y][x];
        v = v * (1 - alpha) + v2 * alpha;
      }
      ctx.fillStyle = tempToColor(v, tMin, tMax);
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

export function renderGuideGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const p = Math.round((i / 10) * width);
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(width, p); ctx.stroke();
  }
}

export function renderShapes(ctx: CanvasRenderingContext2D, shapes: AnyShape[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  const cell = width / GRID_RES;

  const ordered = [...shapes].sort((a, b) => a.z - b.z);
  for (const s of ordered) {
    if (!s.visible) continue;
    ctx.save();
    const isHighlighted = s.highlighted;
    ctx.globalAlpha = isHighlighted ? 0.5 : 0.25;
    ctx.fillStyle = isHighlighted ? "#FFD700" : "#00A2FF";
    ctx.strokeStyle = isHighlighted ? "#FFA500" : "#00A2FF";
    ctx.lineWidth = isHighlighted ? 3 : 2;

    if (s.kind === "rectangle") {
      const x = Math.min(s.p0.x, s.p1.x) * cell;
      const y = Math.min(s.p0.y, s.p1.y) * cell;
      const w = (Math.abs(s.p1.x - s.p0.x) + 1) * cell;
      const h = (Math.abs(s.p1.y - s.p0.y) + 1) * cell;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    } else {
      const cx = (s.center.x + 0.5) * cell;
      const cy = (s.center.y + 0.5) * cell;
      const rx = s.rx * cell;
      const ry = s.ry * cell;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function renderDragPreview(
  ctx: CanvasRenderingContext2D,
  dragStart: Vec2 | null,
  dragEnd: Vec2 | null,
  tool: ToolMode | undefined,
  width: number
) {
  if (!dragStart || !dragEnd || !tool || tool === "idle") return;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#34C759";
  ctx.strokeStyle = "#34C759";
  ctx.lineWidth = 2;
  const cell = width / GRID_RES;

  if (tool === "rectangle") {
    const x = Math.min(dragStart.x, dragEnd.x) * cell;
    const y = Math.min(dragStart.y, dragEnd.y) * cell;
    const w = (Math.abs(dragEnd.x - dragStart.x) + 1) * cell;
    const h = (Math.abs(dragEnd.y - dragStart.y) + 1) * cell;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  } else if (tool === "ellipse") {
    const cx = ((dragStart.x + dragEnd.x) / 2 + 0.5) * cell;
    const cy = ((dragStart.y + dragEnd.y) / 2 + 0.5) * cell;
    const rx = (Math.abs(dragEnd.x - dragStart.x) / 2 + 0.5) * cell;
    const ry = (Math.abs(dragEnd.y - dragStart.y) / 2 + 0.5) * cell;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
