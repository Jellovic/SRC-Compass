"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { ClusterLayoutItem } from "@/lib/store";

const CLUSTER_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

const PADDING = 32;
const NODE_RADIUS = 10;
const HIT_RADIUS = 16;

type Props = {
  layout: ClusterLayoutItem[];
};

export function WordMap({ layout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [points, setPoints] = useState<ClusterLayoutItem[]>(layout);
  const draggingIndexRef = useRef<number | null>(null);

  // When a new analysis result comes in, reset the points.
  useEffect(() => {
    setPoints(layout);
  }, [layout]);

  // Draw the current points onto the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const width = (parent?.clientWidth ?? 600) - 4;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    for (const item of points) {
      const color =
        CLUSTER_COLORS[item.clusterIndex % CLUSTER_COLORS.length] ??
        "#6b7280";

      const x = PADDING + item.x * (width - PADDING * 2);
      const y = PADDING + item.y * (height - PADDING * 2);

      ctx.beginPath();
      ctx.fillStyle = color + "99";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#111827";
      ctx.textBaseline = "middle";
      ctx.fillText(item.term, x + NODE_RADIUS + 4, y);
    }
  }, [points]);

  function getCanvasCoords(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, width: canvas.width, height: canvas.height };
  }

  function findPointIndexAtPosition(
    xPx: number,
    yPx: number,
    width: number,
    height: number
  ): number | null {
    const innerWidth = width - PADDING * 2;
    const innerHeight = height - PADDING * 2;

    for (let i = points.length - 1; i >= 0; i -= 1) {
      const item = points[i];
      const px = PADDING + item.x * innerWidth;
      const py = PADDING + item.y * innerHeight;
      const dx = xPx - px;
      const dy = yPx - py;
      if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) {
        return i;
      }
    }
    return null;
  }

  function handleMouseDown(e: MouseEvent<HTMLCanvasElement>) {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { x, y, width, height } = coords;
    const idx = findPointIndexAtPosition(x, y, width, height);
    if (idx !== null) {
      draggingIndexRef.current = idx;
    }
  }

  function handleMouseMove(e: MouseEvent<HTMLCanvasElement>) {
    const idx = draggingIndexRef.current;
    if (idx === null) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { x, y, width, height } = coords;

    const innerWidth = width - PADDING * 2;
    const innerHeight = height - PADDING * 2;

    let nx = (x - PADDING) / innerWidth;
    let ny = (y - PADDING) / innerHeight;

    nx = Math.min(0.95, Math.max(0.05, nx));
    ny = Math.min(0.95, Math.max(0.05, ny));

    setPoints((prev) => {
      if (!prev[idx]) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], x: nx, y: ny };
      return next;
    });
  }

  function endDrag() {
    draggingIndexRef.current = null;
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "word-map.png";
    link.click();
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="h-[360px] w-full rounded border border-zinc-200 bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">
          Drag words to manually cluster them. Download saves the current
          arrangement.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:border-zinc-500"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}


