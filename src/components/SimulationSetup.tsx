// Collects configuration for the simulation (time, background temperature, diffusivity, boundaries)

import { useEffect, useState } from "react";
import type { JobStatus, SimulationConfig } from "../lib/types";

export default function SimulationSetup({
  cfg,
  onChange,
  onRun,
  onReset,
  status,
  error,
}: {
  cfg: SimulationConfig;
  onChange: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  onRun: () => void;
  onReset: () => void;
  status: JobStatus;
  error: string | null;
}) {
  const statusText = status === "idle" ? "IDLE" : status.toUpperCase();

  // Validity flags
  const isTimeInvalid = cfg.total_time < 0.1 || cfg.total_time > 2.0;
  const isBgInvalid = cfg.background_temp < 15 || cfg.background_temp > 25;
  const isDiffInvalid =
    cfg.background_diffusivity < 0.01 || cfg.background_diffusivity > 10;
  const boundaryValues = [
    cfg.left_temp,
    cfg.right_temp,
    cfg.top_temp,
    cfg.bottom_temp,
  ];
  const isBoundaryInvalid = boundaryValues.some((v) => v < 0 || v > 100);

  const disableRun =
    isTimeInvalid || isBgInvalid || isDiffInvalid || isBoundaryInvalid;

  return (
    <div className="setup">
      {/* Total time */}
      <NumberField
        label="Total Time (s)"
        value={cfg.total_time}
        min={0.1}
        max={2.0}
        step={0.1}
        errorLabel="Total time must be between 0.1 - 2.0 s"
        onChange={(v) => onChange((s) => ({ ...s, total_time: v }))}
      />

      {/* Background temperature */}
      <NumberField
        label="Background Temperature (°C)"
        value={cfg.background_temp}
        min={15}
        max={25}
        step={0.1}
        errorLabel="Background temperature must be between 15 - 25 °C"
        onChange={(v) => onChange((s) => ({ ...s, background_temp: v }))}
      />

      {/* Boundary temperatures */}
      <div className="grid-2">
        <NumberField
          label="Left (°C)"
          value={cfg.left_temp}
          min={0}
          max={100}
          onChange={(v) => onChange((s) => ({ ...s, left_temp: v }))}
        />
        <NumberField
          label="Right (°C)"
          value={cfg.right_temp}
          min={0}
          max={100}
          onChange={(v) => onChange((s) => ({ ...s, right_temp: v }))}
        />
        <NumberField
          label="Top (°C)"
          value={cfg.top_temp}
          min={0}
          max={100}
          onChange={(v) => onChange((s) => ({ ...s, top_temp: v }))}
        />
        <NumberField
          label="Bottom (°C)"
          value={cfg.bottom_temp}
          min={0}
          max={100}
          onChange={(v) => onChange((s) => ({ ...s, bottom_temp: v }))}
        />
      </div>

      {isBoundaryInvalid && (
        <div className="error">Temperature must be between 0 - 100 °C</div>
      )}

      {/* Diffusivity */}
      <NumberField
        label="Background Diffusivity"
        value={cfg.background_diffusivity}
        min={0.01}
        max={10}
        step={0.01}
        errorLabel="Diffusivity must be between 0.01 – 10"
        onChange={(v) => onChange((s) => ({ ...s, background_diffusivity: v }))}
      />

      <div className="row">
        <button
          onClick={onRun}
          className="btn btn--primary"
          disabled={disableRun}
          title={disableRun ? "Fix invalid inputs before running." : ""}
        >
          Run Simulation
        </button>
        <button onClick={onReset} className="btn btn--ghost">
          Reset
        </button>
      </div>

      <div className="status">
        <div className="muted">
          Status: <span className="status__text">{statusText}</span>
        </div>

        <div className="progress">
          <div
            className="progress__bar"
            style={{
              width:
                status === "running"
                  ? "60%"
                  : status === "pending"
                  ? "25%"
                  : status === "completed"
                  ? "100%"
                  : "0%",
            }}
          />
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

/* Reusable number input with parsing/validation */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  errorLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  errorLabel?: string;
}) {
  const [text, setText] = useState<string>(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const parse = (s: string): number | null => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const n = parse(text);
  const isOutOfRange = n !== null && (n < min || n > max);
  const message = errorLabel ?? `Temperature must be between ${min} – ${max}`;

  return (
    <label className="field">
      <div className="field__label">{label}</div>
      <input
        type="number"
        className="input"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const s = e.currentTarget.value;
          setText(s);
          const p = parse(s);
          if (p !== null) onChange(p);
        }}
        onBlur={(e) => {
          const p = parse(e.currentTarget.value);
          const finalVal = p === null ? min : Math.max(min, Math.min(max, p));
          const normalized = String(finalVal);
          if (normalized !== text) setText(normalized);
          if (finalVal !== value) onChange(finalVal);
        }}
      />
      {errorLabel && isOutOfRange && <div className="error">{message}</div>}
    </label>
  );
}
