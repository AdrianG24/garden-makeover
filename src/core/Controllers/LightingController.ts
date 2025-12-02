import * as THREE from 'three';
import { DIRECTIONAL_LIGHT_PRESETS } from '../../config';

export class LightingController {
  public directionalLight: THREE.DirectionalLight;

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


}

