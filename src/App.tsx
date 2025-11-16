import { useEffect, useMemo, useRef, useState } from "react";
import type { Frame, JobStatus, SimulationConfig, ToolMode, AnyShape } from "./lib/types";
import { DEFAULT_CFG, FRAMES_PER_SECOND, frameMinMax, API_BASE, CANVAS_SIZE } from "./lib/utils";
import "./App.css";

/* Canvas + UI */
import SimulationCanvas from "./components/SimulationCanvas";
import PlaybackPanel from "./components/PlaybackPanel";
import SimulationSetup from "./components/SimulationSetup";
import DataAnalysis from "./components/DataAnalysis";
import MaterialToolbar from "./components/MaterialToolbar";

/* ----------------------------- API calls --------------------------------- */
async function startSimulationL1(
  cfg: SimulationConfig,
  setStatus: (s: JobStatus) => void,
  setFrames: (f: Frame[]) => void,
  setError: (e: string | null) => void,
  setIsPlaying: (p: boolean) => void,
  setFrameIdx: (u: number) => void
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    setError(null);
    setStatus("pending");
    setFrames([]);
    setIsPlaying(false);
    setFrameIdx(0);

    const startRes = await fetch(`${API_BASE}/simulations/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        total_time: cfg.total_time,
        initial_temperature: cfg.background_temp,
        boundary_temperatures: {
          left: cfg.left_temp,
          right: cfg.right_temp,
          top: cfg.top_temp,
          bottom: cfg.bottom_temp,
        },
        diffusivity: cfg.background_diffusivity,
      }),
    });
    if (!startRes.ok) throw new Error(`Start failed: HTTP ${startRes.status}`);
    const { job_id } = (await startRes.json()) as { job_id: string };
    if (!job_id) throw new Error("Missing job_id");

    setStatus("running");
    let resultsLocation = "";
    let frameCount = 0;
    for (let tries = 0; tries < 180; tries++) {
      const stRes = await fetch(`${API_BASE}/simulations/${job_id}/status`, {
        signal: controller.signal,
      });
      if (!stRes.ok) throw new Error(`Status failed: HTTP ${stRes.status}`);
      const st = (await stRes.json()) as any;
      if (st.status === "failed") throw new Error(st.error || "Backend failed");
      if (st.status === "completed") {
        resultsLocation =
          st.results_location || `${API_BASE}/simulations/${job_id}/results`;
        frameCount =
          typeof st.frame_count === "number" ? st.frame_count : 0;
        break;
      }
      await new Promise((res) => setTimeout(res, 500));
    }
    if (!resultsLocation) throw new Error("Timed out waiting for completion");
    if (frameCount <= 0) throw new Error("frame_count missing or <= 0");

    const out: Frame[] = new Array(frameCount);
    for (let k = 0; k < frameCount; k++) {
      const frRes = await fetch(`${resultsLocation}?frame=${k}`, {
        signal: controller.signal,
      });
      if (!frRes.ok) throw new Error(`Frame ${k} failed: HTTP ${frRes.status}`);
      const fr = (await frRes.json()) as any;
      out[k] = {
        time: fr.time ?? k,
        timestep: fr.timestep ?? k,
        grid: fr.grid,
        min_temp: fr.min_temp,
        max_temp: fr.max_temp,
      };
    }

    setFrames(out);
    setFrameIdx(0);
    setStatus("completed");
    setIsPlaying(true);
  } catch (err: any) {
    setStatus("failed");
    setError(
      err?.name === "AbortError"
        ? "Request timed out"
        : err?.message ?? "Simulation failed"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Level 2 (with material map) */
async function startSimulationWithMaterial(
  materialId: string,
  cfg: SimulationConfig,
  setStatus: (s: JobStatus) => void,
  setFrames: (f: Frame[]) => void,
  setError: (e: string | null) => void,
  setIsPlaying: (p: boolean) => void,
  setFrameIdx: (u: number) => void
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    setError(null);
    setStatus("pending");
    setFrames([]);
    setIsPlaying(false);
    setFrameIdx(0);

    const startRes = await fetch(`${API_BASE}/simulations/with-material`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        material_id: materialId,
        total_time: cfg.total_time,
        initial_temperature: cfg.background_temp,
        boundary_temperatures: {
          left: cfg.left_temp,
          right: cfg.right_temp,
          top: cfg.top_temp,
          bottom: cfg.bottom_temp,
        },
      }),
    });
    if (!startRes.ok)
      throw new Error(`Start (with-material) failed: HTTP ${startRes.status}`);
    const { job_id } = (await startRes.json()) as { job_id: string };
    if (!job_id) throw new Error("Missing job_id");

    setStatus("running");
    let resultsLocation = "";
    let frameCount = 0;
    for (let tries = 0; tries < 180; tries++) {
      const stRes = await fetch(`${API_BASE}/simulations/${job_id}/status`, {
        signal: controller.signal,
      });
      if (!stRes.ok) throw new Error(`Status failed: HTTP ${stRes.status}`);
      const st = (await stRes.json()) as any;
      if (st.status === "failed") throw new Error(st.error || "Backend failed");
      if (st.status === "completed") {
        resultsLocation =
          st.results_location || `${API_BASE}/simulations/${job_id}/results`;
        frameCount =
          typeof st.frame_count === "number" ? st.frame_count : 0;
        break;
      }
      await new Promise((res) => setTimeout(res, 500));
    }
    if (!resultsLocation) throw new Error("Timed out waiting for completion");
    if (frameCount <= 0) throw new Error("frame_count missing or <= 0");

    const out: Frame[] = new Array(frameCount);
    for (let k = 0; k < frameCount; k++) {
      const frRes = await fetch(`${resultsLocation}?frame=${k}`, {
        signal: controller.signal,
      });
      if (!frRes.ok) throw new Error(`Frame ${k} failed: HTTP ${frRes.status}`);
      const fr = (await frRes.json()) as any;
      out[k] = {
        time: fr.time ?? k,
        timestep: fr.timestep ?? k,
        grid: fr.grid,
        min_temp: fr.min_temp,
        max_temp: fr.max_temp,
      };
    }

    setFrames(out);
    setFrameIdx(0);
    setStatus("completed");
    setIsPlaying(true);
  } catch (err: any) {
    setStatus("failed");
    setError(
      err?.name === "AbortError"
        ? "Request timed out"
        : err?.message ?? "Simulation failed"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/* --------------------------------- App ----------------------------------- */
export default function App() {
  /* Level 1 state */
  const [cfg, setCfg] = useState<SimulationConfig>({ ...DEFAULT_CFG });
  const [status, setStatus] = useState<JobStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const alphaRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      alphaRef.current += dt * FRAMES_PER_SECOND;
      while (alphaRef.current >= 1) {
        setFrameIdx((i) => (i + 1) % frames.length);
        alphaRef.current -= 1;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, frames.length]);

  useEffect(() => {
    alphaRef.current = 0;
  }, [frameIdx]);

  const current = frames[frameIdx];
  const next =
    frames.length > 0 ? frames[(frameIdx + 1) % frames.length] : undefined;
  const [tMin, tMax] = useMemo<[number, number]>(
    () => frameMinMax(current),
    [current]
  );

  /* Level 2 (materials) */
  const [tool, setTool] = useState<ToolMode>("idle");
  const [activeDiff, setActiveDiff] = useState<number>(1); // numeric backing value
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const zCounter = useRef(0);

  /** Export current canvas frame as PNG */
  const exportCanvasPNG = () => {
    // Find the canvas element in the canvas-wrap div
    const canvasWrap = document.querySelector('.canvas-wrap');
    const canvas = canvasWrap?.querySelector('canvas') as HTMLCanvasElement | null;
    
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `heat_simulation_frame_${frameIdx}_${Date.now()}.png`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  /** Create a backend material lazily when needed. */
  const ensureMaterial = async () => {
    if (materialId) return;
    const res = await fetch(`${API_BASE}/materials/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        width: 100,
        height: 100,
        base_diffusivity: cfg.background_diffusivity,
      }),
    });
    if (!res.ok) throw new Error(`Material create failed: ${res.status}`);
    const data = (await res.json()) as { material_id: string };
    setMaterialId(data.material_id);
  };

  /** Accept a completed shape from the canvas */
  const handleCommitShape = async (shape: AnyShape) => {
    if (!materialId) await ensureMaterial();
    const mid = materialId!;

    const z = ++zCounter.current;
    setShapes((s) => [...s, { ...shape, z, visible: true }]);

    if (shape.kind === "rectangle") {
      const x = Math.min((shape as any).p0.x, (shape as any).p1.x);
      const y = Math.min((shape as any).p0.y, (shape as any).p1.y);
      const rect_width = Math.abs((shape as any).p1.x - (shape as any).p0.x) + 1;
      const rect_height =
        Math.abs((shape as any).p1.y - (shape as any).p0.y) + 1;
      await fetch(`${API_BASE}/materials/${mid}/add-rectangle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x,
          y,
          rect_width,
          rect_height,
          diffusivity: shape.diffusivity,
        }),
      });
    } else {
      await fetch(`${API_BASE}/materials/${mid}/add-ellipse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          center_x: (shape as any).center.x,
          center_y: (shape as any).center.y,
          semi_major: (shape as any).rx,
          semi_minor: (shape as any).ry,
          angle: 0,
          diffusivity: shape.diffusivity,
        }),
      });
    }
  };

  /** One run button: if we have a material + shapes, run level 2; else level 1. */
  const run = async () => {
    if (materialId && shapes.length > 0) {
      await startSimulationWithMaterial(
        materialId,
        cfg,
        setStatus,
        setFrames,
        setError,
        setIsPlaying,
        setFrameIdx
      );
    } else {
      await startSimulationL1(
        cfg,
        setStatus,
        setFrames,
        setError,
        setIsPlaying,
        setFrameIdx
      );
    }
  };

  /** Full reset (UI + materials state) */
  const hardReset = () => {
    setCfg({ ...DEFAULT_CFG });
    setFrames([]);
    setFrameIdx(0);
    setStatus("idle");
    setError(null);
    setIsPlaying(false);
    alphaRef.current = 0;

    setTool("idle");
    setActiveDiff(1);
    setShapes([]);
    setSelection([]);
    setMaterialId(null);
    zCounter.current = 0;
  };

  /* Simple toggles for object list */
  const toggleVisible = (id: string) =>
    setShapes((v) => v.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  const toggleHighlight = (id: string) =>
    setShapes((v) =>
      v.map((s) => (s.id === id ? { ...s, highlighted: !s.highlighted } : s))
    );
  const deleteShape = (id: string) => {
    setShapes((v) => v.filter((s) => s.id !== id));
    setSelection((sel) => sel.filter((sid) => sid !== id));
  };
  const clearAllShapes = () => {
    setShapes([]);
    setSelection([]);
    setMaterialId(null);
    setTool("idle");
  };

  return (
    <div>
      <header className="header">
        <div className="header__inner">
          <div className="brand">
            <h1 className="brand__title">Heat Simulator Graphical User Interface</h1>
          </div>
        </div>
      </header>

      <main className="container layout">
        {/* LEFT: Simulation Setup + MATERIAL TOOLBAR */}
        <section className="col-left">
          <div className="panel">
            <h2 className="panel__title">Simulation Setup</h2>

            <MaterialToolbar
              tool={tool}
              setTool={setTool}
              activeDiff={activeDiff}         
              setActiveDiff={setActiveDiff}   
              ensureMaterial={ensureMaterial}
              shapes={shapes}
              selection={selection}
              setSelection={setSelection}
              onToggleVisible={toggleVisible}
              onToggleHighlight={toggleHighlight}
              onDelete={deleteShape}
              clearAllShapes={clearAllShapes}
            />

            <SimulationSetup
              cfg={cfg}
              onChange={setCfg}
              onRun={run}
              onReset={hardReset}
              status={status}
              error={error}
            />
          </div>
        </section>

        {/* CENTER: Canvas */}
        <section className="col-center">
          <div className="panel">
            <h2 className="panel__title">Simulation Canvas</h2>
            <div className="canvas-wrap">
              <SimulationCanvas
                frame={current}
                nextFrame={next}
                alpha={alphaRef.current}
                tMin={tMin}
                tMax={tMax}
                tool={tool}
                activeDiff={activeDiff}
                shapes={shapes}
                onCommitShape={handleCommitShape}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
              />
            </div>
            {status === "completed" && frames.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <button className="btn btn--export" onClick={exportCanvasPNG} style={{ width: "100%" }}>
                  <span>🖼️</span> Export Current Frame (PNG)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Playback */}
        <section className="col-right">
          <div className="panel">
            <h2 className="panel__title">Playback</h2>
            <p className="muted">Scrub or play the frames after simulation</p>
            <PlaybackPanel
              frames={frames}
              frameIdx={frameIdx}
              setFrameIdx={(v) => {
                setFrameIdx(v);
                alphaRef.current = 0;
              }}
              isPlaying={isPlaying}
              setIsPlaying={(v) => {
                setIsPlaying(v);
                lastTsRef.current = null;
              }}
            />

            {status === "completed" && frames.length > 0 && (
              <>
                <DataAnalysis frames={frames} />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}