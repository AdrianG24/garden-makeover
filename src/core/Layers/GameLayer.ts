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
  private lastResponsiveOffset: THREE.Vector3 | null = null;

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

    // Set initial camera position based on viewport
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
   * Calculate responsive camera offset based on viewport size and orientation
   * Returns the offset that should be applied relative to the base camera position
   */
  private calculateResponsiveCameraOffset(): THREE.Vector3 {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const isPortrait = height > width;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    let xOffset = 0;
    let yOffset = 0;
    let zOffset = 0;

    if (isMobile) {
      if (isPortrait) {
        // Mobile portrait: move camera further back and up
        xOffset = 10;
        yOffset = 15;  // Higher
        zOffset = 25;  // Further away
      } else {
        // Mobile landscape: closer to the scene
        xOffset = 2;
        yOffset = 4;
        zOffset = 1;
      }
    } else if (isTablet) {
      if (isPortrait) {
        // Tablet portrait: higher and further
        xOffset = 4;
        yOffset = 8;
        zOffset = 12;  // Further away
      } else {
        // Tablet landscape
        xOffset = -4;
        yOffset = 8;
        zOffset = -5;
      }
    } else if (isDesktop) {
      // Desktop - adjust based on aspect ratio
      if (aspectRatio < 1.5) {
        // Narrow desktop (more square)
        xOffset = -5;
        yOffset = -5;
        zOffset = -15;
      } else if (aspectRatio > 2) {
        // Ultra-wide desktop
        xOffset = -15;
        yOffset = -12;
        zOffset = -30;
      } else {
        // Standard desktop (16:9, 16:10)
        xOffset = -10;
        yOffset = -10;
        zOffset = -25;
      }
    }

    return new THREE.Vector3(xOffset, yOffset, zOffset);
  }

  /**
   * Calculate absolute camera position from base position and offset
   */
  private calculateAbsoluteCameraPosition(offset: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      CAMERA.pos.x + offset.x,
      CAMERA.pos.y + offset.y,
      CAMERA.pos.z + offset.z
    );
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Adjust camera distance based on viewport size
    this.adjustCameraForViewport();
  }

  /**
   * Adjust camera position for current viewport
   * Applies delta from current position, not absolute position
   * Called on resize and orientation change
   */
  public adjustCameraForViewport(animated: boolean = true): void {
    const newOffset = this.calculateResponsiveCameraOffset();

    let targetPosition: THREE.Vector3;

    if (this.lastResponsiveOffset) {
      // Calculate delta between old and new offset
      const delta = new THREE.Vector3(
        newOffset.x - this.lastResponsiveOffset.x,
        newOffset.y - this.lastResponsiveOffset.y,
        newOffset.z - this.lastResponsiveOffset.z
      );

      // Apply delta to current camera position
      targetPosition = new THREE.Vector3(
        this.camera.position.x + delta.x,
        this.camera.position.y + delta.y,
        this.camera.position.z + delta.z
      );
    } else {
      // First time - use absolute position
      targetPosition = this.calculateAbsoluteCameraPosition(newOffset);
    }

    // Store the new offset for next resize
    this.lastResponsiveOffset = newOffset.clone();

    if (animated) {
      this.cameraController.moveCameraToTarget(targetPosition, 1, 0);
    } else {
      this.camera.position.copy(targetPosition);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Reset camera to base responsive position (for initial setup)
   */
  public setInitialCameraPosition(animated: boolean = false): void {
    const offset = this.calculateResponsiveCameraOffset();
    const targetPosition = this.calculateAbsoluteCameraPosition(offset);
    this.lastResponsiveOffset = offset.clone();

    if (animated) {
      this.cameraController.moveCameraToTarget(targetPosition, 2.5, 0.5);
    } else {
      this.camera.position.copy(targetPosition);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * @deprecated Use adjustCameraForViewport instead
   */
  public adjustCameraForOrientation(): void {
    this.adjustCameraForViewport();
  }
}
