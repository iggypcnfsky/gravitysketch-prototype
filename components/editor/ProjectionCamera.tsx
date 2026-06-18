"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

export type CameraProjection = "perspective" | "orthographic";

const DEFAULT_FOV = 45;
const DEFAULT_TARGET = new THREE.Vector3(0, 0.4, 0);

function createPerspectiveCamera(
  position: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number,
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, aspect, 0.01, 2000);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return camera;
}

function createOrthographicCamera(
  position: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number,
  zoom = 1,
): THREE.OrthographicCamera {
  const distance = Math.max(position.distanceTo(target), 0.01);
  const fovRad = THREE.MathUtils.degToRad(DEFAULT_FOV);
  const frustumHeight = (2 * distance * Math.tan(fovRad / 2)) / zoom;
  const frustumWidth = frustumHeight * aspect;

  const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2,
    frustumWidth / 2,
    frustumHeight / 2,
    -frustumHeight / 2,
    0.01,
    2000,
  );
  camera.position.copy(position);
  camera.zoom = zoom;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return camera;
}

function updateOrthographicFrustum(
  camera: THREE.OrthographicCamera,
  position: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number,
) {
  const distance = Math.max(position.distanceTo(target), 0.01);
  const fovRad = THREE.MathUtils.degToRad(DEFAULT_FOV);
  const frustumHeight = (2 * distance * Math.tan(fovRad / 2)) / camera.zoom;
  const frustumWidth = frustumHeight * aspect;

  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();
}

interface ProjectionCameraProps {
  mode: CameraProjection;
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
}

export function ProjectionCamera({ mode, orbitRef }: ProjectionCameraProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const set = useThree((state) => state.set);

  useLayoutEffect(() => {
    const currentCamera = camera;
    const controls = orbitRef.current;
    const target = controls?.target.clone() ?? DEFAULT_TARGET;
    const position = currentCamera.position.clone();
    const aspect = size.width / Math.max(size.height, 1);

    if (mode === "orthographic" && currentCamera instanceof THREE.OrthographicCamera) {
      updateOrthographicFrustum(currentCamera, position, target, aspect);
      return;
    }

    if (mode === "perspective" && currentCamera instanceof THREE.PerspectiveCamera) {
      currentCamera.aspect = aspect;
      currentCamera.updateProjectionMatrix();
      return;
    }

    const zoom =
      currentCamera instanceof THREE.OrthographicCamera ? currentCamera.zoom : 1;

    const nextCamera =
      mode === "orthographic"
        ? createOrthographicCamera(position, target, aspect, zoom)
        : createPerspectiveCamera(position, target, aspect);

    set({ camera: nextCamera });

    if (controls) {
      controls.object = nextCamera;
      controls.update();
    }
  }, [camera, mode, orbitRef, set, size.height, size.width]);

  return null;
}
