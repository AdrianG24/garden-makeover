import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';


export class AssetLoaderController {
  private static controllerInstance: AssetLoaderController;

  private gltfModelLoader: GLTFLoader;
  private assetCacheMap: Map<string, GLTF | THREE.Texture>;

  private constructor() {
    this.gltfModelLoader = new GLTFLoader();
    this.assetCacheMap = new Map();
  }

  public static getInstance(): AssetLoaderController {
    if (!AssetLoaderController.controllerInstance) {
      AssetLoaderController.controllerInstance = new AssetLoaderController();
    }
    return AssetLoaderController.controllerInstance;
  }

  async loadGLTFModel(filePath: string): Promise<GLTF> {
    if (this.assetCacheMap.has(filePath)) {
      return this.assetCacheMap.get(filePath) as GLTF;
    }

    return new Promise((resolvePromise, rejectPromise) => {
      this.gltfModelLoader.load(
        filePath,
        (loadedModel: GLTF) => {
          this.assetCacheMap.set(filePath, loadedModel);

          resolvePromise(loadedModel);
        },
        undefined,
        rejectPromise
      );
    });
  }
}
