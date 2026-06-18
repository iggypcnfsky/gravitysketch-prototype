"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Move } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { bakeReferenceGroupTransform } from "@/lib/store";
import styles from "./ReferencePlanes.module.css";

const PERSPECTIVE_DISTANCE_FACTOR = 7;
/** Matches drei Html scale in perspective (~1.6) at orthographic zoom 1. */
const ORTHO_TARGET_SCALE = 1.65;

interface CanvasGroupMoveHandleProps {
  frameHeight: number;
  groupRef: React.RefObject<THREE.Group | null>;
  planeZ: number;
  roomId: string;
  transformingRef: React.MutableRefObject<boolean>;
}

export function CanvasGroupMoveHandle({
  frameHeight,
  groupRef,
  planeZ,
  roomId,
  transformingRef,
}: CanvasGroupMoveHandleProps) {
  const { camera, gl, controls } = useThree();
  const [distanceFactor, setDistanceFactor] = useState(PERSPECTIVE_DISTANCE_FACTOR);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ), [planeZ]);
  const intersection = useRef(new THREE.Vector3());
  const dragOffset = useRef(new THREE.Vector3());

  useFrame(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      const next = ORTHO_TARGET_SCALE / Math.max(camera.zoom, 0.001);
      setDistanceFactor((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
      return;
    }

    setDistanceFactor((prev) => (prev === PERSPECTIVE_DISTANCE_FACTOR ? prev : PERSPECTIVE_DISTANCE_FACTOR));
  });

  const getPlaneHit = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);
      return raycaster.ray.intersectPlane(plane, intersection.current)
        ? intersection.current.clone()
        : null;
    },
    [camera, gl, mouse, plane, raycaster],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      const group = groupRef.current;
      if (!group) return;

      const hit = getPlaneHit(event.clientX, event.clientY);
      if (!hit) return;

      transformingRef.current = true;
      const orbitControls = controls as OrbitControlsImpl | null;
      if (orbitControls) orbitControls.enabled = false;

      dragOffset.current.copy(group.position).sub(hit);

      const onMove = (moveEvent: PointerEvent) => {
        const nextHit = getPlaneHit(moveEvent.clientX, moveEvent.clientY);
        if (!nextHit || !groupRef.current) return;
        groupRef.current.position.copy(nextHit).add(dragOffset.current);
      };

      const onUp = () => {
        transformingRef.current = false;
        if (orbitControls) orbitControls.enabled = true;
        if (groupRef.current) {
          bakeReferenceGroupTransform(groupRef.current, roomId);
        }
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      document.body.style.cursor = "grabbing";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [controls, getPlaneHit, groupRef, roomId, transformingRef],
  );

  return (
    <Html
      position={[0, frameHeight / 2 + 0.16, 0.05]}
      center
      distanceFactor={distanceFactor}
      zIndexRange={[120, 0]}
      style={{ pointerEvents: "none" }}
    >
      <button
        type="button"
        className={styles.moveHandle}
        style={{ pointerEvents: "auto" }}
        onPointerDown={handlePointerDown}
        aria-label="Drag to move canvas"
      >
        <Move size={14} strokeWidth={2} />
        <span className={styles.moveHandleLabel}>Move canvas</span>
      </button>
    </Html>
  );
}
