import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { InteractionManager } from 'three.interactive';
import Stats from 'stats.js';
import { BatchedRenderer } from 'three.quarks';
import { Container, WebGLRenderer } from 'pixi.js';
import gsap from 'gsap';
import { LightingController } from '../Controllers/LightingController';
import { SceneController } from '../Controllers/SceneController';
import { CameraController } from '../Controllers/CameraController';
import { InteractiveGrid } from '../Components/InteractiveGrid';
import { EventBus } from '../Controllers/EventController';
import { SCENE, CAMERA, RENDERER, GRID, sceneManagerConfig } from '../../config';

export class GameLayer {
  public threeScene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public webglRenderer!: THREE.WebGLRenderer;
  public clock: THREE.Clock;
  public stats!: Stats;

  public lightingController: LightingController | null = null;
  public sceneController: SceneController | null = null;
  public cameraController!: CameraController;
  public interactiveGrid: InteractiveGrid | null = null;

  private interactionManager: InteractionManager | null = null;
  private orbitControls!: OrbitControls;
  private particleSystem: BatchedRenderer;
  private cameraInfoDisplay: HTMLDivElement | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private cameraLookAtTarget: THREE.Vector3 = new THREE.Vector3(-7, 0, 0);

  constructor(canvasElement: HTMLCanvasElement, showDebug: boolean = false) {
    this.clock = new THREE.Clock();

    this.initializeStats(showDebug);
    this.initializeScene();
    this.initializeCamera();
    this.initializeRenderer(canvasElement);

    this.particleSystem = new BatchedRenderer();
    this.threeScene.add(this.particleSystem);
  }

  private initializeStats(showDebug: boolean): void {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.display = showDebug ? 'block' : 'none';
  }

  private initializeScene(): void {
    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(SCENE.backgroundColor);
  }

