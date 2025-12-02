import * as THREE from 'three';
import gsap from 'gsap';
import { loadGLTF } from './AssetLoaderController';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { checkIfAnimationExists, getAnimationByIdentifier } from '../Utils/UtilityFunctions';
import { Animations } from '../../config';
import { playSoundEffect } from '../Utils/AudioManager';

export interface ModelConfiguration {
  url: string;
  name: string;
  position?: [number, number, number];
}

export interface SceneConfiguration {
  name: string;
  models: ModelConfiguration[];
}

export interface SceneControllerConfiguration {
  scenes: SceneConfiguration[];
}

export class SceneController {
  private sceneReference: THREE.Scene;
  
  private loadedModelsMap = new Map<string, THREE.Object3D>();

  public animationMixers: THREE.AnimationMixer[] = [];
  public sceneGroupsMap = new Map<string, InteractiveGroup>();
  public childObjectsMap = new Map<string, THREE.Object3D>();
  public namedModelsMap = new Map<string, THREE.Object3D>();
  public animationClipsMap = new Map<string, THREE.AnimationClip[]>();
  public activeSceneIdentifier: string | null = null;
  public rendererReference: THREE.WebGLRenderer;

  constructor(threeScene: THREE.Scene, webglRenderer: THREE.WebGLRenderer) {
    this.sceneReference = threeScene;
    this.rendererReference = webglRenderer;
  }

  async loadSceneFromConfig(sceneConfig: SceneConfiguration): Promise<void> {
    if (this.sceneGroupsMap.has(sceneConfig.name)) return;

    const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    const gradientTexture: THREE.Texture = await new Promise((resolvePromise) => {
      textureLoader.load(
        'assets/images/gradient.png',
        (loadedTexture: THREE.Texture) => {
          loadedTexture.minFilter = THREE.NearestFilter;
          loadedTexture.magFilter = THREE.NearestFilter;
          loadedTexture.generateMipmaps = false;
          resolvePromise(loadedTexture);
        },
        undefined
      );
    });

    const interactiveSceneGroup: InteractiveGroup = new InteractiveGroup();
    interactiveSceneGroup.name = sceneConfig.name;

    for (const modelConfig of sceneConfig.models) {
      const loadedModel = await loadGLTF(modelConfig.url);
      const modelAnimationClips: THREE.AnimationClip[] | undefined = loadedModel.animations;

      if (modelAnimationClips && modelAnimationClips.length) {
        this.animationClipsMap.set(modelConfig.name, modelAnimationClips);
      }

      const modelSceneObject: THREE.Object3D = loadedModel.scene;

      if (modelConfig.position) {
        modelSceneObject.position.set(...modelConfig.position);
      }

      interactiveSceneGroup.add(modelSceneObject);

      if (modelConfig.name) {
        this.namedModelsMap.set(modelConfig.name, modelSceneObject);
      }

      this.loadedModelsMap.set(modelConfig.url, modelSceneObject);
    }

    interactiveSceneGroup.traverse((childObject: THREE.Object3D): void => {
      if (childObject instanceof THREE.Mesh && childObject.material) {
        this.applyToonMaterialToMesh(childObject, gradientTexture);
      }
    });

    interactiveSceneGroup.visible = true;
    this.sceneReference.add(interactiveSceneGroup);
    this.sceneGroupsMap.set(sceneConfig.name, interactiveSceneGroup);
  }

  getChildObjectFromScene(
    sceneName: string,
    childObjectName: string
  ): THREE.Object3D | undefined {
    const sceneGroup: InteractiveGroup | undefined = this.sceneGroupsMap.get(sceneName);
    if (!sceneGroup) return;

    return sceneGroup.getObjectByName(childObjectName) || undefined;
  }

  async displayScene(sceneName: string): Promise<void> {
    const targetSceneGroup: InteractiveGroup | undefined =
      this.sceneGroupsMap.get(sceneName);
    if (!targetSceneGroup) return;

    if (this.activeSceneIdentifier && this.activeSceneIdentifier !== sceneName) {
      await this.hideScene(this.activeSceneIdentifier);
    }

    targetSceneGroup.visible = true;
    await this.animateSceneOpacity(targetSceneGroup, 1, 1);
    this.activeSceneIdentifier = sceneName;
  }

  async hideScene(sceneName: string): Promise<void> {
    const targetSceneGroup: InteractiveGroup | undefined =
      this.sceneGroupsMap.get(sceneName);
    if (!targetSceneGroup) return;

    await this.animateSceneOpacity(targetSceneGroup, 0, 1);
    targetSceneGroup.visible = false;

    if (this.activeSceneIdentifier === sceneName) {
      this.activeSceneIdentifier = null;
    }
  }

