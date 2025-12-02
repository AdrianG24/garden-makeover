import * as THREE from 'three';
import gsap from 'gsap';
import { DIRECTIONAL_LIGHT_PRESETS } from '../../config';

export class LightingController {
  public directionalLight: THREE.DirectionalLight;
  public currentMode: 'day' | 'night' = 'day';

  constructor(private sceneReference: THREE.Scene) {
    const initialPreset = DIRECTIONAL_LIGHT_PRESETS.day;

    this.directionalLight = new THREE.DirectionalLight(
      initialPreset.color,
      initialPreset.intensity
    );

    this.directionalLight.position.set(
      initialPreset.position.x,
      initialPreset.position.y,
      initialPreset.position.z
    );

    this.directionalLight.castShadow = true;

    Object.assign(this.directionalLight.shadow.camera, initialPreset.shadow.camera);
    this.directionalLight.shadow.bias = initialPreset.shadow.bias;
    this.directionalLight.shadow.normalBias = initialPreset.shadow.normalBias;
    this.directionalLight.shadow.mapSize.set(
      initialPreset.shadow.mapSize.x,
      initialPreset.shadow.mapSize.y
    );

    this.sceneReference.add(this.directionalLight);
  }

  public switchToMode(mode: 'day' | 'night'): void {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    const preset = DIRECTIONAL_LIGHT_PRESETS[mode];

    gsap.to(this.directionalLight, {
      intensity: preset.intensity,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    gsap.to(this.directionalLight.position, {
      x: preset.position.x,
      y: preset.position.y,
      z: preset.position.z,
      duration: 1.5,
      ease: 'power2.inOut',
    });

    const currentColor = new THREE.Color(this.directionalLight.color);
    const targetColor = new THREE.Color(preset.color);
    const colorProxy = { r: currentColor.r, g: currentColor.g, b: currentColor.b };

    gsap.to(colorProxy, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.directionalLight.color.setRGB(colorProxy.r, colorProxy.g, colorProxy.b);
      },
    });

    Object.assign(this.directionalLight.shadow.camera, preset.shadow.camera);
    this.directionalLight.shadow.bias = preset.shadow.bias;
    this.directionalLight.shadow.normalBias = preset.shadow.normalBias;
    this.directionalLight.shadow.camera.updateProjectionMatrix();
    this.directionalLight.shadow.needsUpdate = true;
  }

  public toggleDayNight(): void {
    const newMode = this.currentMode === 'day' ? 'night' : 'day';
    this.switchToMode(newMode);
  }
}