  private initializeCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far
    );

    this.camera.position.set(CAMERA.pos.x, CAMERA.pos.y, CAMERA.pos.z);
    this.camera.rotation.set(-0.5, 0, 0);
    this.camera.updateProjectionMatrix();

    this.cameraController = new CameraController(this.camera);
  }

  private initializeRenderer(canvasElement: HTMLCanvasElement): void {
    const isMobile = window.innerWidth < 768;

    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: RENDERER.antialias,
      canvas: canvasElement,
      powerPreference: isMobile ? 'default' : 'high-performance',
    });

    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.shadowMap.enabled = RENDERER.shadow.enabled;
    this.webglRenderer.shadowMap.type = RENDERER.shadow.type;
    this.webglRenderer.transmissionResolutionScale = Math.min(window.devicePixelRatio, 2);
  }

  async setupGameWorld(): Promise<void> {
    this.sceneController = new SceneController(this.threeScene, this.webglRenderer);
    await this.sceneController.loadSceneFromConfig(sceneManagerConfig.scenes[0]);
    await this.sceneController.displayScene('Base');

    const ground = this.sceneController.namedModelsMap.get('ground');
    if (ground) ground.visible = false;

    const objects = this.sceneController.namedModelsMap.get('objects');
    if (objects) objects.visible = false;

    this.lightingController = new LightingController(this.threeScene);
    this.addSceneLighting();

    this.interactionManager = new InteractionManager(
        this.webglRenderer,
        this.camera,
        this.webglRenderer.domElement
    );

    this.interactiveGrid = new InteractiveGrid(GRID, this.interactionManager, this.sceneController);
    this.threeScene.add(this.interactiveGrid.gridGroupContainer);

    this.setupOrbitControls();
    this.threeScene.updateMatrix();
  }

  public revealFarm(): void {
    if (!this.sceneController) return;

    const ground = this.sceneController.namedModelsMap.get('ground');
    const objects = this.sceneController.namedModelsMap.get('objects');

    const targets: THREE.Object3D[] = [];
    if (ground) targets.push(ground);
    if (objects) targets.push(objects);

    targets.forEach((obj) => {
      if (!obj) return;

      if (!obj.userData._introOriginal) {
        obj.userData._introOriginal = {
          y: obj.position.y,
          scale: obj.scale.clone(),
        };
      }

      const originalScale = obj.userData._introOriginal.scale as THREE.Vector3;

      obj.visible = true;
      obj.scale.set(
          originalScale.x,
          originalScale.y,
          originalScale.z
      );

      const materials: THREE.Material[] = [];
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            materials.push(...child.material);
          } else {
            materials.push(child.material);
          }
        }
      });

      materials.forEach((m) => {
        m.transparent = true;
        m.opacity = 0;
        m.needsUpdate = true;
      });

      gsap.to(materials, {
        opacity: 1,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    });

    this.setInitialCameraPosition(true);

      this.orbitControls.enabled = false;

    gsap.delayedCall(2, () => {
      EventBus.emit('GRID_ITEMS:SHOW');
    });
  }



  private setupOrbitControls(): void {
    this.orbitControls = new OrbitControls(this.camera, this.webglRenderer.domElement);

    const isMobile = window.innerWidth < 768;
    this.orbitControls.enabled = !isMobile;

    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.screenSpacePanning = false;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 100;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.target.set(-7, 0, 0);
    this.orbitControls.update();
  }

  private addSceneLighting(): void {
    const isMobile = window.innerWidth < 768;

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 30, 0);
    rimLight.castShadow = !isMobile;

    if (rimLight.castShadow) {
      rimLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
      rimLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
      rimLight.shadow.camera.near = 0.5;
      rimLight.shadow.camera.far = 100;
    }

    this.threeScene.add(rimLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 0.6 : 0.5);
    this.ambientLight.position.set(0, 30, 0);
    this.threeScene.add(this.ambientLight);

    this.setupLightingEventListeners();
  }

  private setupLightingEventListeners(): void {
    EventBus.on('LIGHTING:TOGGLE', () => {
      if (!this.lightingController) return;

      this.lightingController.toggleDayNight();

      const targetIntensity = this.lightingController.currentMode === 'night' ? 0.3 : 0.5;
      if (this.ambientLight) {
        gsap.to(this.ambientLight, {
          intensity: targetIntensity,
          duration: 1.5,
          ease: 'power2.inOut',
        });
      }
    });
  }

  public update(pixiRenderer: WebGLRenderer, pixiStage: Container): void {
    this.stats.begin();

    const deltaTime = this.clock.getDelta();
    this.particleSystem.update(deltaTime);

    this.updateCameraInfo();

    if (this.sceneController) {
      this.sceneController.animationMixers.forEach((mixer) => mixer.update(deltaTime));
    }

    if (this.interactionManager) {
      this.interactionManager.update();
    }

    if (this.orbitControls && this.orbitControls.enabled) {
      this.orbitControls.update();
    }

    EventBus.emit('GAME:UPDATE');

    this.webglRenderer.resetState();
    this.webglRenderer.render(this.threeScene, this.camera);

    pixiRenderer.resetState();
    pixiRenderer.render({ container: pixiStage });

    this.stats.end();
  }

  private updateCameraInfo(): void {
    if (!this.cameraInfoDisplay) return;
    this.cameraInfoDisplay.textContent = `Camera Position:\nx: ${this.camera.position.x.toFixed(
      2
    )}\ny: ${this.camera.position.y.toFixed(2)}\nz: ${this.camera.position.z.toFixed(2)}`;
    this.cameraInfoDisplay.style.display = 'none';
  }

  /**
   * Calculate responsive camera distance based on viewport size and orientation
   * Returns the distance from the look-at target
   */
  private calculateResponsiveCameraDistance(): number {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const isPortrait = height > width;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    let distance = 90;

    if (isMobile) {
      if (isPortrait) {
        distance = 150;
      } else {
        distance = 85;
      }
    } else if (isTablet) {
      if (isPortrait) {
        distance = 100;
      } else {
        distance = 85;
      }
    } else if (isDesktop) {
      if (aspectRatio < 1.5) {
        distance = 85;
      } else if (aspectRatio > 2) {
        distance = 70;
      } else {
        distance = 75;
      }
    }

    return distance;
  }

  private calculateCameraPositionAtDistance(distance: number, currentPosition?: THREE.Vector3): THREE.Vector3 {
    const camPos = currentPosition || this.camera.position;

    const direction = new THREE.Vector3()
      .subVectors(camPos, this.cameraLookAtTarget)
      .normalize();

    return new THREE.Vector3()
      .copy(this.cameraLookAtTarget)
      .addScaledVector(direction, distance);
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.adjustCameraForViewport();
  }

  public adjustCameraForViewport(animated: boolean = true): void {
    const newDistance = this.calculateResponsiveCameraDistance();
    const targetPosition = this.calculateCameraPositionAtDistance(newDistance);

    if (animated) {
      this.cameraController.moveCameraToTarget(targetPosition, 1, 0);
    } else {
      this.camera.position.copy(targetPosition);
      this.camera.lookAt(this.cameraLookAtTarget);
      this.camera.updateProjectionMatrix();
    }
  }

  public setInitialCameraPosition(animated: boolean = false): void {
    const distance = this.calculateResponsiveCameraDistance();

    const basePosition = new THREE.Vector3(CAMERA.pos.x, CAMERA.pos.y, CAMERA.pos.z);
    const targetPosition = this.calculateCameraPositionAtDistance(distance, basePosition);

    if (animated) {
      this.cameraController.moveCameraToTarget(targetPosition, 2.5, 0.5);
    } else {
      this.camera.position.copy(targetPosition);
      this.camera.lookAt(this.cameraLookAtTarget);
      this.camera.updateProjectionMatrix();
    }
  }

}
