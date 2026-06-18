"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MockShapeId } from "@/lib/types";

const BOAT_MODEL_PATH = "/models/boat-1/boat-1.gltf";

function BoatPreviewModel() {
  const { scene } = useGLTF(BOAT_MODEL_PATH);
  const model = scene.clone(true);
  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.material = new THREE.MeshStandardMaterial({
      color: "#c9c2b6",
      metalness: 0.06,
      roughness: 0.68,
      side: THREE.DoubleSide,
    });
  });

  return (
    <Center top>
      <primitive object={model} scale={1} />
    </Center>
  );
}

function MockShapePreviewModel({ shape }: { shape: MockShapeId }) {
  const color =
    shape === "cube" ? "#7b3ff2" : shape === "sphere" ? "#f97316" : "#22c55e";

  return (
    <mesh position={[0, 0.5, 0]}>
      {shape === "sphere" ? (
        <sphereGeometry args={[0.5, 24, 24]} />
      ) : shape === "cone" ? (
        <coneGeometry args={[0.5, 1, 24]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.45} />
    </mesh>
  );
}

function RenderOnce() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  return null;
}

interface RoomPreviewProps {
  showBoat?: boolean;
  mockShape?: MockShapeId;
}

export function RoomPreview({ showBoat = false, mockShape }: RoomPreviewProps) {
  if (!showBoat && !mockShape) {
    return <div style={{ width: "100%", height: "100%", background: "#e4e4e4" }} />;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [2.2, 1.6, 2.8], fov: 38 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <color attach="background" args={["#e4e4e4"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 4]} intensity={0.95} />
        <directionalLight position={[-3, 2, 2]} intensity={0.25} />
        <Suspense fallback={null}>
          {showBoat ? <BoatPreviewModel /> : null}
          {mockShape ? <MockShapePreviewModel shape={mockShape} /> : null}
          <RenderOnce />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(BOAT_MODEL_PATH);
