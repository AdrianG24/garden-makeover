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
    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: RENDERER.antialias,
      canvas: canvasElement,
    });

    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webglRenderer.setPixelRatio(RENDERER.pixelRatio);
    this.webglRenderer.shadowMap.enabled = RENDERER.shadow.enabled;
    this.webglRenderer.shadowMap.type = RENDERER.shadow.type;
    this.webglRenderer.transmissionResolutionScale = window.devicePixelRatio;
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

      const originalY = obj.userData._introOriginal.y as number;
      const originalScale = obj.userData._introOriginal.scale as THREE.Vector3;

      obj.visible = true;
      obj.position.y = originalY - 10;
      obj.scale.set(
          originalScale.x * 0.8,
          originalScale.y * 0.8,
          originalScale.z * 0.8
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

      gsap.to(obj.position, {
        y: originalY,
        duration: 1,
        ease: 'bounce.out',
      });

      gsap.to(obj.scale, {
        x: originalScale.x,
        y: originalScale.y,
        z: originalScale.z,
        duration: 0.8,
        ease: 'back.out(1.7)',
      });

      gsap.to(materials, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
      });
    });
    this.cameraController.moveCameraToTarget(
        new THREE.Vector3(CAMERA.pos.x - 10, CAMERA.pos.y - 10, CAMERA.pos.z - 25),
        1.2,
        0
    );

    gsap.delayedCall(1.5, () => {
      EventBus.emitEvent('GRID_ITEMS:SHOW');
    });
  }



  private setupOrbitControls(): void {
    this.orbitControls = new OrbitControls(this.camera, this.webglRenderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.screenSpacePanning = false;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 100;
    this.orbitControls.target.set(-7, 0, 0);
    this.orbitControls.update();
  }

  private addSceneLighting(): void {
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 30, 0);
    this.threeScene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.position.set(0, 30, 0);
    this.threeScene.add(ambientLight);
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

    EventBus.emitEvent('GAME:UPDATE');

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

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(window.devicePixelRatio);
  }
}
