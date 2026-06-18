"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useFrame, useThree } from "@react-three/fiber";
import { Move } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { saveReferenceGroupTransform } from "@/lib/store";
import styles from "./ReferencePlanes.module.css";

interface MoveHandleRegistration {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  portalTarget: HTMLElement | null;
}

interface MoveHandleOverlayContextValue {
  register: (registration: MoveHandleRegistration) => void;
  unregister: () => void;
}

const MoveHandleOverlayContext = createContext<MoveHandleOverlayContextValue | null>(
  null,
);

export function CanvasGroupMoveHandleProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<MoveHandleRegistration | null>(
    null,
  );

  const register = useCallback((next: MoveHandleRegistration) => {
    setRegistration(next);
  }, []);

  const unregister = useCallback(() => {
    setRegistration(null);
  }, []);

  const contextValue = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );

  return (
    <MoveHandleOverlayContext.Provider value={contextValue}>
      {children}
      {registration?.portalTarget
        ? createPortal(
            <button
              ref={registration.buttonRef}
              type="button"
              className={styles.moveHandle}
              style={{
                display: "none",
                left: 0,
                position: "fixed",
                top: 0,
                transform: "translate(-50%, -50%)",
                zIndex: 120,
              }}
              onPointerDown={registration.onPointerDown}
              aria-label="Drag to move canvas"
            >
              <Move size={14} strokeWidth={2} />
              <span className={styles.moveHandleLabel}>Move canvas</span>
            </button>,
            registration.portalTarget,
          )
        : null}
    </MoveHandleOverlayContext.Provider>
  );
}

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
  const overlay = useContext(MoveHandleOverlayContext);
  const { camera, gl, controls } = useThree();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const handleLocalPosition = useMemo(
    () => new THREE.Vector3(0, frameHeight / 2 + 0.16, 0.05),
    [frameHeight],
  );
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ), [planeZ]);
  const intersection = useRef(new THREE.Vector3());
  const dragOffset = useRef(new THREE.Vector3());

  useEffect(() => {
    setPortalTarget(gl.domElement.parentElement ?? document.body);
  }, [gl]);

  useFrame(() => {
    const button = buttonRef.current;
    const group = groupRef.current;
    if (!button || !group) {
      if (button) button.style.display = "none";
      return;
    }

    worldPosition.copy(handleLocalPosition);
    worldPosition.applyMatrix4(group.matrixWorld);
    projected.copy(worldPosition).project(camera);

    const rect = gl.domElement.getBoundingClientRect();
    const x = rect.left + (projected.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-projected.y * 0.5 + 0.5) * rect.height;
    const visible = projected.z < 1;

    button.style.display = visible ? "flex" : "none";
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
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
          saveReferenceGroupTransform(groupRef.current, roomId);
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

  useEffect(() => {
    if (!overlay || !portalTarget) return;

    overlay.register({
      buttonRef,
      onPointerDown: handlePointerDown,
      portalTarget,
    });

    return () => overlay.unregister();
  }, [handlePointerDown, overlay, portalTarget]);

  return null;
}
