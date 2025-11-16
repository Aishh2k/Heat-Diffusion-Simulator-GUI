// Public Types used across the frontend components. These types are
// intended for consumers of the UI components and for the API helpers.

export type JobStatus = "idle" | "pending" | "running" | "completed" | "failed";
export type ToolMode = "idle" | "rectangle" | "ellipse";
export type AnyShape = RectShape | EllipseShape;
export type Vec2 = { x: number; y: number };

export type SimulationConfig = {
  total_time: number;
  background_temp: number;
  left_temp: number; right_temp: number;
  top_temp: number;  bottom_temp: number;
  background_diffusivity: number;
};

export type MaterialToolbarProps = {
  tool: ToolMode;
  setTool: (t: ToolMode) => void;
  activeDiff: number;
  setActiveDiff: (v: number) => void;
  ensureMaterial: () => Promise<void>;
  shapes: AnyShape[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onToggleVisible: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onDelete: (id: string) => void;
  clearAllShapes: () => void;
};

export type RectShape = {
  id: string;
  kind: "rectangle";
  diffusivity: number;
  visible: boolean;
  highlighted?: boolean;
  z: number;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
};

export type EllipseShape = {
  id: string;
  kind: "ellipse";
  diffusivity: number;
  visible: boolean;
  highlighted?: boolean;
  z: number;
  center: { x: number; y: number };
  rx: number;
  ry: number;
};

export type Frame = {
  time: number;
  timestep: number;
  grid: number[][];
  min_temp?: number;
  max_temp?: number;
};

// Props for the canvas component (SimulationCanvas)
export type SimulationCanvasProps = {
  frame?: Frame;
  nextFrame?: Frame;
  alpha: number;
  tMin: number;
  tMax: number;

  tool: ToolMode;
  activeDiff: number;
  shapes: AnyShape[];
  onCommitShape: (s: AnyShape) => void;

  width: number;
  height: number;
};

// Props for the shapes list component
export type ShapesListProps = {
  shapes: AnyShape[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onToggleVisible: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onDelete: (id: string) => void;
};

// Lightweight playback props without importing React types into this file
export type PlaybackProps = {
  frames: Frame[];
  frameIdx: number;
  setFrameIdx: (v: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean | ((prev: boolean) => boolean)) => void;
};

export type StartResp = {
  job_id: string;
  status: "pending" | "running";
  message: string;
  location: string;
  grid_size: string;
  time_step: number;
};

export type StatusResp = {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  error: string | null;
  results_location?: string;
  frame_count?: number;
};

export type FrameResp = {
  time: number;
  timestep: number;
  grid: number[][];
  min_temp?: number;
  max_temp?: number;
  mean_temp?: number;
};


export type DataAnalysisProps = {
  frames: Frame[];
};

export type TooltipData =
  | {
      x: number;
      y: number;
      time: number;
      min: number;
      max: number;
      mean: number;
    }
  | null;

