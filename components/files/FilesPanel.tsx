"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, FolderPlus, List, Upload } from "lucide-react";
import { createRoom, getFilesForSection, SECTION_TITLES } from "@/lib/store";
import type { FileListItem, NavSection } from "@/lib/types";
import { isCanvasFile, isScreenshotFile } from "@/lib/types";
import { FileCard } from "./FileCard";
import styles from "./FilesPanel.module.css";

interface FilesPanelProps {
  section: Extract<NavSection, "files" | "recents" | "screenshots" | "shared" | "trash">;
}

export function FilesPanel({ section }: FilesPanelProps) {
  const router = useRouter();
  const files = getFilesForSection(section);
  const title = SECTION_TITLES[section];
  const showNewRoom = section === "files";

  const handleNewRoom = () => {
    const room = createRoom("New Room");
    router.push(`/editor/${room.id}`);
  };

  const handleFileClick = (file: FileListItem) => {
    if (section === "trash") return;

    if (isScreenshotFile(file)) {
      if (file.roomId) router.push(`/editor/${file.roomId}`);
      return;
    }

    if (isCanvasFile(file)) {
      router.push(`/canvases/${file.id}`);
      return;
    }

    router.push(`/editor/${file.id}`);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <div className={styles.title}>{title} /</div>
          {showNewRoom ? (
            <div className={styles.actions}>
              <button type="button" className={styles.iconBtn}>
                <FolderPlus size={20} strokeWidth={1.5} color="#888888" />
              </button>
              <button type="button" className={styles.iconBtn}>
                <Upload size={20} strokeWidth={1.5} color="#888888" />
              </button>
              <button type="button" className={styles.newRoomBtn} onClick={handleNewRoom}>
                + New Room
              </button>
            </div>
          ) : null}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>All files</span>
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

        <div className={styles.filesSection}>
          <span className={styles.filterLabel}>Files</span>
          <ChevronDown size={12} strokeWidth={1.5} color="#888888" />
        </div>

        <div className={styles.grid}>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onClick={() => handleFileClick(file)}
              disabled={section === "trash"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
