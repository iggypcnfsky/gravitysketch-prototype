"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { createLinkedCanvasForRoom, getCanvasByRoomId } from "@/lib/store";
import { CANVAS_SYNC_EVENT } from "@/lib/canvas-sync";
import { CameraProjectionToggle } from "./CameraProjectionToggle";
import type { CameraProjection } from "./ProjectionCamera";
import { EditorToolbar } from "./EditorToolbar";
import { CanvasGroupMoveHandleProvider } from "./CanvasGroupMoveHandle";
import { Scene } from "./Scene";
import styles from "./EditorViewport.module.css";

const CanvasFlow = dynamic(
  () => import("@/components/canvas/CanvasFlow").then((mod) => mod.CanvasFlow),
  { ssr: false },
);

const MIN_PANE_WIDTH = 280;
const DEFAULT_CANVAS_RATIO = 0.42;

interface EditorViewportProps {
  roomId: string;
  roomName: string;
}

export function EditorViewport({ roomId, roomName }: EditorViewportProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const deselectRef = useRef<(() => void) | null>(null);
  const transformingRef = useRef(false);
  const [splitCanvas, setSplitCanvas] = useState(false);
  const [canvasPaneWidth, setCanvasPaneWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [projection, setProjection] = useState<CameraProjection>("perspective");
  const [linkedCanvas, setLinkedCanvas] = useState(() => getCanvasByRoomId(roomId));

  useEffect(() => {
    const refresh = () => setLinkedCanvas(getCanvasByRoomId(roomId));
    refresh();
    window.addEventListener(CANVAS_SYNC_EVENT, refresh);
    return () => window.removeEventListener(CANVAS_SYNC_EVENT, refresh);
  }, [roomId]);

  const linkedCanvasId = linkedCanvas?.id;

  const handleToggleCanvas = useCallback(() => {
    if (splitCanvas) {
      setSplitCanvas(false);
      return;
    }

    let canvas = linkedCanvas ?? getCanvasByRoomId(roomId);
    if (!canvas) {
      canvas = createLinkedCanvasForRoom(roomId, roomName);
      setLinkedCanvas(canvas);
    }

    if (workspaceRef.current) {
      setCanvasPaneWidth(workspaceRef.current.offsetWidth * DEFAULT_CANVAS_RATIO);
    }
    setSplitCanvas(true);
  }, [splitCanvas, roomId, roomName, linkedCanvas]);

  const handleResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const startX = event.clientX;
    const startWidth =
      canvasPaneWidth ?? workspace.offsetWidth * DEFAULT_CANVAS_RATIO;

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const workspaceWidth = workspace.offsetWidth;
      const maxWidth = workspaceWidth - MIN_PANE_WIDTH;
      const delta = startX - moveEvent.clientX;
      const nextWidth = Math.min(
        Math.max(startWidth + delta, MIN_PANE_WIDTH),
        maxWidth,
      );
      setCanvasPaneWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [canvasPaneWidth]);

  useEffect(() => {
    if (!isResizing) return;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  return (
    <div className={styles.viewport}>
      <EditorToolbar
        roomName={roomName}
        splitCanvas={splitCanvas}
        onToggleCanvas={handleToggleCanvas}
      />

      <div
        ref={workspaceRef}
        className={`${styles.workspace} ${splitCanvas ? styles.workspaceSplit : ""} ${isResizing ? styles.workspaceResizing : ""}`}
      >
        <div className={styles.threePane}>
          <CanvasGroupMoveHandleProvider>
          <div className={styles.canvas3d}>
            <Canvas
              camera={{ position: [4, 2.5, 5], fov: 45, near: 0.01, far: 2000 }}
              gl={{ alpha: true, antialias: true }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
              }}
              onPointerMissed={() => {
                window.setTimeout(() => {
                  if (!transformingRef.current) deselectRef.current?.();
                }, 0);
              }}
            >
              <Scene
                roomId={roomId}
                linkedCanvasId={linkedCanvasId}
                projection={projection}
                transformingRef={transformingRef}
                onRegisterDeselect={(fn) => {
                  deselectRef.current = fn;
                }}
              />
            </Canvas>
          </div>

          <div className={styles.overlays}>
            <button type="button" className={styles.viewpointPill}>
              Add viewpoint
            </button>

            <div className={styles.bottomLeft}>
              <CameraProjectionToggle value={projection} onChange={setProjection} />
            </div>
          </div>
          </CanvasGroupMoveHandleProvider>
        </div>

        {splitCanvas ? (
          <>
            <div
              className={`${styles.resizeHandle} ${isResizing ? styles.resizeHandleActive : ""}`}
              onPointerDown={handleResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize canvas panel"
            />
            <div
              className={styles.canvasPane}
              style={{ width: canvasPaneWidth ?? "42%" }}
            >
              {linkedCanvasId ? (
                <CanvasFlow canvasId={linkedCanvasId} />
              ) : (
                <div className={styles.canvasPaneEmpty}>
                  <p className={styles.canvasPaneEmptyTitle}>No linked canvas</p>
                  <p className={styles.canvasPaneEmptyText}>
                    Link this room to a canvas from the canvas editor to use split view.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
