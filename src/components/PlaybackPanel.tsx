// Playback controls and timeline scrubber UI

import React from "react";
import type { PlaybackProps } from "../lib/types";

export default function PlaybackPanel({
  frames, frameIdx, setFrameIdx, isPlaying, setIsPlaying,
}: PlaybackProps) {
  // total number of frames available
  const total = frames.length;

  // Handler for the range input (scrubber)
  const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.currentTarget.value);
    setFrameIdx(v);
    const pct = total > 1 ? (v / (total - 1)) * 100 : 0;
    e.currentTarget.dataset.fill = String(pct);
  };

  return (
    <div>
      {/* Current frame / total display */}
      <div className="muted small" style={{ marginBottom: 8 }}>
        Frame {total ? frameIdx + 1 : 0} of {total}
      </div>

      {/* Range input to scrub through frames */}
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={total ? frameIdx : 0}
        onChange={onRange}
        onInput={onRange}
        className="range"
        data-fill="0"
      />

      <div className="top-gap">
        <div className="segmented">
          {/* Previous frame button */}
          <button onClick={() => setFrameIdx(i => Math.max(0, Number(i) - 1))}>
            Prev
          </button>

          {/* Play / Pause toggle */}
          <button
            className={isPlaying ? "is-active" : ""}
            onClick={() => setIsPlaying(p => !p)}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          {/* Next frame button */}
          <button onClick={() => setFrameIdx(i => Math.min(Math.max(0, total - 1), Number(i) + 1))}>
            Next
          </button>
        </div>
      </div>

      {/* Display simulation time for the current frame (if frames exist) */}
      <div className="muted small top-gap">
        {total
          ? (<>
              <div>Simulation time: <span className="strong">{frames[frameIdx].time.toFixed(3)} s</span></div>
            </>)
          : <div></div>}
      </div>

    </div>
  );
}
