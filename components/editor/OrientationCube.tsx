"use client";

import { useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

interface OrientationCubeProps {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
}

function ViewCubeDragHandle({ orbitRef }: OrientationCubeProps) {
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical());

  return (
    <mesh
      scale={[72, 72, 72]}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        dragging.current = true;
        lastPointer.current = { x: event.clientX, y: event.clientY };
        gl.domElement.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event: ThreeEvent<PointerEvent>) => {
        dragging.current = false;
        gl.domElement.releasePointerCapture(event.pointerId);
      }}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        if (!dragging.current) return;
        event.stopPropagation();

        const controls = orbitRef.current;
        if (!controls) return;

        const dx = event.clientX - lastPointer.current.x;
        const dy = event.clientY - lastPointer.current.y;
        lastPointer.current = { x: event.clientX, y: event.clientY };

        const offset = camera.position.clone().sub(controls.target);
        spherical.current.setFromVector3(offset);
        spherical.current.theta -= dx * 0.012;
        spherical.current.phi = THREE.MathUtils.clamp(
          spherical.current.phi + dy * 0.012,
          0.15,
          Math.PI - 0.15,
        );

        camera.position.setFromSpherical(spherical.current).add(controls.target);
        camera.lookAt(controls.target);
        controls.update();
      }}
    >
      <boxGeometry />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export function OrientationCube({ orbitRef }: OrientationCubeProps) {
  return (
    <GizmoHelper alignment="bottom-left" margin={[92, 148]}>
      <ViewCubeDragHandle orbitRef={orbitRef} />
      <GizmoViewcube />
    </GizmoHelper>
  );
}
