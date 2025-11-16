// Material API helpers. These functions wrap backend endpoints for creating
// materials, adding shapes, and fetching previews.

import { API_BASE } from "./utils";

export async function createMaterial(): Promise<{ id: string }> {
  const r = await fetch(`${API_BASE}/materials/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ width: 100, height: 100, base_diffusivity: 0.01 }),
  });
  if (!r.ok) throw new Error(`Create material failed (${r.status})`);
  const j = await r.json();
  // many backends return { material_id: "...", ... }
  const id = j.material_id ?? j.id;
  if (!id) throw new Error("No material_id returned by backend");
  return { id };
}

export async function addRectangle(
  materialId: string,
  body: { x0: number; y0: number; x1: number; y1: number; diffusivity: number }
) {
  // Convert to backend's expected rectangle payload
  const x = Math.min(body.x0, body.x1);
  const y = Math.min(body.y0, body.y1);
  const rect_width = Math.abs(body.x1 - body.x0) + 1;
  const rect_height = Math.abs(body.y1 - body.y0) + 1;

  const r = await fetch(`${API_BASE}/materials/${materialId}/add-rectangle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y, rect_width, rect_height, diffusivity: body.diffusivity }),
  });
  if (!r.ok) throw new Error(`Add rectangle failed (${r.status})`);
  return r.json();
}

export async function addEllipse(
  materialId: string,
  body: { cx: number; cy: number; rx: number; ry: number; diffusivity: number }
) {
  const r = await fetch(`${API_BASE}/materials/${materialId}/add-ellipse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      center_x: body.cx,
      center_y: body.cy,
      semi_major: Math.max(body.rx, body.ry),
      semi_minor: Math.min(body.rx, body.ry),
      angle: 0,
      diffusivity: body.diffusivity
    }),
  });
  if (!r.ok) throw new Error(`Add ellipse failed (${r.status})`);
  return r.json();
}

export async function getPreview(materialId: string) {
  const r = await fetch(`${API_BASE}/materials/${materialId}/preview`);
  if (!r.ok) throw new Error(`Preview failed (${r.status})`);
  return r.json();
}

export async function runWithMaterial(body: {
  material_id: string;
  total_time: number;
  initial_temperature: number;
  boundary_temperatures: { left: number; right: number; top: number; bottom: number };
  diffusivity: number;
}) {
  const r = await fetch(`${API_BASE}/simulations/with-material`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Start (materials) failed (${r.status})`);
  return r.json() as Promise<{
    job_id: string;
    status: "pending" | "running";
    message?: string;
    location?: string;
    time_step?: number;
  }>;
}
