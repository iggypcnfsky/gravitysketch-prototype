"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { FileListItem } from "@/lib/types";
import { isCanvasFile, isRoom, isScreenshotFile } from "@/lib/types";
import styles from "./FileCard.module.css";

const RoomPreview = dynamic(
  () => import("./RoomPreview").then((mod) => mod.RoomPreview),
  { ssr: false },
);

const CanvasPreview = dynamic(
  () => import("./CanvasPreview").then((mod) => mod.CanvasPreview),
  { ssr: false },
);

interface FileCardProps {
  file: FileListItem;
  onClick: () => void;
  disabled?: boolean;
}

export function FileCard({ file, onClick, disabled = false }: FileCardProps) {
  const isCanvas = isCanvasFile(file);
  const isScreenshot = isScreenshotFile(file);
  const isRoomFile = isRoom(file);

  const metaLabel = isScreenshot
    ? "SCREENSHOT"
    : isCanvas
      ? "CANVAS"
      : "ROOM";
  const timestamp =
    !isScreenshot && file.sharedBy
      ? `Shared by ${file.sharedBy}`
      : file.updatedAt;

  return (
    <button
      type="button"
      className={`${styles.card} ${disabled ? styles.cardDisabled : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className={`${styles.thumbnail} ${isCanvas ? styles.canvasThumb : ""} ${isScreenshot ? styles.screenshotThumb : ""}`}
      >
        {isScreenshot ? (
          <Image
            src={`https://picsum.photos/seed/${file.seed}/400/300`}
            alt=""
            width={200}
            height={150}
            className={styles.screenshotImg}
            unoptimized
          />
        ) : isCanvas ? (
          <CanvasPreview canvasId={file.id} />
        ) : isRoomFile ? (
          <RoomPreview
            showBoat={file.models?.includes("boat")}
            mockShape={file.mockShape}
          />
        ) : null}
      </div>

      <div className={styles.name}>{file.name}</div>
      <div className={styles.meta}>
        <div
          className={`${styles.badge} ${
            isScreenshot
              ? styles.badgeScreenshot
              : isCanvas
                ? styles.badgeCanvas
                : styles.badgeRoom
          }`}
        >
          {metaLabel}
        </div>
        <div className={styles.timestamp}>{timestamp}</div>
      </div>
    </button>
  );
}
