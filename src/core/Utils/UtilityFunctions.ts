import * as THREE from 'three';
import gsap from 'gsap';
export function getAnimationByIdentifier(
  itemId: string,
  animationsRegistry: AnimationRegistryType
): AnimationDataSet | undefined {
  return Object.values(animationsRegistry).find((animation) => animation.id === itemId);
}

export function checkIfAnimationExists(
  itemId: string,
  animationsRegistry: AnimationRegistryType
): boolean {
  return Object.values(animationsRegistry).some((animation) => animation.id === itemId);
}

export function animateScaleTo(
  object3D: THREE.Object3D,
  animationDuration: number = 1,
  targetScale: number = 1
): void {
  object3D.scale.set(0, 0, 0);

  gsap.to(object3D.scale, {
    x: targetScale,
    y: targetScale,
    z: targetScale,
    duration: animationDuration,
    ease: 'power4.in',
  });
}

export type AnimationDataSet = {
  id: string;
  idle: string;
  action: string;
  sound: string;
};

export type AnimationRegistryType = {
  chicken: AnimationDataSet;
  sheep: AnimationDataSet;
  cow: AnimationDataSet;
};

export function worldToScreen(
  position3D: THREE.Vector3,
  camera: THREE.Camera
): { x: number; y: number } {
  const vector = position3D.clone();
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

  return { x, y };
}
