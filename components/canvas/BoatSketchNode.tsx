import type { NodeProps } from "@xyflow/react";
import styles from "./CanvasFlow.module.css";

export function BoatSketchNode(_props: NodeProps) {
  return (
    <div className={styles.node}>
      <svg width="420" height="260" viewBox="0 0 420 260" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M80 160C120 110 180 95 210 100C240 105 300 120 340 160"
          fill="none"
          stroke="#7B3FF2"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        <path
          d="M100 175C150 145 270 145 320 175"
          fill="none"
          stroke="#7B3FF2"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ opacity: 0.5 }}
        />
        <path
          d="M130 130C170 115 250 115 290 130"
          fill="none"
          stroke="#AAAAAA"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ opacity: 0.6 }}
        />
        <ellipse cx="210" cy="185" rx="90" ry="18" fill="none" stroke="#CCCCCC" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}
