"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { DEFAULT_TEXT_FONT_SIZE } from "@/lib/canvas-sync";
import type { CanvasTextData } from "@/lib/canvas-sync";
import { useCanvasNodeActions } from "./CanvasNodeContext";
import { CanvasTransformHandles } from "./CanvasTransformHandles";
import styles from "./TextNode.module.css";

export function TextNode({ id, data, selected }: NodeProps) {
  const nodeData = data as CanvasTextData;
  const { syncElement } = useCanvasNodeActions();
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const text = nodeData.text ?? "Text";
  const fontSize = nodeData.fontSize ?? DEFAULT_TEXT_FONT_SIZE;
  const scale = nodeData.scale ?? 1;
  const rotation = nodeData.rotation ?? 0;

  const applyPatch = useCallback(
    (patch: Partial<CanvasTextData>) => {
      syncElement(id, patch);
    },
    [id, syncElement],
  );

  useEffect(() => {
    if (!isEditing || !textRef.current) return;
    textRef.current.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textRef.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const nextText = textRef.current?.textContent?.trim() || "Text";
    if (nextText !== text) {
      applyPatch({ text: nextText });
    }
  }, [applyPatch, text]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      textRef.current?.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (textRef.current) textRef.current.textContent = text;
      textRef.current?.blur();
    }
  }, [text]);

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={styles.transformWrap}
        style={
          {
            "--text-font-size": `${fontSize}px`,
            "--text-scale": scale,
            "--text-rotation": `${rotation}deg`,
          } as React.CSSProperties
        }
      >
        <div
          ref={textRef}
          className={`${styles.body} ${selected ? styles.bodySelected : ""} ${isEditing ? styles.bodyEditing : ""}`}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          {text}
        </div>
      </div>

      {selected && !isEditing ? (
        <CanvasTransformHandles
          rootRef={rootRef}
          rotation={rotation}
          scale={scale}
          onChange={applyPatch}
        />
      ) : null}
    </div>
  );
}
