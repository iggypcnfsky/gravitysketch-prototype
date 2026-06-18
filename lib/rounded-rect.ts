import * as THREE from "three";

export function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);

  return shape;
}

export function createRoundedRectOutline(
  width: number,
  height: number,
  radius: number,
  segments = 48,
): THREE.Vector3[] {
  const shape = createRoundedRectShape(width, height, radius);
  const points = shape.getPoints(segments).map((point) => new THREE.Vector3(point.x, point.y, 0.002));
  if (points.length > 0) points.push(points[0].clone());
  return points;
}
