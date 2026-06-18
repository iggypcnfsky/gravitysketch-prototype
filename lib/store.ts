import { SEED_STATE } from "./mock-data";
import type { AppState, CanvasDocument, CanvasElementReference, FileItem, FileListItem, ImageReference, NavSection, MockShapeId, ObjectTransform, Room, RoomModelId } from "./types";
import { pickRandomMockShape } from "./types";
import {
  canvas3DTo2D,
  canvasTo3D,
  DEFAULT_REFERENCE_Z,
  emitCanvasSync,
  getReferenceElementHalfExtents,
  nodePositionTo3D,
  world3DToNodePosition,
  type CanvasTextData,
  type ImageReferenceData,
  type Position3D,
  type CanvasSketchData,
} from "./canvas-sync";
import type { Node } from "@xyflow/react";
import * as THREE from "three";

const STORAGE_KEY = "gs-app-state";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function withCanvasElementPositions(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (node.type === "imagePlaceholder") {
      const data = (node.data ?? {}) as ImageReferenceData;
      const position3d = nodePositionTo3D(
        node.type,
        node.position,
        data,
        data.position3d?.z ?? DEFAULT_REFERENCE_Z,
      );

      return {
        ...node,
        data: { scale: 1, rotation: 0, ...data, position3d },
      };
    }

    if (node.type === "canvasText") {
      const data = (node.data ?? {}) as CanvasTextData;
      const position3d = nodePositionTo3D(
        node.type,
        node.position,
        data,
        data.position3d?.z ?? DEFAULT_REFERENCE_Z,
      );

      return {
        ...node,
        data: { ...data, position3d },
      };
    }

    if (node.type === "canvasSketch") {
      const data = (node.data ?? {}) as CanvasSketchData;
      const position3d = nodePositionTo3D(
        node.type,
        node.position,
        data,
        data.position3d?.z ?? DEFAULT_REFERENCE_Z,
      );

      return {
        ...node,
        data: { ...data, position3d },
      };
    }

    return node;
  });
}

function withoutLegacyBoatSketch(nodes: Node[]): Node[] {
  return nodes.filter((node) => node.type !== "boatSketch");
}

function migrateState(state: AppState): AppState {
  const seedCanvas = SEED_STATE.canvases[0];

  const canvases = state.canvases.map((canvas) => {
    const migrated =
      canvas.id === "default-canvas"
        ? { ...seedCanvas, ...canvas, id: seedCanvas.id }
        : canvas;

    return {
      ...migrated,
      type: "canvas" as const,
      updatedAt: migrated.updatedAt ?? "just now",
      nodes: withCanvasElementPositions(withoutLegacyBoatSketch(migrated.nodes)),
    };
  });

  const deduped = canvases.filter(
    (canvas, index, list) => list.findIndex((item) => item.id === canvas.id) === index,
  );

  const hasSeedCanvas = deduped.some((canvas) => canvas.id === seedCanvas.id);
  if (!hasSeedCanvas) {
    deduped.unshift({ ...seedCanvas, nodes: withCanvasElementPositions(seedCanvas.nodes) });
  }

  const upgraded = deduped.map((canvas) => {
    if (canvas.id !== seedCanvas.id) return canvas;

    const hasImageNodes = canvas.nodes.some((node) => node.type === "imagePlaceholder");
    const nodes = withoutLegacyBoatSketch(
      hasImageNodes ? canvas.nodes : withCanvasElementPositions(seedCanvas.nodes),
    );

    return {
      ...canvas,
      name: canvas.name === "Canvas" ? seedCanvas.name : canvas.name,
      linkedRoomId: canvas.linkedRoomId ?? seedCanvas.linkedRoomId,
      nodes,
    };
  });

  return {
    ...state,
    rooms: state.rooms.map((room) => ({
      ...room,
      models: room.models ?? (room.id === "sailing-boat" ? ["boat"] : []),
    })),
    canvases: upgraded,
    recents: state.recents?.length ? state.recents : SEED_STATE.recents,
    screenshots: state.screenshots?.length ? state.screenshots : SEED_STATE.screenshots,
    shared: state.shared?.length ? state.shared : SEED_STATE.shared,
    trash: state.trash?.length ? state.trash : SEED_STATE.trash,
  };
}

function readState(): AppState {
  if (!isBrowser()) return SEED_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STATE));
    return SEED_STATE;
  }
  try {
    return migrateState(JSON.parse(raw) as AppState);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STATE));
    return SEED_STATE;
  }
}

