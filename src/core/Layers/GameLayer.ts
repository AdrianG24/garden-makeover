import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';
import { BatchedRenderer } from 'three.quarks';
import { Container, WebGLRenderer } from 'pixi.js';
import gsap from 'gsap';
import { LightingController } from '../Controllers/LightingController';
import { SceneController } from '../Controllers/SceneController';
import { CameraController } from '../Controllers/CameraController';
import { eventEmitter } from '../Services/EventBusService';
import { AudioService } from '../Services/AudioService';
import { SCENE, CAMERA, RENDERER, sceneManagerConfig } from '../../config';
import { SCREEN_BREAKPOINTS, ANIMATION_TIMINGS } from '../constants';

export class GameLayer {
  threeScene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  webglRenderer!: THREE.WebGLRenderer;
  clock: THREE.Clock;
  stats!: Stats;

  lightingController: LightingController | null = null;
  sceneController: SceneController | null = null;
  cameraController!: CameraController;

  private orbitControls!: OrbitControls;
  private particleSystem: BatchedRenderer;
  private ambientLight: THREE.AmbientLight | null = null;

  private cameraLookAtTarget: THREE.Vector3 = new THREE.Vector3(-7, 0, 0);
  private baseCameraDistance!: number;
  private baseCameraDirection!: THREE.Vector3;

  constructor(
    canvasElement: HTMLCanvasElement,
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
    if (showDebug) {
      this.stats = new Stats();
      this.stats.showPanel(0);
      document.body.appendChild(this.stats.dom);
    }
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
    this.camera.lookAt(this.cameraLookAtTarget);

    const dir = new THREE.Vector3().subVectors(
        this.camera.position,
        this.cameraLookAtTarget
    );

    this.baseCameraDistance = dir.length();
    this.baseCameraDirection = dir.normalize();

    this.camera.updateProjectionMatrix();

    this.cameraController = new CameraController(this.camera);
  }


  private initializeRenderer(canvasElement: HTMLCanvasElement): void {
    const isMobile = window.innerWidth < 768;

    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: RENDERER.antialias,
      canvas: canvasElement,
      powerPreference: isMobile ? 'default' : 'high-performance',
      stencil: true,
    });

    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.shadowMap.enabled = RENDERER.shadow.enabled;
    this.webglRenderer.shadowMap.type = RENDERER.shadow.type;
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

    this.setInitialCameraPosition();

      this.orbitControls.enabled = false;

    gsap.delayedCall(ANIMATION_TIMINGS.LEVEL_UP_DELAY, () => {
      eventEmitter.emit('GRID_ITEMS:SHOW');
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
    const distance = this.getCameraDistanceForCurrentScreen();

    return this.cameraLookAtTarget
        .clone()
        .add(this.baseCameraDirection.clone().multiplyScalar(distance));
  }

  private getCameraDistanceForCurrentScreen(): number {
    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.MOBILE;
    const isPortrait = window.innerHeight > window.innerWidth;

    let multiplier = 1;
    if (isMobile && isPortrait) {
      multiplier = 1.6;
    } else if (isMobile && !isPortrait) {
      multiplier = 0.8;
    }
    return this.baseCameraDistance * multiplier;
  }

  private setInitialCameraPosition(): void {
    const targetPosition = this.getCameraPositionForCurrentScreen();

    this.camera.position.copy(targetPosition);
    this.camera.lookAt(this.cameraLookAtTarget);

    if (this.orbitControls) {
      this.orbitControls.target.copy(this.cameraLookAtTarget);
      this.orbitControls.update();
    }
  }


  private addSceneLighting(): void {
    if (!this.lightingController) return;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.threeScene.add(this.ambientLight);

    this.setupLightingEventListeners();
  }

  private setupLightingEventListeners(): void {
    eventEmitter.on('LIGHTING:TOGGLE', () => {
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
    if (this.stats) this.stats.begin();

    const delta = this.clock.getDelta();

    if (this.sceneController && this.sceneController.animationMixers.length > 0) {
      this.sceneController.animationMixers.forEach(mixer => mixer.update(delta));
    }

    if (this.particleSystem) {
      this.particleSystem.update(delta);
    }

    eventEmitter.emit('GAME:UPDATE');

    this.webglRenderer.resetState();
    this.webglRenderer.render(this.threeScene, this.camera);

    pixiRenderer.resetState();
    pixiRenderer.render({ container: pixiStage });

    if (this.stats) this.stats.end();
  }

  handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    const targetPosition = this.getCameraPositionForCurrentScreen();
    gsap.to(this.camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: ANIMATION_TIMINGS.CAMERA_MOVE_DURATION,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.cameraLookAtTarget);
      },
    });

    this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

}
