import type { Edge, Node } from "@xyflow/react";
import type { ImageReferenceData, CanvasTextData, Position3D } from "./canvas-sync";

export type { ImageReferenceData, CanvasTextData, Position3D };

export type CanvasElementKind = "image" | "text";

export interface CanvasElementReference {
  id: string;
  kind: CanvasElementKind;
  position3d: Position3D;
  canvasPosition: { x: number; y: number };
  seed?: string;
  text?: string;
  fontSize?: number;
  scale?: number;
  rotation?: number;
}

/** @deprecated Use CanvasElementReference */
export interface ImageReference {
  id: string;
  seed: string;
  position3d: Position3D;
  canvasPosition: { x: number; y: number };
}

export type NavSection =
  | "files"
  | "canvases"
  | "recents"
  | "screenshots"
  | "shared"
  | "trash";

export type RoomModelId = "boat";

export type MockShapeId = "cube" | "sphere" | "cone";

export const MOCK_SHAPE_IDS: MockShapeId[] = ["cube", "sphere", "cone"];

export function pickRandomMockShape(): MockShapeId {
  return MOCK_SHAPE_IDS[Math.floor(Math.random() * MOCK_SHAPE_IDS.length)];
}

export interface ObjectTransform {
  position: Position3D;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface Room {
  id: string;
  name: string;
  type: "room";
  updatedAt: string;
  thumbnail?: string;
  sharedBy?: string;
  models?: RoomModelId[];
  modelTransforms?: Partial<Record<RoomModelId, ObjectTransform>>;
  mockShape?: MockShapeId;
  mockShapeTransform?: ObjectTransform;
}

export interface ScreenshotFile {
  id: string;
  name: string;
  type: "screenshot";
  updatedAt: string;
  seed: string;
  roomId?: string;
}

export interface CanvasDocument {
  id: string;
  name: string;
  type: "canvas";
  updatedAt: string;
  linkedRoomId?: string;
  sharedBy?: string;
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

export type FileItem = Room | CanvasDocument;

export type FileListItem = Room | CanvasDocument | ScreenshotFile;

export function isCanvasFile(item: FileListItem): item is CanvasDocument {
  return item.type === "canvas";
}

export function isRoom(item: FileListItem): item is Room {
  return item.type === "room";
}

export function isScreenshotFile(item: FileListItem): item is ScreenshotFile {
  return item.type === "screenshot";
}

export interface AppState {
  rooms: Room[];
  canvases: CanvasDocument[];
  recents: FileListItem[];
  screenshots: ScreenshotFile[];
  shared: FileListItem[];
  trash: FileListItem[];
  storageUsed: string;
  storageTotal: string;
}
