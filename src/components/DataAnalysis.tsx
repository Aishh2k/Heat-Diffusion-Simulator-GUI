// Render simulation statistics (min/mean/max) over time with hover tooltip and CSV export.

import { useMemo, useState, useRef } from "react";
import type { DataAnalysisProps, TooltipData } from "../lib/types";

export default function DataAnalysis({ frames }: DataAnalysisProps) {
  // Tooltip state and refs for positioning
  const [tooltip, setTooltip] = useState<TooltipData>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute min, max, mean per frame
  const statsData = useMemo(() => {
    return frames.map((frame) => {
      let min = frame.min_temp;
      let max = frame.max_temp;
      let sum = 0;
      let count = 0;

      // Calculate stats from grid if not provided
      if (min === undefined || max === undefined) {
        min = Infinity;
        max = -Infinity;
        for (const row of frame.grid) {
          for (const temp of row) {
            if (temp < min) min = temp;
            if (temp > max) max = temp;
            sum += temp;
            count++;
          }
        }
      } else {
        // Still calculate mean
        for (const row of frame.grid) {
          for (const temp of row) {
            sum += temp;
            count++;
          }
        }
      }

      const mean = count > 0 ? sum / count : 0;
      return {
        time: frame.time,
        min,
        max,
        mean,
      };
    });
  }, [frames]);

  // Chart layout
  const width = 100;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 15, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute scales extents with small padding
  const { minY, maxY, minX, maxX } = useMemo(() => {
    if (statsData.length === 0) {
      return { minY: 0, maxY: 100, minX: 0, maxX: 1 };
    }

    const allTemps = statsData.flatMap((d) => [d.min, d.max, d.mean]);
    const minY = Math.min(...allTemps);
    const maxY = Math.max(...allTemps);
    const range = maxY - minY;
    const minX = statsData[0].time;
    const maxX = statsData[statsData.length - 1].time;

    return {
      minY: minY - range * 0.1,
      maxY: maxY + range * 0.1,
      minX,
      maxX,
    };
  }, [statsData]);

  // Scale functions
  const scaleX = (time: number) => {
    if (maxX === minX) return padding.left;
    return padding.left + ((time - minX) / (maxX - minX)) * chartWidth;
  };

  const scaleY = (temp: number) => {
    if (maxY === minY) return padding.top + chartHeight / 2;
    return (
      padding.top +
      chartHeight -
      ((temp - minY) / (maxY - minY)) * chartHeight
    );
  };

  // Create SVG path for a given key (min/mean/max)
  const createPath = (data: typeof statsData, key: "min" | "max" | "mean") => {
    if (data.length === 0) return "";
    return data
      .map((d, i) => {
        const x = scaleX(d.time);
        const y = scaleY(d[key]);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const value = minY + (maxY - minY) * (i / tickCount);
      ticks.push(value);
    }
    return ticks;
  }, [minY, maxY]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const value = minX + (maxX - minX) * (i / tickCount);
      ticks.push(value);
    }
    return ticks;
  }, [minX, maxX]);

  // Mouse handlers for tooltip positioning and nearest datapoint lookup
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !containerRef.current || statsData.length === 0)
      return;

    const rect = svgRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    if (svgX < padding.left || svgX > width - padding.right) {
      setTooltip(null);
      return;
    }

    // Map mouse x to time and find nearest frame
    const time =
      minX + ((svgX - padding.left) / chartWidth) * (maxX - minX);
    let closestIdx = 0;
    let minDist = Infinity;

    statsData.forEach((d, i) => {
      const dist = Math.abs(d.time - time);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });

    const dataPoint = statsData[closestIdx];

    // Position tooltip relative to container
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;

    setTooltip({
      x: relativeX,
      y: relativeY,
      time: dataPoint.time,
      min: dataPoint.min,
      max: dataPoint.max,
      mean: dataPoint.mean,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Export stats to CSV
  const exportStatsCSV = () => {
    const headers = [
      "Time",
      "Min Temperature",
      "Mean Temperature",
      "Max Temperature",
    ];
    const rows = statsData.map((d) => [
      d.time.toFixed(3),
      d.min.toFixed(6),
      d.mean.toFixed(6),
      d.max.toFixed(6),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `heat_simulation_stats_${Date.now()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (statsData.length === 0) {
    return <div className="stats-chart-no-data">No data available</div>;
  }

  return (
    <div className="stats-chart-container" ref={containerRef}>
      <div style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="stats-chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`y-grid-${i}`}
              x1={padding.left}
              y1={scaleY(tick)}
              x2={width - padding.right}
              y2={scaleY(tick)}
              className="stats-chart-grid-line"
            />
          ))}

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, i) => (
            <text
              key={`y-tick-${i}`}
              x={padding.left - 2}
              y={scaleY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="stats-chart-axis-tick"
            >
              {tick.toFixed(0)}
            </text>
          ))}

          {/* X-axis ticks and labels */}
          {xTicks.map((tick, i) => (
            <text
              key={`x-tick-${i}`}
              x={scaleX(tick)}
              y={height - padding.bottom + 4}
              textAnchor="middle"
              className="stats-chart-axis-tick"
            >
              {tick.toFixed(1)}
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 2}
            textAnchor="middle"
            className="stats-chart-axis-label"
          >
            Time (s)
          </text>

          <text
            x={3}
            y={height / 2}
            textAnchor="middle"
            className="stats-chart-axis-label"
            transform={`rotate(-90, 3, ${height / 2})`}
          >
            Temperature (°C)
          </text>

          {/* Hover visuals */}
          {tooltip && (
            <>
              <line
                x1={scaleX(tooltip.time)}
                y1={padding.top}
                x2={scaleX(tooltip.time)}
                y2={height - padding.bottom}
                className="stats-chart-hover-line"
              />
              <circle
                cx={scaleX(tooltip.time)}
                cy={scaleY(tooltip.min)}
                r="0.8"
                className="stats-chart-hover-circle"
                stroke="#2bd4ff"
              />
              <circle
                cx={scaleX(tooltip.time)}
                cy={scaleY(tooltip.mean)}
                r="0.8"
                className="stats-chart-hover-circle"
                stroke="#34C759"
              />
              <circle
                cx={scaleX(tooltip.time)}
                cy={scaleY(tooltip.max)}
                r="0.8"
                className="stats-chart-hover-circle"
                stroke="#FF453A"
              />
            </>
          )}

          {/* Data lines */}
          <path d={createPath(statsData, "min")} className="stats-chart-line-min" />
          <path d={createPath(statsData, "mean")} className="stats-chart-line-mean" />
          <path d={createPath(statsData, "max")} className="stats-chart-line-max" />
        </svg>

        {/* Tooltip panel */}
        {tooltip && (
          <div
            className="stats-chart-tooltip"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 80,
            }}
          >
            <div className="stats-chart-tooltip-time">
              Time: {tooltip.time.toFixed(3)} s
            </div>

            <div className="stats-chart-tooltip-row">
              <div className="stats-chart-tooltip-label">
                <div
                  className="stats-chart-tooltip-dot"
                  style={{ background: "#2bd4ff" }}
                ></div>
                Min
              </div>
              <div className="stats-chart-tooltip-value">
                {tooltip.min.toFixed(2)} °C
              </div>
            </div>

            <div className="stats-chart-tooltip-row">
              <div className="stats-chart-tooltip-label">
                <div
                  className="stats-chart-tooltip-dot"
                  style={{ background: "#34C759" }}
                ></div>
                Mean
              </div>
              <div className="stats-chart-tooltip-value">
                {tooltip.mean.toFixed(2)} °C
              </div>
            </div>

            <div className="stats-chart-tooltip-row">
              <div className="stats-chart-tooltip-label">
                <div
                  className="stats-chart-tooltip-dot"
                  style={{ background: "#FF453A" }}
                ></div>
                Max
              </div>
              <div className="stats-chart-tooltip-value">
                {tooltip.max.toFixed(2)} °C
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export button */}
      <div className="stats-export-buttons">
        <button className="btn btn--export" onClick={exportStatsCSV}>
          <span>📊</span> Export Data (CSV)
        </button>
      </div>
    </div>
  );
}
