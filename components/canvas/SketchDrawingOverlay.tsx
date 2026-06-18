"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, type Viewport } from "@xyflow/react";
import {
  DEFAULT_SKETCH_STROKE_COLOR,
  pointsToPath,
  SKETCH_ERASER_RADIUS,
  type SketchStroke,
} from "@/lib/canvas-sync";
import styles from "./SketchDrawingOverlay.module.css";

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function strokeHitsEraser(stroke: SketchStroke, x: number, y: number, radius: number) {
  const points = stroke.points;
  if (points.length < 2) return false;

  if (points.length === 2) {
    return Math.hypot(x - points[0], y - points[1]) <= radius + stroke.strokeWidth / 2;
  }

  for (let i = 0; i < points.length - 2; i += 2) {
    const dist = distanceToSegment(
      x,
      y,
      points[i],
      points[i + 1],
      points[i + 2],
      points[i + 3],
    );
    if (dist <= radius + stroke.strokeWidth / 2) return true;
  }

  return false;
}

function eraseStrokesAt(strokes: SketchStroke[], x: number, y: number, radius: number) {
  return strokes.filter((stroke) => !strokeHitsEraser(stroke, x, y, radius));
}

interface SketchDrawingOverlayProps {
  mode: "draw" | "erase";
  sessionStrokes: SketchStroke[];
  strokeWidth: number;
  viewport: Viewport;
  onSessionStrokesChange: (strokes: SketchStroke[]) => void;
}

export function SketchDrawingOverlay({
  mode,
  sessionStrokes,
  strokeWidth,
  viewport,
  onSessionStrokesChange,
}: SketchDrawingOverlayProps) {
  const { screenToFlowPosition } = useReactFlow();
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeStrokeRef = useRef<SketchStroke | null>(null);
  const sessionStrokesRef = useRef(sessionStrokes);
  const strokeWidthRef = useRef(strokeWidth);
  const [activeStroke, setActiveStroke] = useState<SketchStroke | null>(null);
  const isErasingRef = useRef(false);

  sessionStrokesRef.current = sessionStrokes;
  strokeWidthRef.current = strokeWidth;

  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;

    const blockTouch = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };

    const blockSelection = (event: Event) => {
      event.preventDefault();
    };

    element.addEventListener("touchstart", blockTouch, { passive: false });
    element.addEventListener("touchmove", blockTouch, { passive: false });
    element.addEventListener("selectstart", blockSelection);
    element.addEventListener("contextmenu", blockSelection);

    return () => {
      element.removeEventListener("touchstart", blockTouch);
      element.removeEventListener("touchmove", blockTouch);
      element.removeEventListener("selectstart", blockSelection);
      element.removeEventListener("contextmenu", blockSelection);
    };
  }, []);

  const toFlowPosition = useCallback(
    (clientX: number, clientY: number) =>
      screenToFlowPosition({ x: clientX, y: clientY }),
    [screenToFlowPosition],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      const flowPoint = toFlowPosition(event.clientX, event.clientY);

      if (mode === "erase") {
        isErasingRef.current = true;
        onSessionStrokesChange(
          eraseStrokesAt(
            sessionStrokesRef.current,
            flowPoint.x,
            flowPoint.y,
            SKETCH_ERASER_RADIUS,
          ),
        );
        return;
      }

      const stroke: SketchStroke = {
        id: `stroke-${Date.now()}`,
        points: [flowPoint.x, flowPoint.y],
        color: DEFAULT_SKETCH_STROKE_COLOR,
        strokeWidth: strokeWidthRef.current,
      };
      activeStrokeRef.current = stroke;
      setActiveStroke(stroke);
    },
    [mode, onSessionStrokesChange, toFlowPosition],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const flowPoint = toFlowPosition(event.clientX, event.clientY);

      if (mode === "erase" && isErasingRef.current) {
        onSessionStrokesChange(
          eraseStrokesAt(
            sessionStrokesRef.current,
            flowPoint.x,
            flowPoint.y,
            SKETCH_ERASER_RADIUS,
          ),
        );
        return;
      }

      const currentStroke = activeStrokeRef.current;
      if (!currentStroke) return;

      const nextStroke: SketchStroke = {
        ...currentStroke,
        points: [...currentStroke.points, flowPoint.x, flowPoint.y],
      };
      activeStrokeRef.current = nextStroke;
      setActiveStroke(nextStroke);
    },
    [mode, toFlowPosition],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (mode === "erase") {
        isErasingRef.current = false;
        return;
      }

      const currentStroke = activeStrokeRef.current;
      if (!currentStroke) return;

      let points = currentStroke.points;
      if (points.length === 2) {
        points = [points[0], points[1], points[0] + 0.01, points[1] + 0.01];
      }

      if (points.length >= 4) {
        onSessionStrokesChange([
          ...sessionStrokesRef.current,
          { ...currentStroke, points },
        ]);
      }

      activeStrokeRef.current = null;
      setActiveStroke(null);
    },
    [mode, onSessionStrokesChange],
  );

  const previewStrokes = activeStroke ? [...sessionStrokes, activeStroke] : sessionStrokes;

  const blockGesture = useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${mode === "erase" ? styles.overlayErase : styles.overlayDraw}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={blockGesture}
      onDragStart={blockGesture}
    >
      <svg
        className={styles.svgLayer}
        aria-hidden
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {previewStrokes.map((stroke) => (
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
  );
}
