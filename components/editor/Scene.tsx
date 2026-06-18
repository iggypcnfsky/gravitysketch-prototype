"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Center,
  Grid,
  OrbitControls,
  TransformControls,
  useGLTF,
} from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  ReferencePlanes,
  type SceneSelection,
} from "./ReferencePlanes";
import { CameraKeyboardControls } from "./CameraKeyboardControls";
import { MOCK_SHAPE_ID, MockShapeModel } from "./MockShapeModel";
import { OrientationCube } from "./OrientationCube";
import { ProjectionCamera, type CameraProjection } from "./ProjectionCamera";
import { SceneFrameController } from "./SceneFrameController";
import {
  saveReferenceGroupTransform,
  getRoom,
  updateCanvasElementFrom3D,
  updateMockShapeTransform,
  updateRoomModelTransform,
} from "@/lib/store";
import type { ObjectTransform } from "@/lib/types";

const BOAT_MODEL_PATH = "/models/boat-1/boat-1.gltf";
const BOAT_ID = "boat";

type TransformMode = "translate" | "rotate" | "scale";

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const BOAT_SURFACE = {
  color: "#c9c2b6",
  metalness: 0.06,
  roughness: 0.68,
} as const;

function applyBoatMaterial(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material.dispose());

    mesh.material = new THREE.MeshStandardMaterial({
      color: BOAT_SURFACE.color,
      metalness: BOAT_SURFACE.metalness,
      roughness: BOAT_SURFACE.roughness,
      side: THREE.DoubleSide,
    });
  });
}

function readObjectTransform(object: THREE.Object3D): ObjectTransform {
  return {
    position: { x: object.position.x, y: object.position.y, z: object.position.z },
    rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
    scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
  };
}

interface BoatModelProps {
  initialTransform?: ObjectTransform;
  selected: boolean;
  onSelect: (selection: SceneSelection) => void;
}

function BoatModel({ initialTransform, selected, onSelect }: BoatModelProps) {
  const { scene } = useGLTF(BOAT_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    applyBoatMaterial(clone);
    return clone;
  }, [scene]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!groupRef.current) return;
    onSelect({ id: BOAT_ID, kind: "boat", object: groupRef.current });
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
          : undefined
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
      <Center top>
        <primitive object={model} scale={1.2} />
      </Center>
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.18, 48]} />
          <meshBasicMaterial color="#7B3FF2" transparent opacity={0.45} />
        </mesh>
      ) : null}
    </group>
  );
}

function ThreePointLighting() {
  return (
    <>
      <ambientLight intensity={0.16} />
      <directionalLight position={[5, 8, 5]} intensity={1.05} color="#ffffff" />
      <directionalLight position={[-4.5, 3.5, 4]} intensity={0.32} color="#e8eef8" />
      <directionalLight position={[0.5, 6, -6]} intensity={0.5} color="#fff4e8" />
    </>
  );
}

interface SceneProps {
  roomId: string;
  linkedCanvasId?: string;
  projection: CameraProjection;
  transformingRef: React.MutableRefObject<boolean>;
  onRegisterDeselect?: (fn: () => void) => void;
}

export function Scene({ roomId, linkedCanvasId, projection, transformingRef, onRegisterDeselect }: SceneProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const sceneContentRef = useRef<THREE.Group>(null);
  const [selection, setSelection] = useState<SceneSelection | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const room = getRoom(roomId);
  const showBoat = room?.models?.includes("boat") ?? false;
  const boatTransform = room?.modelTransforms?.boat;
  const mockShape = room?.mockShape;
  const mockShapeTransform = room?.mockShapeTransform;
  const hasPrimaryObject = showBoat || !!mockShape;

  const handleSelect = useCallback((next: SceneSelection) => {
    setSelection(next);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    onRegisterDeselect?.(handleDeselect);
    return () => onRegisterDeselect?.(() => {});
  }, [handleDeselect, onRegisterDeselect]);

  const handleTransformChange = useCallback(() => {
    if (!selection) return;

    if (selection.kind === "boat") {
      updateRoomModelTransform(roomId, "boat", readObjectTransform(selection.object));
      return;
    }

    if (selection.kind === "mockShape") {
      updateMockShapeTransform(roomId, readObjectTransform(selection.object));
      return;
    }

    if (selection.kind === "referenceGroup") {
      saveReferenceGroupTransform(selection.object as THREE.Group, roomId);
      return;
    }

    if (selection.kind !== "reference") return;

    const worldPosition = new THREE.Vector3();
    selection.object.getWorldPosition(worldPosition);
    updateCanvasElementFrom3D(roomId, selection.id, {
      position3d: {
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
      },
      rotation: THREE.MathUtils.radToDeg(selection.object.rotation.z),
      scale: selection.object.scale.x,
    });
  }, [roomId, selection]);

  useEffect(() => {
    const controls = orbitRef.current;
    if (!controls) return;
    controls.keys = {
      LEFT: "Unidentified",
      UP: "Unidentified",
      RIGHT: "Unidentified",
      BOTTOM: "Unidentified",
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "g" || key === "1") setTransformMode("translate");
      if (key === "r" || key === "2") setTransformMode("rotate");
      if (key === "t" || key === "3") setTransformMode("scale");
      if (key === "escape") setSelection(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <ThreePointLighting />

      <Grid
        infiniteGrid
        cellSize={0.25}
        sectionSize={1}
        cellColor="#b8b8b8"
        sectionColor="#9a9a9a"
        fadeDistance={40}
        fadeStrength={1.2}
        position={[0, 0, 0]}
        raycast={() => null}
      />

      <axesHelper args={[3]} />

      <group ref={sceneContentRef}>
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            {showBoat ? (
              <BoatModel
                initialTransform={boatTransform}
                selected={selection?.id === BOAT_ID}
                onSelect={handleSelect}
              />
            ) : null}
          </Suspense>
        </SceneErrorBoundary>

        {mockShape ? (
          <MockShapeModel
            shape={mockShape}
            initialTransform={mockShapeTransform}
            selected={selection?.id === MOCK_SHAPE_ID}
            onSelect={handleSelect}
          />
        ) : null}

        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <ReferencePlanes
              roomId={roomId}
              linkedCanvasId={linkedCanvasId}
              selectedId={selection?.id ?? null}
              selectedKind={selection?.kind ?? null}
              transformingRef={transformingRef}
              onSelect={handleSelect}
            />
          </Suspense>
        </SceneErrorBoundary>
      </group>

      {selection ? (
        <TransformControls
          object={selection.object}
          mode={transformMode}
          onMouseDown={() => {
            transformingRef.current = true;
          }}
          onMouseUp={() => {
            transformingRef.current = false;
            handleTransformChange();
          }}
        />
      ) : null}

      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.08}
        makeDefault
        target={[0, 0.5, -0.5]}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <SceneFrameController
        roomId={roomId}
        linkedCanvasId={linkedCanvasId}
        contentRef={sceneContentRef}
        orbitRef={orbitRef}
        hasBoat={hasPrimaryObject}
      />

      <ProjectionCamera mode={projection} orbitRef={orbitRef} />

      <CameraKeyboardControls orbitRef={orbitRef} />
      <OrientationCube orbitRef={orbitRef} />
    </>
  );
}

useGLTF.preload(BOAT_MODEL_PATH);
