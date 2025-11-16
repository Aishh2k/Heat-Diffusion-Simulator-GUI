// List and manage material regions: select, toggle visibility/highlight, delete.

import type { ShapesListProps } from "../lib/types";

export default function ShapesList({
  shapes, selection, setSelection,
  onToggleVisible, onToggleHighlight, onDelete
}: ShapesListProps) {
  const togglePick = (id: string) => {
    const s = new Set(selection);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelection([...s]);
  };

  if (shapes.length === 0) {
    return <p className="muted small top-gap">No shapes yet. Use Rectangle/Ellipse to add one.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
      {shapes
        .slice()
        .sort((a, b) => a.z - b.z)
        .map(s => (
          <li key={s.id} className="shape-item">
            <input
              type="checkbox"
              checked={selection.includes(s.id)}
              onChange={()=>togglePick(s.id)}
              title="Select"
            />
            <span className="kind">{s.kind === "rectangle" ? "Rectangle" : "Ellipse"}</span>
            <span className="meta">D={s.diffusivity}</span>
            <button className="btn btn--ghost" onClick={()=>onToggleVisible(s.id)}>
              {s.visible ? "Hide" : "Show"}
            </button>
            <button className="btn btn--ghost" onClick={()=>onToggleHighlight(s.id)}>Highlight</button>
            <button className="btn btn--ghost" onClick={()=>onDelete(s.id)}>Delete</button>
          </li>
        ))}
    </ul>
  );
}