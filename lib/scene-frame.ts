import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  DEFAULT_REFERENCE_Z,
  getReferenceElementHalfExtents,
} from "./canvas-sync";
import { getCanvasElementsForRoom, getRoom } from "./store";
import type { CanvasElementReference, ObjectTransform } from "./types";

const CANVAS_GROUP_PADDING = 0.2;
const BOAT_HALF_EXTENTS = { x: 1.35, y: 0.75, z: 1.1 };
const VIEW_DIRECTION = new THREE.Vector3(0.9, 0.5, 1.05).normalize();
const DEFAULT_FRAME_PADDING = 1.3;
const MOCK_SHAPE_HALF_EXTENT = 0.55;

function expandBoxForMockShape(box: THREE.Box3, transform?: ObjectTransform) {
  const position = transform?.position ?? { x: 0, y: 0.5, z: 0 };
  const scale = transform?.scale ?? { x: 1, y: 1, z: 1 };
  const half = MOCK_SHAPE_HALF_EXTENT * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));

  box.expandByPoint(
    new THREE.Vector3(position.x - half, position.y - half, position.z - half),
  );
  box.expandByPoint(
    new THREE.Vector3(position.x + half, position.y + half, position.z + half),
  );
}

function expandBoxForBoat(box: THREE.Box3, transform?: ObjectTransform) {
  const position = transform?.position ?? { x: 0, y: 0, z: 0 };
  const scale = transform?.scale ?? { x: 1, y: 1, z: 1 };

  const halfX = BOAT_HALF_EXTENTS.x * Math.abs(scale.x);
  const halfY = BOAT_HALF_EXTENTS.y * Math.abs(scale.y);
  const halfZ = BOAT_HALF_EXTENTS.z * Math.abs(scale.z);

  box.expandByPoint(
    new THREE.Vector3(position.x - halfX, position.y, position.z - halfZ),
  );
  box.expandByPoint(
    new THREE.Vector3(position.x + halfX, position.y + halfY * 2, position.z + halfZ),
  );
}

function expandBoxForCanvasElements(
  box: THREE.Box3,
  elements: CanvasElementReference[],
  offset?: { x: number; y: number; z: number },
) {
  if (elements.length === 0) return;

  const dx = offset?.x ?? 0;
  const dy = offset?.y ?? 0;
  const dz = offset?.z ?? 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const element of elements) {
    const { x, y, z } = element.position3d;
    const { halfWidth, halfHeight } = getReferenceElementHalfExtents(element);
    minX = Math.min(minX, x + dx - halfWidth);
    maxX = Math.max(maxX, x + dx + halfWidth);
    minY = Math.min(minY, y + dy - halfHeight);
    maxY = Math.max(maxY, y + dy + halfHeight);
    minZ = Math.min(minZ, z + dz);
    maxZ = Math.max(maxZ, z + dz);
  }

  minX -= CANVAS_GROUP_PADDING;
  maxX += CANVAS_GROUP_PADDING;
  minY -= CANVAS_GROUP_PADDING;
  maxY += CANVAS_GROUP_PADDING;

  box.expandByPoint(new THREE.Vector3(minX, minY, minZ));
  box.expandByPoint(new THREE.Vector3(maxX, maxY, maxZ));
}

export function computeRoomSceneBounds(roomId: string): THREE.Box3 {
  const box = new THREE.Box3();
  const room = getRoom(roomId);
  const elements = getCanvasElementsForRoom(roomId);

  if (room?.models?.includes("boat")) {
    expandBoxForBoat(box, room.modelTransforms?.boat);
  }

  if (room?.mockShape) {
    expandBoxForMockShape(box, room.mockShapeTransform);
  }

  expandBoxForCanvasElements(box, elements, room?.referenceGroupOffset);

  if (box.isEmpty()) {
    box.setFromCenterAndSize(
      new THREE.Vector3(0, 0.5, DEFAULT_REFERENCE_Z * 0.5),
      new THREE.Vector3(5, 2.5, 5),
    );
  }

  return box;
}

export function frameCameraToBounds(
  bounds: THREE.Box3,
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
  viewport: { width: number; height: number },
  padding = DEFAULT_FRAME_PADDING,
) {
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const aspect = viewport.width / Math.max(viewport.height, 1);

  controls.target.copy(center);

  if (camera instanceof THREE.PerspectiveCamera) {
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const fitHeightDistance = (size.y / 2 / Math.tan(fovRad / 2)) * padding;
    const fitWidthDistance =
      (size.x / 2 / (Math.tan(fovRad / 2) * aspect)) * padding;
    const fitDepthBoost = Math.max(size.z * 0.55, 1.2);
    const distance = Math.max(fitHeightDistance, fitWidthDistance, fitDepthBoost);

    camera.position.copy(center).add(VIEW_DIRECTION.clone().multiplyScalar(distance));
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.OrthographicCamera) {
    const distance = Math.max(size.length() * 0.9, 4);
    const frustumHeight = Math.max(size.y, size.x / aspect) * padding;
    const frustumWidth = frustumHeight * aspect;

    camera.position.copy(center).add(VIEW_DIRECTION.clone().multiplyScalar(distance));
    camera.zoom = 1;
    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }

  controls.update();
}