function writeState(state: AppState): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAppState(): AppState {
  return readState();
}

export function getRooms(): Room[] {
  return readState().rooms;
}

export function getCanvases(): CanvasDocument[] {
  return readState().canvases;
}

export function getMyFiles(): FileItem[] {
  const state = readState();
  return [...state.rooms, ...state.canvases];
}

export function getFilesForSection(section: NavSection): FileListItem[] {
  const state = readState();
  switch (section) {
    case "files":
      return getMyFiles();
    case "recents":
      return state.recents;
    case "screenshots":
      return state.screenshots;
    case "shared":
      return state.shared;
    case "trash":
      return state.trash;
    case "canvases":
      return state.canvases;
    default:
      return [];
  }
}

export const SECTION_TITLES: Record<
  "files" | "recents" | "screenshots" | "shared" | "trash",
  string
> = {
  files: "My files",
  recents: "Recents",
  screenshots: "Screenshots",
  shared: "Shared with me",
  trash: "Trash",
};

export function getRoom(id: string): Room | undefined {
  return readState().rooms.find((room) => room.id === id);
}

export function getCanvas(id: string): CanvasDocument | undefined {
  return readState().canvases.find((canvas) => canvas.id === id);
}

export function getCanvasByRoomId(roomId: string): CanvasDocument | undefined {
  return readState().canvases.find((canvas) => canvas.linkedRoomId === roomId);
}

export function getDefaultCanvas(): CanvasDocument {
  const state = readState();
  return state.canvases[0] ?? SEED_STATE.canvases[0];
}

export function saveCanvas(
  canvas: CanvasDocument,
  emitSync = true,
  syncPositionsFrom2D = true,
): void {
  const state = readState();
  const index = state.canvases.findIndex((item) => item.id === canvas.id);
  const nextCanvas = {
    ...canvas,
    nodes: syncPositionsFrom2D ? withCanvasElementPositions(canvas.nodes) : canvas.nodes,
  };

  if (index >= 0) {
    state.canvases[index] = nextCanvas;
  } else {
    state.canvases.push(nextCanvas);
  }
  writeState(state);
  if (emitSync) emitCanvasSync(nextCanvas.id, nextCanvas.linkedRoomId);
}

export function linkCanvasToRoom(canvasId: string, roomId: string): void {
  const state = readState();
  const index = state.canvases.findIndex((canvas) => canvas.id === canvasId);
  if (index < 0) return;

  state.canvases = state.canvases.map((canvas) =>
    canvas.linkedRoomId === roomId && canvas.id !== canvasId
      ? { ...canvas, linkedRoomId: undefined }
      : canvas,
  );

  const canvasIndex = state.canvases.findIndex((canvas) => canvas.id === canvasId);
  state.canvases[canvasIndex] = {
    ...state.canvases[canvasIndex],
    linkedRoomId: roomId,
  };

  writeState(state);
  emitCanvasSync(canvasId, roomId);
}

export function unlinkCanvasFromRoom(canvasId: string): void {
  const state = readState();
  const index = state.canvases.findIndex((canvas) => canvas.id === canvasId);
  if (index < 0) return;

  const roomId = state.canvases[index].linkedRoomId;
  state.canvases[index] = { ...state.canvases[index], linkedRoomId: undefined };
  writeState(state);
  emitCanvasSync(canvasId, roomId);
}

export function getCanvasElementsForRoom(roomId: string): CanvasElementReference[] {
  const canvas = getCanvasByRoomId(roomId);
  if (!canvas) return [];

  const resolvePosition3d = (
    nodeType: string | undefined,
    position: { x: number; y: number },
    data: ImageReferenceData | CanvasTextData | CanvasSketchData,
  ) =>
    nodePositionTo3D(
      nodeType,
      position,
      data,
      data.position3d?.z ?? DEFAULT_REFERENCE_Z,
    );

  return canvas.nodes
    .filter(
      (node) =>
        node.type === "imagePlaceholder" ||
        node.type === "canvasText" ||
        node.type === "canvasSketch",
    )
    .map((node) => {
      if (node.type === "canvasText") {
        const data = (node.data ?? {}) as CanvasTextData;

        return {
          id: node.id,
          kind: "text" as const,
          text: data.text ?? "Text",
          fontSize: data.fontSize ?? 28,
          scale: data.scale ?? 1,
          rotation: data.rotation ?? 0,
          position3d: resolvePosition3d(node.type, node.position, data),
          canvasPosition: { x: node.position.x, y: node.position.y },
        };
      }

      if (node.type === "canvasSketch") {
        const data = (node.data ?? {}) as CanvasSketchData;

        return {
          id: node.id,
          kind: "sketch" as const,
          width: data.width,
          height: data.height,
          strokes: data.strokes ?? [],
          scale: data.scale ?? 1,
          rotation: data.rotation ?? 0,
          position3d: resolvePosition3d(node.type, node.position, data),
          canvasPosition: { x: node.position.x, y: node.position.y },
        };
      }

      const data = (node.data ?? {}) as ImageReferenceData;

      return {
        id: node.id,
        kind: "image" as const,
        seed: data.seed ?? node.id,
        scale: data.scale ?? 1,
        rotation: data.rotation ?? 0,
        position3d: resolvePosition3d(node.type, node.position, data),
        canvasPosition: { x: node.position.x, y: node.position.y },
      };
    });
}

