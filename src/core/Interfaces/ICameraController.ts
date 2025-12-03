import * as THREE from 'three';

export interface ICameraController {
  moveCameraToTarget(target: THREE.Vector3, duration?: number, delay?: number): void;
  resetCameraToInitialPosition(duration?: number, delay?: number): void;
  applyCameraShake(intensity?: number, duration?: number): void;
}
