import { API_BASE, sleep } from "./utils";
import type {
  Frame,
  FrameResp,
  JobStatus,
  SimulationConfig,
  StartResp,
  StatusResp,
} from "./types";

// Start a simulation using the backend API. On success it populates frames
// using the provided callbacks and sets job state. Errors are reported via
// setError. This function aborts after a fixed timeout.
export async function startSimulation(
  cfg: SimulationConfig,
  setStatus: (s: JobStatus) => void,
  setFrames: (f: Frame[]) => void,
  setError: (e: string | null) => void,
  setExpectedFrames: (n: number | null) => void,
  setIsPlaying: (p: boolean) => void,
  setFrameIdx: (u: number) => void
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);
  try {
    setError(null);
    setStatus("pending");
    setFrames([]);
    setExpectedFrames(null);
    setIsPlaying(false);
    setFrameIdx(0);

    const startRes = await fetch(`${API_BASE}/simulations/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        total_time:          cfg.total_time,
        initial_temperature: cfg.background_temp,
        boundary_temperatures: {
          left: cfg.left_temp, right: cfg.right_temp,
          top:  cfg.top_temp,  bottom: cfg.bottom_temp,
        },
        diffusivity: cfg.background_diffusivity,
      }),
    });
    if (!startRes.ok) throw new Error(`Start failed: HTTP ${startRes.status}`);
    const startJson = (await startRes.json()) as StartResp;
    const jobId = startJson.job_id;
    if (!jobId) throw new Error("Missing job_id from /simulations/custom");

    setStatus("running");
    let resultsLocation = "";
    let frameCount = 0;

    for (let tries = 0; tries < 600; tries++) {
      const stRes = await fetch(`${API_BASE}/simulations/${jobId}/status`, { signal: controller.signal });
      if (!stRes.ok) throw new Error(`Status failed: HTTP ${stRes.status}`);
      const st = (await stRes.json()) as StatusResp;

      if (st.status === "failed") throw new Error(st.error || "Backend failed");
      if (st.status === "completed") {
        resultsLocation = st.results_location || `${API_BASE}/simulations/${jobId}/results`;
        frameCount = typeof st.frame_count === "number" ? st.frame_count : 0;
        setExpectedFrames(frameCount || null);
        break;
      }
      await sleep(500);
    }
    if (!resultsLocation) throw new Error("Timed out waiting for completion");
    if (frameCount <= 0) throw new Error("frame_count missing or <= 0");

    const out: Frame[] = new Array(frameCount);
    for (let k = 0; k < frameCount; k++) {
      const frRes = await fetch(`${resultsLocation}?frame=${k}`, { signal: controller.signal });
      if (!frRes.ok) throw new Error(`Frame ${k} failed: HTTP ${frRes.status}`);
      const fr = (await frRes.json()) as FrameResp;
      out[k] = { time: fr.time ?? k, timestep: fr.timestep ?? k, grid: fr.grid, min_temp: fr.min_temp, max_temp: fr.max_temp };
    }

    setFrames(out);
    setFrameIdx(0);
    setStatus("completed");
    setIsPlaying(true); // Auto-start playback on completion
  } catch (err: any) {
    console.error("[API] error", err);
    setStatus("failed");
    setError(err?.name === "AbortError" ? "Request timed out" : (err?.message ?? "Simulation failed"));
  } finally {
    clearTimeout(timeout);
  }
}
