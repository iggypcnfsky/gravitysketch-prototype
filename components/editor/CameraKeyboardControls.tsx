"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

const MOVE_KEYS = new Set(["w", "a", "s", "d", "q", "e"]);
const MOVE_SPEED = 3.5;
const SHIFT_SPEED_MULTIPLIER = 2;

interface CameraKeyboardControlsProps {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
  enabled?: boolean;
}

export function CameraKeyboardControls({
  orbitRef,
  enabled = true,
}: CameraKeyboardControlsProps) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const shiftHeld = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "Shift") {
        shiftHeld.current = true;
        return;
      }
      const key = event.key.toLowerCase();
      if (!MOVE_KEYS.has(key)) return;
      keys.current.add(key);
      event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        shiftHeld.current = false;
        return;
      }
      keys.current.delete(event.key.toLowerCase());
    };

    const onBlur = () => {
      keys.current.clear();
      shiftHeld.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled || keys.current.size === 0) return;

    const controls = orbitRef.current;
    if (!controls) return;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() === 0) forward.set(0, 0, -1);
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const movement = new THREE.Vector3();

    if (keys.current.has("w")) movement.add(forward);
    if (keys.current.has("s")) movement.sub(forward);
    if (keys.current.has("a")) movement.sub(right);
    if (keys.current.has("d")) movement.add(right);
    if (keys.current.has("q")) movement.y -= 1;
    if (keys.current.has("e")) movement.y += 1;

    if (movement.lengthSq() === 0) return;

    const speed = MOVE_SPEED * (shiftHeld.current ? SHIFT_SPEED_MULTIPLIER : 1);
    movement.normalize().multiplyScalar(speed * delta);
    camera.position.add(movement);
    controls.target.add(movement);
    controls.update();
  });

  return null;
}
