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

    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;

    let cameraOffset: THREE.Vector3;
    if (isMobile) {
      if (isPortrait) {
        const portraitDistance = 18;
        cameraOffset = new THREE.Vector3(CAMERA.pos.x + 8, CAMERA.pos.y + 15, CAMERA.pos.z + portraitDistance);
      } else {
        const landscapeDistance = 1;
        cameraOffset = new THREE.Vector3(CAMERA.pos.x + 2, CAMERA.pos.y + 4, CAMERA.pos.z + landscapeDistance);
      }
    } else {
      cameraOffset = new THREE.Vector3(CAMERA.pos.x - 10, CAMERA.pos.y - 10, CAMERA.pos.z - 25);
    }

    this.cameraController.moveCameraToTarget(
        cameraOffset,
        2.5,
        0.5
    );

    if (isMobile) {
      this.orbitControls.enabled = false;
    }

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

    const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 0.6 : 0.5);
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

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public adjustCameraForOrientation(): void {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const isPortrait = window.innerHeight > window.innerWidth;

    let cameraOffset: THREE.Vector3;
    if (isPortrait) {
      const portraitDistance = 18;
      cameraOffset = new THREE.Vector3(CAMERA.pos.x + 8, CAMERA.pos.y + 15, CAMERA.pos.z + portraitDistance);
    } else {
      const landscapeDistance = 1;
      cameraOffset = new THREE.Vector3(CAMERA.pos.x + 2, CAMERA.pos.y + 4, CAMERA.pos.z + landscapeDistance);
    }

    this.cameraController.moveCameraToTarget(cameraOffset, 1, 0);
  }
}
