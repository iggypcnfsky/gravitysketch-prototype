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

export interface SketchStroke {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface CanvasSketchData {
  width?: number;
  height?: number;
  strokes?: SketchStroke[];
  scale?: number;
  rotation?: number;
  position3d?: Position3D;
}

export type CanvasElementData = ImageReferenceData | CanvasTextData | CanvasSketchData;

export const DEFAULT_SKETCH_STROKE_COLOR = "#7B3FF2";
export const DEFAULT_SKETCH_STROKE_WIDTH = 2.5;
export const SKETCH_BOUNDS_PADDING = 8;
export const SKETCH_ERASER_RADIUS = 12;

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

export function getSketchNodeSize(data: CanvasSketchData) {
  const scale = data.scale ?? 1;
  return {
    width: Math.max((data.width ?? 1) * scale, 1),
    height: Math.max((data.height ?? 1) * scale, 1),
  };
}

export interface SketchBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function computeSketchBounds(strokes: SketchStroke[]): SketchBounds | null {
  if (strokes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    const half = stroke.strokeWidth / 2;
    for (let i = 0; i < stroke.points.length; i += 2) {
      const x = stroke.points[i];
      const y = stroke.points[i + 1];
      minX = Math.min(minX, x - half);
      minY = Math.min(minY, y - half);
      maxX = Math.max(maxX, x + half);
      maxY = Math.max(maxY, y + half);
    }
  }

  if (!Number.isFinite(minX)) return null;

  const paddedMinX = minX - SKETCH_BOUNDS_PADDING;
  const paddedMinY = minY - SKETCH_BOUNDS_PADDING;
  const paddedMaxX = maxX + SKETCH_BOUNDS_PADDING;
  const paddedMaxY = maxY + SKETCH_BOUNDS_PADDING;

  return {
    minX: paddedMinX,
    minY: paddedMinY,
    width: Math.max(paddedMaxX - paddedMinX, 1),
    height: Math.max(paddedMaxY - paddedMinY, 1),
  };
}

export function flowStrokesToLocal(
  strokes: SketchStroke[],
  origin: { x: number; y: number },
): SketchStroke[] {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((value, index) =>
      index % 2 === 0 ? value - origin.x : value - origin.y,
    ),
  }));
}

export function pointsToPath(points: number[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${points[i]} ${points[i + 1]}`;
  }
  return d;
}

export function getNodeCenter2D(
  nodeType: string | undefined,
  position: { x: number; y: number },
  data: ImageReferenceData | CanvasTextData | CanvasSketchData = {},
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

  if (nodeType === "canvasSketch") {
    const sketchData = data as CanvasSketchData;
    const size = getSketchNodeSize(sketchData);
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
  data: ImageReferenceData | CanvasTextData | CanvasSketchData = {},
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

  if (nodeType === "canvasSketch") {
    const sketchData = data as CanvasSketchData;
    const size = getSketchNodeSize(sketchData);
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
  data: ImageReferenceData | CanvasTextData | CanvasSketchData = {},
  planeZ: number = DEFAULT_REFERENCE_Z,
): Position3D {
  const center = getNodeCenter2D(nodeType, position, data);
  return canvasTo3D(center.x, center.y, planeZ);
}

export function world3DToNodePosition(
  position3d: Position3D,
  nodeType: string | undefined,
  data: ImageReferenceData | CanvasTextData | CanvasSketchData = {},
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
