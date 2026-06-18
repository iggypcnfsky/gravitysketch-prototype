"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, List } from "lucide-react";
import { createCanvas, getCanvases } from "@/lib/store";
import { FileCard } from "@/components/files/FileCard";
import styles from "./CanvasesPanel.module.css";

export function CanvasesPanel() {
  const router = useRouter();
  const canvases = getCanvases();

  const handleNewCanvas = () => {
    const canvas = createCanvas("New Canvas");
    router.push(`/canvases/${canvas.id}`);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <div className={styles.title}>Canvases /</div>
          <div className={styles.actions}>
            <button type="button" className={styles.newCanvasBtn} onClick={handleNewCanvas}>
              + New Canvas
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>All canvases</span>
            <ChevronDown size={12} strokeWidth={1.5} color="#888888" />
          </div>
          <div className={styles.sortGroup}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabelMuted}>Last Updated</span>
              <ChevronDown size={12} strokeWidth={1.5} color="#888888" />
            </div>
            <List size={18} strokeWidth={1.5} color="#888888" />
          </div>
        </div>

        <div className={styles.grid}>
          {canvases.map((canvas) => (
            <FileCard
              key={canvas.id}
              file={canvas}
              onClick={() => router.push(`/canvases/${canvas.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
