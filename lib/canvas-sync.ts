export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface ImageReferenceData {
  seed?: string;
  scale?: number;
  rotation?: number;
  position3d?: Position3D;
}

export interface CanvasTextData {
  text?: string;
  fontSize?: number;
  scale?: number;
  rotation?: number;
  position3d?: Position3D;
}

export type CanvasElementData = ImageReferenceData | CanvasTextData;

const CANVAS_ORIGIN = { x: 400, y: 300 };
export const CANVAS_TO_WORLD_SCALE = 0.008;
export const DEFAULT_REFERENCE_Z = -1.5;

/** Maps 2D canvas coordinates onto a vertical 3D board (X/Y at fixed depth). */
export function canvasTo3D(
  canvasX: number,
  canvasY: number,
  planeZ: number = DEFAULT_REFERENCE_Z,
): Position3D {
  return {
    x: (canvasX - CANVAS_ORIGIN.x) * CANVAS_TO_WORLD_SCALE,
    y: (CANVAS_ORIGIN.y - canvasY) * CANVAS_TO_WORLD_SCALE,
    z: planeZ,
  };
}

export function canvas3DTo2D(worldX: number, worldY: number): { x: number; y: number } {
  return {
    x: worldX / CANVAS_TO_WORLD_SCALE + CANVAS_ORIGIN.x,
    y: CANVAS_ORIGIN.y - worldY / CANVAS_TO_WORLD_SCALE,
  };
}

export const DEFAULT_TEXT_FONT_SIZE = 28;
export const IMAGE_NODE_WIDTH = 160;
export const IMAGE_NODE_HEIGHT = 120;
export const INTER_FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.5/files/inter-latin-400-normal.woff";

export function getImageNodeSize(scale = 1) {
  return {
    width: IMAGE_NODE_WIDTH * scale,
    height: IMAGE_NODE_HEIGHT * scale,
  };
}

export function getTextNodeSize(data: CanvasTextData) {
  const fontSize = (data.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * (data.scale ?? 1);
  const text = data.text ?? "Text";
  const width = Math.min(Math.max(text.length * fontSize * 0.55, 40), 320) + 12;
  const height = fontSize * 1.2 + 8;

  return { width, height };
}

export function getNodeCenter2D(
  nodeType: string | undefined,
  position: { x: number; y: number },
  data: ImageReferenceData | CanvasTextData = {},
) {
  if (nodeType === "imagePlaceholder") {
    const imageData = data as ImageReferenceData;
    const size = getImageNodeSize(imageData.scale ?? 1);
    return {
      x: position.x + size.width / 2,
      y: position.y + size.height / 2,
    };
  }

  if (nodeType === "canvasText") {
    const textData = data as CanvasTextData;
    const size = getTextNodeSize(textData);
    return {
      x: position.x + size.width / 2,
      y: position.y + size.height / 2,
    };
  }

  return position;
}

export function centerToNodePosition(
  center: { x: number; y: number },
  nodeType: string | undefined,
  data: ImageReferenceData | CanvasTextData = {},
) {
  if (nodeType === "imagePlaceholder") {
    const imageData = data as ImageReferenceData;
    const size = getImageNodeSize(imageData.scale ?? 1);
    return {
      x: center.x - size.width / 2,
      y: center.y - size.height / 2,
    };
  }

  if (nodeType === "canvasText") {
    const textData = data as CanvasTextData;
    const size = getTextNodeSize(textData);
    return {
      x: center.x - size.width / 2,
      y: center.y - size.height / 2,
    };
  }

  return center;
}

export function nodePositionTo3D(
  nodeType: string | undefined,
  position: { x: number; y: number },
  data: ImageReferenceData | CanvasTextData = {},
  planeZ: number = DEFAULT_REFERENCE_Z,
): Position3D {
  const center = getNodeCenter2D(nodeType, position, data);
  return canvasTo3D(center.x, center.y, planeZ);
}

export function world3DToNodePosition(
  position3d: Position3D,
  nodeType: string | undefined,
  data: ImageReferenceData | CanvasTextData = {},
) {
  const center = canvas3DTo2D(position3d.x, position3d.y);
  return centerToNodePosition(center, nodeType, data);
}

export const CANVAS_SYNC_EVENT = "gs-canvas-sync";

export function emitCanvasSync(canvasId: string, roomId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CANVAS_SYNC_EVENT, { detail: { canvasId, roomId } }),
  );
}
