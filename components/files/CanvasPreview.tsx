"use client";

import { useMemo } from "react";
import type { Node } from "@xyflow/react";
import { pointsToPath } from "@/lib/canvas-sync";
import { getCanvas } from "@/lib/store";
import styles from "./CanvasPreview.module.css";

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 150;
const PREVIEW_PADDING = 18;

const NODE_SIZES: Record<string, { width: number; height: number }> = {
  imagePlaceholder: { width: 160, height: 120 },
  boatSketch: { width: 420, height: 260 },
  canvasText: { width: 120, height: 40 },
  canvasSketch: { width: 120, height: 90 },
};

function getNodeSize(node: Node) {
  if (node.type === "canvasSketch") {
    const data = node.data as { width?: number; height?: number; scale?: number };
    const scale = data.scale ?? 1;
    return {
      width: (data.width ?? 120) * scale,
      height: (data.height ?? 90) * scale,
    };
  }

  return NODE_SIZES[node.type ?? ""] ?? { width: 120, height: 90 };
}

interface CanvasPreviewProps {
  canvasId: string;
}

function getBounds(nodes: Node[]) {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const size = getNodeSize(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + size.width);
    maxY = Math.max(maxY, node.position.y + size.height);
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function BoatSketchPreview() {
  return (
    <svg width="420" height="260" viewBox="0 0 420 260" aria-hidden>
      <path
        d="M80 160C120 110 180 95 210 100C240 105 300 120 340 160"
        fill="none"
        stroke="#7B3FF2"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M100 175C150 145 270 145 320 175"
        fill="none"
        stroke="#7B3FF2"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M130 130C170 115 250 115 290 130"
        fill="none"
        stroke="#AAAAAA"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <ellipse cx="210" cy="185" rx="90" ry="18" fill="none" stroke="#CCCCCC" strokeDasharray="4 4" />
    </svg>
  );
}

function ImagePreview({ seed }: { seed: string }) {
  return (
    <div className={styles.imageNode}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://picsum.photos/seed/${seed}/320/240`}
        alt=""
        className={styles.imageNodeImg}
        draggable={false}
      />
    </div>
  );
}

function SketchPreview({
  width,
  height,
  strokes,
}: {
  width: number;
  height: number;
  strokes: Array<{ id: string; points: number[]; color: string; strokeWidth: number }>;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function PreviewNode({ node }: { node: Node }) {
  const size = getNodeSize(node);

  return (
    <div
      className={styles.previewNode}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {node.type === "boatSketch" ? (
        <BoatSketchPreview />
      ) : node.type === "imagePlaceholder" ? (
        <ImagePreview seed={(node.data as { seed?: string })?.seed ?? node.id} />
      ) : node.type === "canvasText" ? (
        <div
          className={styles.textNode}
          style={{
            fontSize: `${((node.data as { fontSize?: number })?.fontSize ?? 28) * ((node.data as { scale?: number })?.scale ?? 1)}px`,
            transform: `rotate(${(node.data as { rotation?: number })?.rotation ?? 0}deg)`,
          }}
        >
          {(node.data as { text?: string })?.text ?? "Text"}
        </div>
      ) : node.type === "canvasSketch" ? (
        <SketchPreview
          width={(node.data as { width?: number })?.width ?? size.width}
          height={(node.data as { height?: number })?.height ?? size.height}
          strokes={(node.data as { strokes?: Array<{ id: string; points: number[]; color: string; strokeWidth: number }> })?.strokes ?? []}
        />
      ) : null}
    </div>
  );
}

export function CanvasPreview({ canvasId }: CanvasPreviewProps) {
  const layout = useMemo(() => {
    const canvas = getCanvas(canvasId);
    const nodes = canvas?.nodes ?? [];
    const bounds = getBounds(nodes);
    if (!bounds) return null;

    const scale = Math.min(
      (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
      (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height,
      0.42,
    );

    const offsetX =
      (PREVIEW_WIDTH - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY =
      (PREVIEW_HEIGHT - bounds.height * scale) / 2 - bounds.minY * scale;

    return { nodes, scale, offsetX, offsetY };
  }, [canvasId]);

  if (!layout || layout.nodes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyCurve} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.content}
        style={{
          transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
        }}
      >
        {layout.nodes.map((node) => (
          <PreviewNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
