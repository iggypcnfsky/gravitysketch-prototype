"use client";

import { useCallback } from "react";
import styles from "./CanvasTransformHandles.module.css";
import { MAX_ELEMENT_SCALE, MIN_ELEMENT_SCALE } from "@/lib/canvas-sync";

function getAngle(clientX: number, clientY: number, centerX: number, centerY: number) {
  return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
}

interface CanvasTransformHandlesProps {
  rootRef: React.RefObject<HTMLElement | null>;
  rotation: number;
  scale: number;
  onChange: (patch: { rotation?: number; scale?: number }) => void;
}

export function CanvasTransformHandles({
  rootRef,
  rotation,
  scale,
  onChange,
}: CanvasTransformHandlesProps) {
  const startRotate = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startAngle = getAngle(event.clientX, event.clientY, centerX, centerY);
      const startRotation = rotation;

      const onMove = (moveEvent: PointerEvent) => {
        const angle = getAngle(moveEvent.clientX, moveEvent.clientY, centerX, centerY);
        onChange({ rotation: startRotation + (angle - startAngle) });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onChange, rotation, rootRef],
  );

  const startScale = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startDistance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      const startScale = scale;

      const onMove = (moveEvent: PointerEvent) => {
        const distance = Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY);
        const nextScale = Math.min(
          MAX_ELEMENT_SCALE,
          Math.max(MIN_ELEMENT_SCALE, startScale * (distance / startDistance)),
        );
        onChange({ scale: Number(nextScale.toFixed(2)) });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onChange, rootRef, scale],
  );

  return (
    <>
      <button
        type="button"
        className={styles.rotateHandle}
        aria-label="Rotate"
        onPointerDown={startRotate}
      />
      <button
        type="button"
        className={styles.scaleHandle}
        aria-label="Scale"
        onPointerDown={startScale}
      />
    </>
  );
}
