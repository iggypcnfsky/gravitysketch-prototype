"use client";

import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { MockShapeId, ObjectTransform } from "@/lib/types";
import type { SceneSelection } from "./ReferencePlanes";

export const MOCK_SHAPE_ID = "mock-shape";

const SHAPE_COLORS: Record<MockShapeId, string> = {
  cube: "#7b3ff2",
  sphere: "#f97316",
  cone: "#22c55e",
};

interface MockShapeModelProps {
  shape: MockShapeId;
  initialTransform?: ObjectTransform;
  selected: boolean;
  onSelect: (selection: SceneSelection) => void;
}

function ShapeGeometry({ shape }: { shape: MockShapeId }) {
  switch (shape) {
    case "sphere":
      return <sphereGeometry args={[0.5, 32, 32]} />;
    case "cone":
      return <coneGeometry args={[0.5, 1, 32]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}

export function MockShapeModel({
  shape,
  initialTransform,
  selected,
  onSelect,
}: MockShapeModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    onSelect({ id: MOCK_SHAPE_ID, kind: "mockShape", object: groupRef.current });
  };

  return (
    <group
      ref={groupRef}
      position={
        initialTransform
          ? [
              initialTransform.position.x,
              initialTransform.position.y,
              initialTransform.position.z,
            ]
          : [0, 0.5, 0]
      }
      rotation={
        initialTransform
          ? [
              initialTransform.rotation.x,
              initialTransform.rotation.y,
              initialTransform.rotation.z,
            ]
          : undefined
      }
      scale={
        initialTransform
          ? [initialTransform.scale.x, initialTransform.scale.y, initialTransform.scale.z]
          : undefined
      }
      onPointerDown={handlePointerDown}
    >
      <mesh castShadow receiveShadow>
        <ShapeGeometry shape={shape} />
        <meshStandardMaterial
          color={SHAPE_COLORS[shape]}
          metalness={0.12}
          roughness={0.42}
        />
      </mesh>
      {selected ? (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.12, 1.12, 1.12]} />
          <meshBasicMaterial color="#7B3FF2" transparent opacity={0.14} wireframe />
        </mesh>
      ) : null}
    </group>
  );
}
