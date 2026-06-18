"use client";

import { useCallback, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import type { ImageReferenceData } from "@/lib/canvas-sync";
import { IMAGE_NODE_HEIGHT, IMAGE_NODE_WIDTH } from "@/lib/canvas-sync";
import { useCanvasNodeActions } from "./CanvasNodeContext";
import { CanvasTransformHandles } from "./CanvasTransformHandles";
import styles from "./ImagePlaceholderNode.module.css";

export function ImagePlaceholderNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ImageReferenceData;
  const { syncElement } = useCanvasNodeActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const seed = nodeData.seed ?? "placeholder";
  const scale = nodeData.scale ?? 1;
  const rotation = nodeData.rotation ?? 0;
  const imageUrl = `https://picsum.photos/seed/${seed}/320/240`;

  const applyPatch = useCallback(
    (patch: Partial<ImageReferenceData>) => {
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
            "--image-width": `${IMAGE_NODE_WIDTH}px`,
            "--image-height": `${IMAGE_NODE_HEIGHT}px`,
            "--image-scale": scale,
            "--image-rotation": `${rotation}deg`,
          } as React.CSSProperties
        }
      >
        <div className={`${styles.imageWrap} ${selected ? styles.imageWrapSelected : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className={styles.image} draggable={false} />
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
