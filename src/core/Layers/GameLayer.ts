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
import { EventBusService } from '../Services/EventBusService';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';
import { SCENE, CAMERA, RENDERER, GRID, sceneManagerConfig } from '../../config';

export class GameLayer {
  threeScene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  webglRenderer!: THREE.WebGLRenderer;
  clock: THREE.Clock;
  stats!: Stats;

  lightingController: LightingController | null = null;
  sceneController: SceneController | null = null;
  cameraController!: CameraController;
  interactiveGrid: InteractiveGrid | null = null;

  private interactionManager: InteractionManager | null = null;
  private orbitControls!: OrbitControls;
  private particleSystem: BatchedRenderer;
  private ambientLight: THREE.AmbientLight | null = null;
  private cameraLookAtTarget: THREE.Vector3 = new THREE.Vector3(-7, 0, 0);

  constructor(
    canvasElement: HTMLCanvasElement,
    private eventBus: EventBusService,
    private itemService: ItemService,
    private audioService: AudioService,
    showDebug: boolean = false
  ) {
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

    this.cameraController = new CameraController(this.camera, this.eventBus);
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
    this.sceneController = new SceneController(this.threeScene, this.webglRenderer, this.audioService);
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

    this.interactiveGrid = new InteractiveGrid(
      GRID,
      this.interactionManager,
      this.sceneController,
      this.itemService,
      this.eventBus
    );
    this.threeScene.add(this.interactiveGrid.gridGroupContainer);

    this.setupOrbitControls();
    this.threeScene.updateMatrix();
  }

  revealFarm(): void {
    if (!this.sceneController) return;

    const ground = this.sceneController.namedModelsMap.get('ground');
    const objects = this.sceneController.namedModelsMap.get('objects');

    if (ground) {
      ground.visible = true;
      ground.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });

      gsap.to({}, {
        duration: 1.5,
        onUpdate: function (this: { progress: () => number }) {
          const progress = this.progress();
          ground.traverse(child => {
            if (child instanceof THREE.Mesh && child.material.transparent) {
              child.material.opacity = progress;
            }
          });
        }
      });
    }

    if (objects) {
      objects.visible = true;
      objects.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });

      gsap.to({}, {
        duration: 1.5,
        delay: 0.3,
        onUpdate: function (this: { progress: () => number }) {
          const progress = this.progress();
          objects.traverse(child => {
            if (child instanceof THREE.Mesh && child.material.transparent) {
              child.material.opacity = progress;
            }
          });
        }
      });
    }

    this.setInitialCameraPosition(true);

      this.orbitControls.enabled = false;

    gsap.delayedCall(2, () => {
      this.eventBus.emit('GRID_ITEMS:SHOW');
    });
  }



  private setupOrbitControls(): void {
    this.orbitControls = new OrbitControls(this.camera, this.webglRenderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enablePan = false;
    this.orbitControls.enableZoom = false;
    this.orbitControls.enableRotate = false;
    this.orbitControls.target.set(
      this.cameraLookAtTarget.x,
      this.cameraLookAtTarget.y,
      this.cameraLookAtTarget.z
    );
    this.orbitControls.minPolarAngle = Math.PI / 4;
    this.orbitControls.maxPolarAngle = Math.PI / 2.5;
    this.orbitControls.minAzimuthAngle = -Math.PI / 8;
    this.orbitControls.maxAzimuthAngle = Math.PI / 8;
    this.orbitControls.update();
  }

  private getCameraPositionForCurrentScreen(): THREE.Vector3 {
    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isMobile) {
      if (isPortrait) {
        return new THREE.Vector3(
          CAMERA.pos.x,
          CAMERA.pos.y + 5,
          CAMERA.pos.z + 10
        );
      } else {
        return new THREE.Vector3(
          CAMERA.pos.x,
          CAMERA.pos.y,
          CAMERA.pos.z
        );
      }
    } else {
      return new THREE.Vector3(
        CAMERA.pos.x,
        CAMERA.pos.y - 10,
        CAMERA.pos.z - 20
      );
    }
  }

  private setInitialCameraPosition(animate: boolean = false): void {
    const targetPosition = this.getCameraPositionForCurrentScreen();

    if (animate) {
      gsap.to(this.camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    } else {
      this.camera.position.copy(targetPosition);
    }
  }

  private addSceneLighting(): void {
    if (!this.lightingController) return;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.threeScene.add(this.ambientLight);

    this.setupLightingEventListeners();
  }

  private setupLightingEventListeners(): void {
    this.eventBus.on('LIGHTING:TOGGLE', () => {
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

  update(pixiRenderer: WebGLRenderer, pixiStage: Container): void {
    this.stats.begin();

    const delta = this.clock.getDelta();

    if (this.sceneController) {
      this.sceneController.animationMixers.forEach(mixer => mixer.update(delta));
    }

    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }

    if (this.interactionManager) {
      this.interactionManager.update();
    }

    if (this.orbitControls && this.orbitControls.enabled) {
      this.orbitControls.update();
    }

    this.eventBus.emit('GAME:UPDATE');

    this.webglRenderer.resetState();
    this.webglRenderer.render(this.threeScene, this.camera);

    pixiRenderer.resetState();
    pixiRenderer.render({ container: pixiStage });

    this.stats.end();
  }

  handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    const targetPosition = this.getCameraPositionForCurrentScreen();
    this.camera.position.copy(targetPosition);

    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
