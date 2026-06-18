"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Box, Focus, Layers, Link2, Mountain } from "lucide-react";
import { getCanvas } from "@/lib/store";
import { getLinkedRoomName, LinkRoomModal } from "./LinkRoomModal";
import styles from "./CanvasPanel.module.css";

const CanvasFlow = dynamic(
  () => import("./CanvasFlow").then((mod) => mod.CanvasFlow),
  { ssr: false },
);

interface CanvasPanelProps {
  canvasId: string;
  canvasName: string;
}

export function CanvasPanel({ canvasId, canvasName }: CanvasPanelProps) {
  const router = useRouter();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedRoomId, setLinkedRoomId] = useState<string | undefined>(
    () => getCanvas(canvasId)?.linkedRoomId,
  );

  const refreshLink = useCallback(() => {
    setLinkedRoomId(getCanvas(canvasId)?.linkedRoomId);
  }, [canvasId]);

  const linkedRoomName = useMemo(
    () => getLinkedRoomName(linkedRoomId),
    [linkedRoomId],
  );

  const handleOpenRoom = () => {
    if (linkedRoomId) router.push(`/editor/${linkedRoomId}`);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.canvasArea}>
        <CanvasFlow canvasId={canvasId} onExternalSync={refreshLink} />
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>{canvasName}</span>
            {linkedRoomName ? (
              <span className={styles.linkedBadge}>
                <Link2 size={12} strokeWidth={2} />
                {linkedRoomName}
              </span>
            ) : null}
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconBtn}>
              <Mountain size={18} strokeWidth={1.5} color="#888888" />
            </button>
            <button type="button" className={styles.iconBtn}>
              <Focus size={18} strokeWidth={1.5} color="#888888" />
            </button>
            <button type="button" className={styles.iconBtn}>
              <Layers size={18} strokeWidth={1.5} color="#888888" />
            </button>
            {linkedRoomId ? (
              <button type="button" className={styles.openRoomBtn} onClick={handleOpenRoom}>
                <Box size={16} strokeWidth={1.5} />
                Open Room
              </button>
            ) : null}
            <button
              type="button"
              className={linkedRoomId ? styles.linkRoomBtnLinked : styles.linkRoomBtn}
              onClick={() => setShowLinkModal(true)}
            >
              <Link2 size={16} strokeWidth={1.5} />
              {linkedRoomId ? "Change link" : "Link to Room"}
            </button>
          </div>
        </div>
      </div>

      {showLinkModal ? (
        <LinkRoomModal
          canvasId={canvasId}
          linkedRoomId={linkedRoomId}
          onClose={() => setShowLinkModal(false)}
          onLinked={refreshLink}
        />
      ) : null}
    </div>
  );
}