  private applyToonMaterialToMesh(
    meshObject: THREE.Mesh,
    gradientTexture: THREE.Texture
  ): void {
    meshObject.castShadow = true;
    meshObject.receiveShadow = true;

    if (meshObject.material instanceof THREE.MeshStandardMaterial) {
      const originalMaterial = meshObject.material;

      meshObject.material = new THREE.MeshToonMaterial({
        color: originalMaterial.color || new THREE.Color(0xffffff),
        gradientMap: gradientTexture,
        map: originalMaterial.map ?? null,
        alphaMap: originalMaterial.alphaMap ?? null,
        transparent: originalMaterial.transparent,
        opacity: originalMaterial.opacity,
        side: originalMaterial.side,
      });
    }

    if (Array.isArray(meshObject.material)) {
      meshObject.material.forEach(
        (materialItem: THREE.Material & { attenuationColor?: THREE.Color }): void => {
          materialItem.transparent = true;
          if (!materialItem.attenuationColor) {
            materialItem.attenuationColor = new THREE.Color(0xffffff);
          }
          materialItem.depthWrite = true;
          materialItem.needsUpdate = true;
        }
      );
    } else {
      meshObject.material.transparent = true;
      meshObject.material.depthWrite = true;
      meshObject.material.needsUpdate = true;
    }
  }

  private animateSceneOpacity(
    sceneGroup: THREE.Group,
    targetOpacityValue: number,
    animationDuration: number
  ): Promise<void> {
    return new Promise((resolvePromise: () => void): void => {
      const materialsToAnimate: THREE.Material[] = [];

      sceneGroup.traverse((childObject: THREE.Object3D): void => {
        if (childObject instanceof THREE.Mesh && childObject.material) {
          if (Array.isArray(childObject.material)) {
            materialsToAnimate.push(...childObject.material);
          } else {
            materialsToAnimate.push(childObject.material);
          }
        }
      });

      gsap.to(materialsToAnimate, {
        opacity: targetOpacityValue,
        duration: animationDuration,
        ease: 'power2.out',
        onComplete: resolvePromise,
      });
    });
  }

  createInstanceFromClick(objectIdentifier: string = 'chicken_1'): THREE.Object3D | undefined {
    const sourceObject: THREE.Object3D | undefined = this.getChildObjectFromScene(
      'Base',
      objectIdentifier
    );

    if (!sourceObject) return;

    const clonedObject: THREE.Object3D = SkeletonUtils.clone(sourceObject);
    const randomRotationY: number = Math.floor(Math.random() * 61) - 30;
    clonedObject.rotation.set(0, randomRotationY, 0);

    const availableAnimations: THREE.AnimationClip[] | undefined =
      this.animationClipsMap.get('objects');

    if (!availableAnimations || availableAnimations.length === 0) return;

    if (!checkIfAnimationExists(objectIdentifier, Animations)) {
      playSoundEffect('sound_throw_spear');
      return clonedObject;
    }

    const animationProperties = getAnimationByIdentifier(objectIdentifier, Animations);
    if (!animationProperties) return clonedObject;

    const idleAnimationClip: THREE.AnimationClip | undefined = availableAnimations.find(
      (animationClip: THREE.AnimationClip): boolean =>
        animationClip.name === animationProperties.idle
    );

    if (!idleAnimationClip) return clonedObject;

    clonedObject.animations = [idleAnimationClip];

    const animationMixer: THREE.AnimationMixer = new THREE.AnimationMixer(clonedObject);
    this.animationMixers.push(animationMixer);

    const selectedClip: THREE.AnimationClip | undefined = THREE.AnimationClip.findByName(
      clonedObject.animations,
      animationProperties.idle
    );

    if (selectedClip) {
      const animationAction = animationMixer.clipAction(selectedClip);
      playSoundEffect(animationProperties.sound);
      animationAction.play();
    }

    clonedObject.traverse((childObject: THREE.Object3D): void => {
      if (childObject instanceof THREE.Mesh && childObject.material) {
        this.configureMeshDefaults(childObject);
      }
    });

    return clonedObject;
  }

  private configureMeshDefaults(meshObject: THREE.Mesh): void {
    meshObject.castShadow = true;
    meshObject.receiveShadow = true;

    if (Array.isArray(meshObject.material)) {
      meshObject.material.forEach(
        (
          materialItem: THREE.Material & {
            transparent?: boolean;
            opacity?: number;
            depthWrite?: boolean;
            needsUpdate?: boolean;
          }
        ) => {
          materialItem.transparent = true;
          materialItem.opacity = 1;
          materialItem.depthWrite = true;
          materialItem.needsUpdate = true;
        }
      );
    }
  }
}
