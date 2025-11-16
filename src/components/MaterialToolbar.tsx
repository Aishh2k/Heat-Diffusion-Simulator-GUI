// Material toolbar for selecting shape tools and editing region diffusivity.

import { useEffect, useMemo, useState } from "react";
import type { MaterialToolbarProps } from "../lib/types";

export default function MaterialToolbar({
  tool,
  setTool,
  activeDiff,
  setActiveDiff,
  ensureMaterial,
  shapes,
  selection,
  setSelection,
  onToggleVisible,
  onToggleHighlight,
  onDelete,
  clearAllShapes,
}: MaterialToolbarProps) {
  // Local text state for the diffusivity input and focus tracking
  const [diffText, setDiffText] = useState<string>(String(activeDiff));
  const [isFocused, setIsFocused] = useState(false);

  // Sync input text from parent numeric value when not editing
  useEffect(() => {
   if (!isFocused) setDiffText(String(activeDiff));
  }, [activeDiff, isFocused]);

  // Helpers for validating and clamping input
  const PARTIAL_NUMBER = /^-?\d*\.?\d*$/;
  const clamp = (n: number) => Math.min(10, Math.max(0.01, n));

  // Derived numeric value from the current text or null if invalid/empty
  const parsed = useMemo(() => {
   const s = diffText.trim();
   if (s === "") return null;
   const n = Number(s);
   return Number.isNaN(n) ? null : n;
  }, [diffText]);

  const outOfRange = parsed !== null && (parsed < 0.01 || parsed > 10);
  const shapeToolsDisabled = parsed === null || outOfRange;

  // Handle typing in the text input, allowing partial numeric forms
  const onChangeText = (s: string) => {
   if (s === "" || PARTIAL_NUMBER.test(s)) {
    setDiffText(s);
    const n = Number(s);
    if (!Number.isNaN(n)) setActiveDiff(n);
   }
  };

  // Finalize input on blur: clamp, push numeric value up, and normalize display
  const onBlur = () => {
   setIsFocused(false);
   if (parsed === null) return;
   const final = clamp(parsed);
   setActiveDiff(final);
   setDiffText(String(+final));
  };

  return (
   <div className="material-toolbar">
    <div className="field__label">Material mode</div>
    <div className="segmented">
      <button
       className={tool === "idle" ? "is-active" : ""}
       onClick={() => {
        setTool("idle");
        clearAllShapes();
       }}
      >
       Off
      </button>
      <button
       className={tool === "rectangle" ? "is-active" : ""}
       onClick={async () => {
        await ensureMaterial();
        setTool("rectangle");
       }}
       disabled={shapeToolsDisabled}
       title={shapeToolsDisabled ? "Enter a valid region diffusivity (0.01–10) to draw" : ""}
      >
       Rectangle
      </button>
      <button
       className={tool === "ellipse" ? "is-active" : ""}
       onClick={async () => {
        await ensureMaterial();
        setTool("ellipse");
       }}
       disabled={shapeToolsDisabled}
       title={shapeToolsDisabled ? "Enter a valid region diffusivity (0.01–10) to draw" : ""}
      >
       Ellipse
      </button>
    </div>

    {tool !== "idle" && (
      <>
       <label className="field">
        <div className="field__label" style={{ marginTop: 7 }}>Material Diffusivity</div>
        <input
          className="input"
          type="text"
          value={diffText}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => onChangeText(e.currentTarget.value)}
          onBlur={onBlur}
          aria-describedby="region-diff-help"
        />
        {outOfRange && (
          <div className="error" id="region-diff-help">
           Diffusivity must be between 0.01 – 10
          </div>
        )}
       </label>

       {shapes.map((s) => {
        const checked = selection.includes(s.id);
        return (
          <div className="shape-item" key={s.id}>
           <input
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              e.target.checked
               ? setSelection([...selection, s.id])
               : setSelection(selection.filter((id) => id !== s.id))
            }
           />
           <div className="kind">{s.kind === "rectangle" ? "Rectangle" : "Ellipse"}</div>
           <div className="meta">D={s.diffusivity}</div>
           <button className="btn btn--ghost" onClick={() => onToggleVisible(s.id)}>
            {s.visible ? "Hide" : "Show"}
           </button>
           <button className="btn btn--ghost" onClick={() => onToggleHighlight(s.id)}>
            Highlight
           </button>
           <button className="btn btn--ghost" onClick={() => onDelete(s.id)}>
            Delete
           </button>
          </div>
        );
       })}
      </>
    )}
   </div>
  );
}
