"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Image, Line, Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { CanvasElementReference } from "@/lib/types";
import {
  CANVAS_TO_WORLD_SCALE,
  CANVAS_SYNC_EVENT,
  DEFAULT_TEXT_FONT_SIZE,
  getReferenceElementHalfExtents,
  getTextNodeSize,
  INTER_FONT_URL,
  REFERENCE_IMAGE_CORNER_RADIUS,
  REFERENCE_IMAGE_HEIGHT,
  REFERENCE_IMAGE_WIDTH,
} from "@/lib/canvas-sync";
import { createRoundedRectOutline, createRoundedRectShape } from "@/lib/rounded-rect";
import { getCanvasByRoomId, getCanvasElementsForRoom, getReferenceGroupOffset } from "@/lib/store";
import { CanvasGroupMoveHandle } from "./CanvasGroupMoveHandle";

const GROUP_PADDING = 0.2;
const CANVAS_BG = "#eeeeee";
const CANVAS_FRAME_RADIUS = 0.12;
export const CANVAS_GROUP_ID = "canvas-references";

export interface SceneSelection {
  id: string;
  kind: "boat" | "mockShape" | "reference" | "referenceGroup";
  object: THREE.Object3D;
}

function getElementHalfExtents(element: CanvasElementReference) {
  return getReferenceElementHalfExtents(element);
}

function disableImageDepthWrite(mesh: THREE.Mesh) {
  const material = mesh.material;
  if (material && !Array.isArray(material)) {
    material.depthWrite = false;
  }
}

interface CanvasElementPlaneProps {
  element: CanvasElementReference;
  groupCenter: THREE.Vector3;
  isSelected: boolean;
  isTransforming: boolean;
  onSelect: (selection: SceneSelection) => void;
  onSelectGroup: () => void;
}

function ImageElementPlane({
  element,
  groupCenter,
  isSelected,
  isTransforming,
  onSelect,
  onSelectGroup,
}: CanvasElementPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const relativePosition = useMemo(
    () =>
      new THREE.Vector3(
        element.position3d.x - groupCenter.x,
        element.position3d.y - groupCenter.y,
        0,
      ),
    [groupCenter, element.position3d],
  );
  const rotationZ = useMemo(
    () => THREE.MathUtils.degToRad(element.rotation ?? 0),
    [element.rotation],
  );
  const scale = element.scale ?? 1;

  useEffect(() => {
    if (isSelected || isTransforming || !groupRef.current) return;
    groupRef.current.position.copy(relativePosition);
    groupRef.current.rotation.set(0, 0, rotationZ);
    groupRef.current.scale.set(scale, scale, 1);
  }, [isSelected, isTransforming, relativePosition, rotationZ, scale]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      onSelectGroup();
      return;
    }
    onSelect({ id: element.id, kind: "reference", object: groupRef.current });
  };

  const seed = element.seed ?? element.id;

  return (
    <group
      ref={groupRef}
      position={relativePosition}
      rotation={[0, 0, rotationZ]}
      scale={[scale, scale, 1]}
      userData={{ elementId: element.id, referenceId: element.id }}
    >
      {isSelected ? (
        <Image
          url={`https://picsum.photos/seed/${seed}/640/480`}
          scale={[REFERENCE_IMAGE_WIDTH * 1.05, REFERENCE_IMAGE_HEIGHT * 1.05]}
          position={[0, 0, -0.003]}
          radius={REFERENCE_IMAGE_CORNER_RADIUS * 1.05}
          color="#7B3FF2"
          opacity={0.32}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
          raycast={() => null}
          onUpdate={disableImageDepthWrite}
        />
      ) : null}
      <Image
        url={`https://picsum.photos/seed/${seed}/640/480`}
        scale={[REFERENCE_IMAGE_WIDTH, REFERENCE_IMAGE_HEIGHT]}
        radius={REFERENCE_IMAGE_CORNER_RADIUS}
        opacity={1}
        transparent
        toneMapped={false}
        side={THREE.DoubleSide}
        onPointerDown={handlePointerDown}
        onUpdate={disableImageDepthWrite}
      />
    </group>
  );
}

