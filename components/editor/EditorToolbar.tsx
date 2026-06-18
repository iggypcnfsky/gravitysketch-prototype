"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  Layers,
  LayoutGrid,
  LineChart,
  Lock,
  MicOff,
  Settings,
} from "lucide-react";
import styles from "./EditorToolbar.module.css";

interface EditorToolbarProps {
  roomName: string;
  splitCanvas: boolean;
  onToggleCanvas: () => void;
}

export function EditorToolbar({
  roomName,
  splitCanvas,
  onToggleCanvas,
}: EditorToolbarProps) {
  const router = useRouter();

  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.logoGroup}>
          <Link href="/files" className={styles.logoBtn}>
            <Image
              src="/logomark.png"
              alt="Gravity Sketch"
              width={28}
              height={28}
              className={styles.logoMark}
            />
          </Link>
          <button type="button" className={styles.iconBtn} aria-label="Workspace menu">
            <ChevronDown size={14} strokeWidth={1.5} color="#666666" />
          </button>
        </div>
        <button type="button" className={`${styles.iconBtn} ${styles.iconBtnAccent}`} aria-label="Export">
          <ArrowUpRight size={18} strokeWidth={1.5} color="#FFFFFF" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Layers">
          <Layers size={18} strokeWidth={1.5} color="#666666" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Camera">
          <Camera size={18} strokeWidth={1.5} color="#666666" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Analytics">
          <LineChart size={18} strokeWidth={1.5} color="#666666" />
        </button>
      </div>

      <div className={styles.center}>
        <button
          type="button"
          className={styles.titleBtn}
          onClick={() => router.push("/files")}
        >
          <span className={styles.breadcrumb}>hey / {roomName}</span>
          <ChevronDown size={12} strokeWidth={1.5} color="#888888" />
        </button>
        <button
          type="button"
          className={`${styles.canvasToggle} ${splitCanvas ? styles.canvasToggleActive : ""}`}
          onClick={onToggleCanvas}
          aria-label={splitCanvas ? "Close canvas panel" : "Open canvas panel"}
          aria-pressed={splitCanvas}
        >
          <LayoutGrid size={14} strokeWidth={1.5} />
          <span>Canvas</span>
        </button>
      </div>

      <div className={styles.right}>
        <button type="button" className={`${styles.iconBtn} ${styles.avatarGreen}`} aria-label="User">
          H
        </button>
        <button type="button" className={`${styles.iconBtn} ${styles.avatarRed}`} aria-label="Microphone muted">
          <MicOff size={16} strokeWidth={1.5} color="#FFFFFF" />
        </button>
        <button type="button" className={`${styles.iconBtn} ${styles.avatarDark}`} aria-label="Lock room">
          <Lock size={16} strokeWidth={1.3} color="#FFFFFF" />
        </button>
        <button type="button" className={styles.shareBtn}>
          Share
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Settings">
          <Settings size={18} strokeWidth={1.3} color="#666666" />
        </button>
      </div>
    </header>
  );
}
