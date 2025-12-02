import * as THREE from 'three';
import gsap from 'gsap';
import { EventBus } from './EventController';
import { DEFAULT_CAMERA_ANIMATION_CONFIG } from '../../config';


export class CameraController {
  private cameraReference: THREE.PerspectiveCamera;
  private initialCameraPosition: THREE.Vector3;

  constructor(perspectiveCamera: THREE.PerspectiveCamera) {
    this.cameraReference = perspectiveCamera;
    this.initialCameraPosition = perspectiveCamera.position.clone();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.attachListener('CAMERA:RESET', () => {
      this.resetCameraToInitialPosition();
    });

    EventBus.attachListener('CAMERA:ZOOM', () => {
      this.moveCameraToTarget(
        new THREE.Vector3(
          this.initialCameraPosition.x,
          this.initialCameraPosition.y - 10,
          this.initialCameraPosition.z - 20
        )
      );
    });

    EventBus.attachListener('CAMERA:SHAKE', () => {
      this.applyCameraShake();
    });
  }

  moveCameraToTarget(
    targetPosition: THREE.Vector3,
    animationDuration: number = 1,
    animationDelay: number = 0
  ): void {
    gsap.to(this.cameraReference.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: animationDuration,
      ease: DEFAULT_CAMERA_ANIMATION_CONFIG.ease,
      delay: animationDelay,
    });
  }

  resetCameraToInitialPosition(
    animationDuration: number = 1,
    animationDelay: number = 0
  ): void {
    gsap.to(this.cameraReference.position, {
      x: this.initialCameraPosition.x,
      y: this.initialCameraPosition.y,
      z: this.initialCameraPosition.z,
      duration: animationDuration,
      ease: DEFAULT_CAMERA_ANIMATION_CONFIG.ease,
      delay: animationDelay,
    });
  }

  applyCameraShake(shakeIntensity: number = 0.5, shakeDuration: number = 0.5): void {
    const originalCameraPosition = this.cameraReference.position.clone();
    const shakeTimeline = gsap.timeline({
      onComplete: () => {
        this.cameraReference.position.set(
          originalCameraPosition.x,
          originalCameraPosition.y,
          originalCameraPosition.z
        );
      },
    });

    const numberOfShakes = shakeDuration * 10;

    for (let shakeIndex = 0; shakeIndex < numberOfShakes; shakeIndex++) {
      shakeTimeline.to(this.cameraReference.position, {
        x: originalCameraPosition.x + (Math.random() - 0.5) * shakeIntensity,
        y: originalCameraPosition.y + (Math.random() - 0.5) * shakeIntensity,
        duration: shakeDuration / numberOfShakes,
        ease: 'power1.inOut',
      });
    }
  }
}