function TextElementPlane({
  element,
  groupCenter,
  isSelected,
  isTransforming,
  onSelect,
  onSelectGroup,
}: CanvasElementPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const relativePosition = useMemo(
    () =>
      new THREE.Vector3(
        element.position3d.x - groupCenter.x,
        element.position3d.y - groupCenter.y,
        0,
      ),
    [groupCenter, element.position3d],
  );
  const rotationZ = useMemo(
    () => THREE.MathUtils.degToRad(element.rotation ?? 0),
    [element.rotation],
  );
  const scale = element.scale ?? 1;
  const fontSize = (element.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * CANVAS_TO_WORLD_SCALE;
  const label = element.text ?? "Text";
  const textSize = getTextNodeSize({
    text: label,
    fontSize: element.fontSize,
    scale,
  });
  const textWidth = Math.max(textSize.width * CANVAS_TO_WORLD_SCALE, 0.35);
  const textHeight = Math.max(textSize.height * CANVAS_TO_WORLD_SCALE, 0.2);

  useEffect(() => {
    if (isSelected || isTransforming || !groupRef.current) return;
    groupRef.current.position.copy(relativePosition);
    groupRef.current.rotation.set(0, 0, rotationZ);
    groupRef.current.scale.set(scale, scale, 1);
  }, [isSelected, isTransforming, relativePosition, rotationZ, scale]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      onSelectGroup();
      return;
    }
    onSelect({ id: element.id, kind: "reference", object: groupRef.current });
  };

  return (
    <group
      ref={groupRef}
      position={relativePosition}
      rotation={[0, 0, rotationZ]}
      scale={[scale, scale, 1]}
      userData={{ elementId: element.id, referenceId: element.id }}
    >
      {isSelected ? (
        <mesh position={[0, 0, -0.004]} raycast={() => null}>
          <planeGeometry args={[textWidth * 1.08, textHeight * 1.08]} />
          <meshBasicMaterial color="#7B3FF2" transparent opacity={0.18} />
        </mesh>
      ) : null}
      <Text
        font={INTER_FONT_URL}
        fontSize={fontSize}
        color="#1a1a1a"
        anchorX="center"
        anchorY="top"
        position={[0, textHeight / 2, 0.01]}
        maxWidth={textWidth}
        onPointerDown={handlePointerDown}
      >
        {label}
      </Text>
    </group>
  );
}

function localSketchPointToGroup(
  localX: number,
  localY: number,
  width: number,
  height: number,
) {
  return new THREE.Vector3(
    (localX - width / 2) * CANVAS_TO_WORLD_SCALE,
    (height / 2 - localY) * CANVAS_TO_WORLD_SCALE,
    0.01,
  );
}

