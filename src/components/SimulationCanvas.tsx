// Renders the simulation heat field and an overlay of material regions.

import React, { useEffect, useRef, useState } from "react";
import type { SimulationCanvasProps, Vec2 } from "../lib/types";
import { GRID_RES } from "../lib/utils";
import { renderHeatField, renderGuideGrid, renderShapes, renderDragPreview } from "../lib/canvas";

export default function SimulationCanvas({
  frame, nextFrame, alpha, tMin, tMax,
  tool, activeDiff, shapes, onCommitShape,
  width, height
}: SimulationCanvasProps) {
  // Two stacked canvases: base (heat) + overlay (shapes)
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // Drag state for new shape placement
  const [dragStart, setDragStart] = useState<Vec2 | null>(null);
  const [dragEnd, setDragEnd] = useState<Vec2 | null>(null);

  /* ---------------------------- Heat field ------------------------------ */
  useEffect(() => {
    const c = baseRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    renderHeatField(ctx, frame, nextFrame, alpha, tMin, tMax, width, height);
    renderGuideGrid(ctx, width, height);
  }, [frame, nextFrame, alpha, tMin, tMax, width, height]);

  /* ---------------------------- Overlay (L2) ---------------------------- */
  useEffect(() => {
    const c = overlayRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    const overlay = overlayRef.current; if (!overlay) return;
    const overlayCtx = overlay.getContext("2d"); if (!overlayCtx) return;
    renderShapes(overlayCtx, shapes, width, height);
    renderDragPreview(overlayCtx, dragStart, dragEnd, tool, width);
  }, [shapes, tool, dragStart, dragEnd, width, height]);

  /* ---- Mouse I/O ------------------------------------------ */

  const toGrid = (e: React.MouseEvent): Vec2 => {
    const c = overlayRef.current!;
    const r = c.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    return {
      x: Math.max(0, Math.min(GRID_RES - 1, Math.floor(nx * GRID_RES))),
      y: Math.max(0, Math.min(GRID_RES - 1, Math.floor(ny * GRID_RES))),
    };
  };

  const onDown = (e: React.MouseEvent) => {
    if (tool === "idle") return;
    setDragStart(toGrid(e));
    setDragEnd(null);
  };
  const onMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    setDragEnd(toGrid(e));
  };
  const onEnd = () => {
    if (!dragStart || !dragEnd) { setDragStart(null); setDragEnd(null); return; }

    const id = crypto.randomUUID();
    if (tool === "rectangle") {
      onCommitShape({
        id, kind: "rectangle", diffusivity: activeDiff, visible: true, z: 0,
        p0: dragStart, p1: dragEnd,
      });
    } else if (tool === "ellipse") {
      const cx = Math.round((dragStart.x + dragEnd.x) / 2);
      const cy = Math.round((dragStart.y + dragEnd.y) / 2);
      const rx = Math.max(1, Math.round(Math.abs(dragEnd.x - dragStart.x) / 2));
      const ry = Math.max(1, Math.round(Math.abs(dragEnd.y - dragStart.y) / 2));
      onCommitShape({
        id, kind: "ellipse", diffusivity: activeDiff, visible: true, z: 0,
        center: { x: cx, y: cy }, rx, ry,
      });
    }

    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <canvas ref={baseRef} width={width} height={height} className="heat-canvas" />
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        className="overlay-canvas" //bugfix: was "overlay-cavas"
        style={{ pointerEvents: tool === "idle" ? "none" : "auto" }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseLeave={onEnd}
        onMouseUp={onEnd}
      />
    </div>
  );
}