"use client";

import { Mountain, Box } from "lucide-react";
import type { CameraProjection } from "./ProjectionCamera";
import styles from "./EditorViewport.module.css";

interface CameraProjectionToggleProps {
  value: CameraProjection;
  onChange: (value: CameraProjection) => void;
}

export function CameraProjectionToggle({ value, onChange }: CameraProjectionToggleProps) {
  return (
    <div className={styles.renderBar} role="group" aria-label="Camera projection">
      <button
        type="button"
        className={value === "perspective" ? styles.renderActive : styles.renderInactive}
        onClick={() => onChange("perspective")}
        aria-label="Perspective view"
        aria-pressed={value === "perspective"}
        title="Perspective"
      >
        <Mountain size={18} strokeWidth={1.5} color="#FFFFFF" />
      </button>
      <button
        type="button"
        className={value === "orthographic" ? styles.renderActive : styles.renderInactive}
        onClick={() => onChange("orthographic")}
        aria-label="Orthographic view"
        aria-pressed={value === "orthographic"}
        title="Orthographic"
      >
        <Box size={18} strokeWidth={1.5} color="#FFFFFF" />
      </button>
    </div>
  );
}