function SketchElementPlane({
  element,
  groupCenter,
  isSelected,
  isTransforming,
  onSelect,
  onSelectGroup,
}: CanvasElementPlaneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const relativePosition = useMemo(
    () =>
      new THREE.Vector3(
        element.position3d.x - groupCenter.x,
        element.position3d.y - groupCenter.y,
        0,
      ),
    [groupCenter, element.position3d],
  );
  const rotationZ = useMemo(
    () => THREE.MathUtils.degToRad(element.rotation ?? 0),
    [element.rotation],
  );
  const scale = element.scale ?? 1;
  const width = element.width ?? 1;
  const height = element.height ?? 1;
  const strokes = element.strokes ?? [];
  const sketchWidth = Math.max(width * CANVAS_TO_WORLD_SCALE, 0.05);
  const sketchHeight = Math.max(height * CANVAS_TO_WORLD_SCALE, 0.05);

  useEffect(() => {
    if (isSelected || isTransforming || !groupRef.current) return;
    groupRef.current.position.copy(relativePosition);
    groupRef.current.rotation.set(0, 0, rotationZ);
    groupRef.current.scale.set(scale, scale, 1);
  }, [isSelected, isTransforming, relativePosition, rotationZ, scale]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      onSelectGroup();
      return;
    }
    onSelect({ id: element.id, kind: "reference", object: groupRef.current });
  };

  return (
    <group
      ref={groupRef}
      position={relativePosition}
      rotation={[0, 0, rotationZ]}
      scale={[scale, scale, 1]}
      userData={{ elementId: element.id, referenceId: element.id }}
    >
      {isSelected ? (
        <mesh position={[0, 0, -0.004]} raycast={() => null}>
          <planeGeometry args={[sketchWidth * 1.08, sketchHeight * 1.08]} />
          <meshBasicMaterial color="#7B3FF2" transparent opacity={0.18} />
        </mesh>
      ) : null}

      <mesh
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[sketchWidth, sketchHeight]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {strokes.map((stroke) => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < stroke.points.length; i += 2) {
          points.push(
            localSketchPointToGroup(
              stroke.points[i],
              stroke.points[i + 1],
              width,
              height,
            ),
          );
        }

        if (points.length < 2) return null;

        return (
          <Line
            key={stroke.id}
            points={points}
            color={stroke.color}
            lineWidth={Math.max(stroke.strokeWidth * CANVAS_TO_WORLD_SCALE * 120, 1)}
            transparent
            opacity={1}
            raycast={() => null}
          />
        );
      })}
    </group>
  );
}

function useGroupBounds(elements: CanvasElementReference[]) {
  return useMemo(() => {
    if (elements.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      const { x, y } = element.position3d;
      const { halfWidth, halfHeight } = getElementHalfExtents(element);
      minX = Math.min(minX, x - halfWidth);
      maxX = Math.max(maxX, x + halfWidth);
      minY = Math.min(minY, y - halfHeight);
      maxY = Math.max(maxY, y + halfHeight);
    }

    const planeZ = elements[0]?.position3d.z ?? -1.5;

    return {
      center: new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, planeZ),
      width: maxX - minX + GROUP_PADDING * 2,
      height: maxY - minY + GROUP_PADDING * 2,
    };
  }, [elements]);
}

function useRoundedCanvasFrame(width: number, height: number) {
  return useMemo(() => {
    const shape = createRoundedRectShape(width, height, CANVAS_FRAME_RADIUS);
    const outline = createRoundedRectOutline(width, height, CANVAS_FRAME_RADIUS);
    return { shape, outline };
  }, [height, width]);
}

interface ReferencePlanesProps {
  roomId: string;
  linkedCanvasId?: string;
  selectedId: string | null;
  selectedKind: SceneSelection["kind"] | null;
  transformingRef: React.MutableRefObject<boolean>;
  onSelect: (selection: SceneSelection) => void;
}