export function getImageReferencesForRoom(roomId: string): ImageReference[] {
  return getCanvasElementsForRoom(roomId)
    .filter((element): element is CanvasElementReference & { kind: "image"; seed: string } =>
      element.kind === "image" && !!element.seed,
    )
    .map((element) => ({
      id: element.id,
      seed: element.seed,
      position3d: element.position3d,
      canvasPosition: element.canvasPosition,
    }));
}

export interface CanvasElementCanvasPatch {
  position?: { x: number; y: number };
  text?: string;
  fontSize?: number;
  scale?: number;
  rotation?: number;
  width?: number;
  height?: number;
  strokes?: CanvasSketchData["strokes"];
}

export function updateCanvasElementFromCanvas(
  canvasId: string,
  nodeId: string,
  patch: CanvasElementCanvasPatch,
): void {
  const canvas = getCanvas(canvasId);
  if (!canvas) return;

  const existingNode = canvas.nodes.find((node) => node.id === nodeId);
  if (!existingNode) return;

  const canvasPosition = patch.position ?? existingNode.position;
  const existingData = (existingNode.data ?? {}) as ImageReferenceData &
    CanvasTextData &
    CanvasSketchData;
  const mergedData = { ...existingData, ...patch };
  const planeZ = existingData.position3d?.z;
  const position3d = nodePositionTo3D(
    existingNode.type,
    canvasPosition,
    mergedData,
    planeZ,
  );

  const nodes = canvas.nodes.map((node) => {
    if (node.id !== nodeId) return node;

    if (node.type === "canvasText") {
      const data = (node.data ?? {}) as CanvasTextData;
      return {
        ...node,
        position: canvasPosition,
        data: {
          ...data,
          ...patch,
          position3d,
        },
      };
    }

    if (node.type === "canvasSketch") {
      const data = (node.data ?? {}) as CanvasSketchData;
      return {
        ...node,
        position: canvasPosition,
        data: {
          ...data,
          ...patch,
          position3d,
        },
      };
    }

    const data = (node.data ?? {}) as ImageReferenceData;
    return {
      ...node,
      position: canvasPosition,
      data: {
        scale: 1,
        rotation: 0,
        ...data,
        ...patch,
        position3d,
      },
    };
  });

  saveCanvas({ ...canvas, nodes }, true);
}

export function updateReferenceFromCanvas(
  canvasId: string,
  nodeId: string,
  canvasPosition: { x: number; y: number },
): void {
  updateCanvasElementFromCanvas(canvasId, nodeId, { position: canvasPosition });
}

export interface CanvasElement3DPatch {
  position3d: Position3D;
  rotation?: number;
  scale?: number;
}

export function updateCanvasElementFrom3D(
  roomId: string,
  nodeId: string,
  patch: CanvasElement3DPatch,
): void {
  const canvas = getCanvasByRoomId(roomId);
  if (!canvas) return;

  const nodes = canvas.nodes.map((node) => {
    if (node.id !== nodeId) return node;

    if (node.type === "canvasText") {
      const data = (node.data ?? {}) as CanvasTextData;
      const mergedData = {
        ...data,
        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
        ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
      };
      return {
        ...node,
        position: world3DToNodePosition(patch.position3d, node.type, mergedData),
        data: {
          ...mergedData,
          position3d: patch.position3d,
        },
      };
    }

    if (node.type === "canvasSketch") {
      const data = (node.data ?? {}) as CanvasSketchData;
      const mergedData = {
        ...data,
        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
        ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
      };
      return {
        ...node,
        position: world3DToNodePosition(patch.position3d, node.type, mergedData),
        data: {
          ...mergedData,
          position3d: patch.position3d,
        },
      };
    }

    const data = (node.data ?? {}) as ImageReferenceData;
    const mergedData = {
      ...data,
      ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
      ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
    };
    return {
      ...node,
      position: world3DToNodePosition(patch.position3d, node.type, mergedData),
      data: {
        ...mergedData,
        position3d: patch.position3d,
      },
    };
  });

  saveCanvas({ ...canvas, nodes }, true, false);
}

