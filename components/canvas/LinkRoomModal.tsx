"use client";

import { useEffect, useState } from "react";
import { Box, X } from "lucide-react";
import { getRoom, getRooms, linkCanvasToRoom, unlinkCanvasFromRoom } from "@/lib/store";
import styles from "./LinkRoomModal.module.css";

interface LinkRoomModalProps {
  canvasId: string;
  linkedRoomId?: string;
  onClose: () => void;
  onLinked: () => void;
}

export function LinkRoomModal({
  canvasId,
  linkedRoomId,
  onClose,
  onLinked,
}: LinkRoomModalProps) {
  const rooms = getRooms();
  const [selectedRoomId, setSelectedRoomId] = useState(linkedRoomId ?? rooms[0]?.id ?? "");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLink = () => {
    if (!selectedRoomId) return;
    linkCanvasToRoom(canvasId, selectedRoomId);
    onLinked();
    onClose();
  };

  const handleUnlink = () => {
    unlinkCanvasFromRoom(canvasId);
    onLinked();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="link-room-title"
      >
        <div className={styles.header}>
          <h2 id="link-room-title" className={styles.title}>
            Link to Room
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className={styles.subtitle}>
          Connect this canvas to a 3D room. Reference images will stay in sync between 2D and 3D.
        </p>

        <div className={styles.roomList}>
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`${styles.roomItem} ${selectedRoomId === room.id ? styles.roomItemActive : ""}`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <div className={styles.roomIcon}>
                <Box size={18} strokeWidth={1.5} color="#7B3FF2" />
              </div>
              <div>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomMeta}>ROOM · {room.updatedAt}</div>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          {linkedRoomId ? (
            <button type="button" className={styles.unlinkBtn} onClick={handleUnlink}>
              Unlink
            </button>
          ) : null}
          <button
            type="button"
            className={styles.linkBtn}
            onClick={handleLink}
            disabled={!selectedRoomId}
          >
            {linkedRoomId ? "Update link" : "Link canvas"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function getLinkedRoomName(linkedRoomId?: string): string | undefined {
  if (!linkedRoomId) return undefined;
  return getRoom(linkedRoomId)?.name;
}