export function ReferencePlanes({
  roomId,
  linkedCanvasId,
  selectedId,
  selectedKind,
  transformingRef,
  onSelect,
}: ReferencePlanesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [elements, setElements] = useState<CanvasElementReference[]>([]);
  const bounds = useGroupBounds(elements);
  const roundedFrame = useRoundedCanvasFrame(bounds?.width ?? 0, bounds?.height ?? 0);
  const isGroupSelected = selectedKind === "referenceGroup" && selectedId === CANVAS_GROUP_ID;
  const isTransforming = transformingRef.current;
  const suppressGroupHit =
    selectedKind === "reference" ||
    selectedKind === "boat" ||
    selectedKind === "mockShape" ||
    selectedKind === "referenceGroup";

  const reload = useCallback(() => {
    setElements(getCanvasElementsForRoom(roomId));
  }, [roomId]);

  useEffect(() => {
    reload();
  }, [linkedCanvasId, reload]);

  useEffect(() => {
    const handler = (event: Event) => {
      if (transformingRef.current) return;

      const detail = (event as CustomEvent<{ canvasId: string; roomId?: string }>).detail;
      if (!detail) return;

      if (detail.roomId === roomId) {
        reload();
        return;
      }

      const linkedCanvas = getCanvasByRoomId(roomId);
      if (linkedCanvas && detail.canvasId === linkedCanvas.id) {
        reload();
      }
    };

    window.addEventListener(CANVAS_SYNC_EVENT, handler);
    return () => window.removeEventListener(CANVAS_SYNC_EVENT, handler);
  }, [roomId, reload, transformingRef]);

  useLayoutEffect(() => {
    if (!groupRef.current || !bounds || transformingRef.current) return;
    const offset = getReferenceGroupOffset(roomId);
    groupRef.current.position.set(
      bounds.center.x + offset.x,
      bounds.center.y + offset.y,
      bounds.center.z + offset.z,
    );
    groupRef.current.rotation.set(0, 0, 0);
  }, [bounds, roomId, transformingRef]);

  const handleGroupPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    onSelect({
      id: CANVAS_GROUP_ID,
      kind: "referenceGroup",
      object: groupRef.current,
    });
  };

  const handleSelectGroup = useCallback(() => {
    if (!groupRef.current) return;
    onSelect({
      id: CANVAS_GROUP_ID,
      kind: "referenceGroup",
      object: groupRef.current,
    });
  }, [onSelect]);

  if (elements.length === 0) return null;

  return (
    <group ref={groupRef}>
      {bounds ? (
        <group>
          <mesh
            position={[0, 0, -0.01]}
            onPointerDown={handleGroupPointerDown}
            raycast={suppressGroupHit ? () => null : undefined}
          >
            <shapeGeometry args={[roundedFrame.shape]} />
            <meshBasicMaterial
              color={CANVAS_BG}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {isGroupSelected ? (
            <mesh position={[0, 0, -0.008]} raycast={() => null}>
              <shapeGeometry args={[roundedFrame.shape]} />
              <meshBasicMaterial
                color="#7B3FF2"
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ) : null}

          <Line
            points={roundedFrame.outline}
            color="#7B3FF2"
            lineWidth={isGroupSelected ? 2 : 1.25}
            dashed
            dashSize={0.1}
            gapSize={0.07}
            transparent
            opacity={isGroupSelected ? 0.95 : 0.55}
            raycast={() => null}
          />

          <CanvasGroupMoveHandle
            frameHeight={bounds.height}
            groupRef={groupRef}
            planeZ={bounds.center.z}
            roomId={roomId}
            transformingRef={transformingRef}
          />
        </group>
      ) : null}

      {bounds
        ? elements.map((element) => {
            if (element.kind === "text") {
              return (
                <TextElementPlane
                  key={element.id}
                  element={element}
                  groupCenter={bounds.center}
                  isSelected={selectedKind === "reference" && selectedId === element.id}
                  isTransforming={isTransforming}
                  onSelect={onSelect}
                  onSelectGroup={handleSelectGroup}
                />
              );
            }

            if (element.kind === "sketch") {
              return (
                <SketchElementPlane
                  key={element.id}
                  element={element}
                  groupCenter={bounds.center}
                  isSelected={selectedKind === "reference" && selectedId === element.id}
                  isTransforming={isTransforming}
                  onSelect={onSelect}
                  onSelectGroup={handleSelectGroup}
                />
              );
            }

            return (
              <ImageElementPlane
                key={element.id}
                element={element}
                groupCenter={bounds.center}
                isSelected={selectedKind === "reference" && selectedId === element.id}
                isTransforming={isTransforming}
                onSelect={onSelect}
                onSelectGroup={handleSelectGroup}
              />
            );
          })
        : null}
    </group>
  );
}