export function updateReferenceFrom3D(
  roomId: string,
  nodeId: string,
  position3d: Position3D,
): void {
  updateCanvasElementFrom3D(roomId, nodeId, { position3d });
}

export function updateRoomModelTransform(
  roomId: string,
  modelId: RoomModelId,
  transform: ObjectTransform,
): void {
  const state = readState();
  const index = state.rooms.findIndex((room) => room.id === roomId);
  if (index < 0) return;

  state.rooms[index] = {
    ...state.rooms[index],
    modelTransforms: {
      ...state.rooms[index].modelTransforms,
      [modelId]: transform,
    },
  };
  writeState(state);
}

export function updateMockShapeTransform(roomId: string, transform: ObjectTransform): void {
  const state = readState();
  const index = state.rooms.findIndex((room) => room.id === roomId);
  if (index < 0) return;

  state.rooms[index] = {
    ...state.rooms[index],
    mockShapeTransform: transform,
  };
  writeState(state);
}

function computeReferenceGroupBoundsCenter(
  elements: CanvasElementReference[],
): Position3D | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    const { x, y } = element.position3d;
    const { halfWidth, halfHeight } = getReferenceElementHalfExtents(element);
    minX = Math.min(minX, x - halfWidth);
    maxX = Math.max(maxX, x + halfWidth);
    minY = Math.min(minY, y - halfHeight);
    maxY = Math.max(maxY, y + halfHeight);
  }

  const planeZ = elements[0]?.position3d.z ?? DEFAULT_REFERENCE_Z;

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: planeZ,
  };
}

export function getReferenceGroupOffset(roomId: string): Position3D {
  const room = getRoom(roomId);
  return room?.referenceGroupOffset ?? { x: 0, y: 0, z: 0 };
}

/** Persist where the reference canvas sits in 3D without changing 2D canvas layout. */
export function saveReferenceGroupTransform(group: THREE.Group, roomId: string): void {
  const elements = getCanvasElementsForRoom(roomId);
  const center = computeReferenceGroupBoundsCenter(elements);
  if (!center) return;

  const offset: Position3D = {
    x: group.position.x - center.x,
    y: group.position.y - center.y,
    z: group.position.z - center.z,
  };

  const state = readState();
  const index = state.rooms.findIndex((room) => room.id === roomId);
  if (index < 0) return;

  state.rooms[index] = {
    ...state.rooms[index],
    referenceGroupOffset: offset,
  };
  writeState(state);
}

export function createRoom(name: string): Room {
  const state = readState();
  const baseId =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "room";
  const mockShape = pickRandomMockShape();
  const room: Room = {
    id: `${baseId}-${Date.now()}`,
    name,
    type: "room",
    updatedAt: "just now",
    models: [],
    mockShape,
    mockShapeTransform: {
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  state.rooms.unshift(room);
  writeState(state);
  return room;
}

export function createCanvas(name: string): CanvasDocument {
  const state = readState();
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `canvas-${Date.now()}`;

  const seed = `new-${Date.now()}`;
  const position = { x: 200, y: 200 };

  const canvas: CanvasDocument = {
    id: `${id}-${Date.now()}`,
    name,
    type: "canvas",
    updatedAt: "just now",
    nodes: [
      {
        id: `image-${Date.now()}`,
        type: "imagePlaceholder",
        position,
        data: {
          seed,
          position3d: nodePositionTo3D("imagePlaceholder", position, { seed }),
        },
        draggable: true,
        selectable: true,
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  state.canvases.unshift(canvas);
  writeState(state);
  return canvas;
}

export function createLinkedCanvasForRoom(roomId: string, roomName: string): CanvasDocument {
  const canvas = createCanvas(roomName);
  linkCanvasToRoom(canvas.id, roomId);
  return readState().canvases.find((c) => c.id === canvas.id) ?? canvas;
}

export function getStorageInfo(): { used: string; total: string } {
  const state = readState();
  return { used: state.storageUsed, total: state.storageTotal };
}
