"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { computeRoomSceneBounds, frameCameraToBounds } from "@/lib/scene-frame";

interface SceneFrameControllerProps {
  roomId: string;
  linkedCanvasId?: string;
  contentRef: React.RefObject<THREE.Group | null>;
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
  hasBoat: boolean;
}

export function SceneFrameController({
  roomId,
  linkedCanvasId,
  contentRef,
  orbitRef,
  hasBoat,
}: SceneFrameControllerProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const framedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    framedRoomRef.current = null;
  }, [linkedCanvasId, roomId]);

  useEffect(() => {
    if (framedRoomRef.current === roomId) return;

    let cancelled = false;
    let attempt = 0;

    const tryFrame = () => {
      if (cancelled || framedRoomRef.current === roomId) return;

      const controls = orbitRef.current;
      if (!controls) {
        if (attempt++ < 12) window.setTimeout(tryFrame, 50);
        return;
      }

      if (size.width < 20 || size.height < 20) {
        if (attempt++ < 12) window.setTimeout(tryFrame, 50);
        return;
      }

      const bounds = computeRoomSceneBounds(roomId);

      if (contentRef.current) {
        const graphBounds = new THREE.Box3().setFromObject(contentRef.current);
        if (!graphBounds.isEmpty()) bounds.union(graphBounds);
      }

      const graphSize = contentRef.current
        ? new THREE.Box3().setFromObject(contentRef.current).getSize(new THREE.Vector3()).length()
        : 0;
      const waitingForBoatMesh = hasBoat && graphSize < 0.75 && attempt < 10;

      if (waitingForBoatMesh) {
        attempt += 1;
        window.setTimeout(tryFrame, 100);
        return;
      }

      frameCameraToBounds(bounds, camera, controls, size);
      framedRoomRef.current = roomId;
    };

    const timer = window.setTimeout(tryFrame, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [camera, contentRef, hasBoat, linkedCanvasId, orbitRef, roomId, size.height, size.width]);

  return null;
}
