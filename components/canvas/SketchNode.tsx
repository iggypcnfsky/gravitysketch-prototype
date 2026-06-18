"use client";

import { useCallback, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import { pointsToPath, type CanvasSketchData } from "@/lib/canvas-sync";
import { useCanvasNodeActions } from "./CanvasNodeContext";
import { CanvasTransformHandles } from "./CanvasTransformHandles";
import styles from "./SketchNode.module.css";

export function SketchNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CanvasSketchData;
  const { syncElement } = useCanvasNodeActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const width = nodeData.width ?? 1;
  const height = nodeData.height ?? 1;
  const scale = nodeData.scale ?? 1;
  const rotation = nodeData.rotation ?? 0;
  const strokes = nodeData.strokes ?? [];

  const applyPatch = useCallback(
    (patch: Partial<CanvasSketchData>) => {
      syncElement(id, patch);
    },
    [id, syncElement],
  );

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={styles.transformWrap}
        style={
          {
            "--sketch-width": `${width}px`,
            "--sketch-height": `${height}px`,
            "--sketch-scale": scale,
            "--sketch-rotation": `${rotation}deg`,
          } as React.CSSProperties
        }
      >
        <div className={`${styles.sketchWrap} ${selected ? styles.sketchWrapSelected : ""}`}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            aria-hidden
          >
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
        </div>
      </div>

      {selected ? (
        <CanvasTransformHandles
          rootRef={rootRef}
          rotation={rotation}
          scale={scale}
          onChange={applyPatch}
        />
      ) : null}
    </div>
  );
}
