import * as THREE from 'three';
import { Assets } from 'pixi.js';
import { Container, WebGLRenderer } from 'pixi.js';

import { GameLayer } from './core/Layers/GameLayer';
import { UILayer } from './core/Layers/UILayer';
import { WelcomeScreen } from './core/Components/WelcomeScreen';
import { LevelingSystem } from './core/Components/LevelingSystem';
import { GridItemPlacement } from './core/Components/GridItemPlacement';
import { BalanceDisplay } from './core/Components/BalanceDisplay';
import { ItemSelector } from './core/Components/ItemSelector';
import { DayNightToggle } from './core/Components/DayNightToggle';
import { TutorialGuide } from './core/Components/TutorialGuide';
import { EventBus } from './core/Controllers/EventController';
import { ItemController } from './core/Controllers/ItemController';
import { loadAllAudioAssets } from './core/Utils/AudioManager';
import { manifest, DEBUG } from './config';
import gsap from 'gsap';


export async function createGameScene(): Promise<void> {
  const loaderOverlay = showLoadingOverlay();

  try {
    const canvasElement = document.createElement('canvas');
    canvasElement.style.display = 'block';
    canvasElement.style.position = 'absolute';
    canvasElement.style.inset = '0';
    document.body.appendChild(canvasElement);

    const gameLayer = new GameLayer(canvasElement, DEBUG);

    const pixiRenderer = await initializePixiRenderer(
        canvasElement,
        gameLayer.webglRenderer
    );
    const pixiStage = await initializePixiStage();

    await gameLayer.setupGameWorld();

    await loadGameAssets(pixiStage, gameLayer);

    setupAnimationLoop(gameLayer, pixiRenderer, pixiStage);
    setupWindowResize(gameLayer, pixiRenderer);
  } finally {
    hideLoadingOverlay(loaderOverlay);
  }
}

async function initializePixiStage(): Promise<Container> {
  const stageContainer = new Container();
  await Assets.init({ manifest });
  return stageContainer;
}

function ensureLoaderStyles(): void {
  if (document.getElementById('gm-loader-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'gm-loader-styles';
  styleEl.textContent = `
    @keyframes gm-spinner-rotate {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleEl);
}

function showLoadingOverlay(): HTMLDivElement {
  ensureLoaderStyles();

  const overlay = document.createElement('div');
  overlay.id = 'gm-loader-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: '#2c5f2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
  } as CSSStyleDeclaration);

  const spinner = document.createElement('div');
  Object.assign(spinner.style, {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '6px solid rgba(255, 255, 255, 0.2)',
    borderTopColor: '#ffffff',
    animation: 'gm-spinner-rotate 0.8s linear infinite',
  } as CSSStyleDeclaration);

  overlay.appendChild(spinner);
  document.body.appendChild(overlay);

  return overlay;
}

function hideLoadingOverlay(overlay?: HTMLDivElement | null): void {
  const el = overlay ?? document.getElementById('gm-loader-overlay');
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}


async function initializePixiRenderer(
  canvasElement: HTMLCanvasElement,
  threeRenderer: THREE.WebGLRenderer
): Promise<WebGLRenderer> {
  const pixiRenderer = new WebGLRenderer();

  await pixiRenderer.init({
    view: canvasElement,
    context: threeRenderer.domElement.getContext('webgl2'),
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: Math.min(window.devicePixelRatio, 2),
    clearBeforeRender: false,
    canvas: canvasElement,
    antialias: false,
  });

  return pixiRenderer;
}

async function loadGameAssets(stageContainer: Container, gameLayer: GameLayer): Promise<void> {
  loadAllAudioAssets();

  await Assets.loadBundle('game-assets');

  showWelcomeScreen(stageContainer, gameLayer);
}

function showWelcomeScreen(stageContainer: Container, gameLayer: GameLayer): void {
  const welcomeScreen = new WelcomeScreen(async () => {
    await startGame(stageContainer, gameLayer);
  });

  stageContainer.addChild(welcomeScreen);

  const handleResize = () => {
    welcomeScreen.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  welcomeScreen.once('destroyed', () => {
    window.removeEventListener('resize', handleResize);
  });
}


async function startGame(stageContainer: Container, gameLayer: GameLayer): Promise<void> {
  gameLayer.revealFarm();

  createUILayers(stageContainer, gameLayer);
}

function createUILayers(stageContainer: Container, gameLayer: GameLayer): void {
  const uiLayer = new UILayer();

  const tutorialGuide = new TutorialGuide();

  const levelingSystem = new LevelingSystem();

  const balanceDisplay = new BalanceDisplay();

  const itemSelector = new ItemSelector();

  const dayNightToggle = new DayNightToggle();

  const gridItemPlacement = new GridItemPlacement();
  gridItemPlacement.setCamera(gameLayer.camera);
  gridItemPlacement.setGridConfig({
    cubeSize: 2,
    gap: 0.1,
    startX: -1,
    startZ: 3,
    rows: 19,
    columns: 16
  });


  EventBus.on('LEVEL:SHOW_ANIMATION', (animationContainer: unknown) => {
    uiLayer.addToLayer(animationContainer as Container);
  });

  EventBus.on('LEVEL:HIDE_ANIMATION', () => {
  });

  uiLayer.addToLayer(levelingSystem);
  uiLayer.addToLayer(balanceDisplay);
  uiLayer.addToLayer(dayNightToggle);
  uiLayer.addToLayer(gridItemPlacement);
  uiLayer.addToLayer(itemSelector);
  uiLayer.addToLayer(tutorialGuide);

  stageContainer.addChild(uiLayer);
  uiLayer.showLayer();
  EventBus.emit('HELPER:SHOW');

  const itemController = ItemController;
  itemController.saveStartBalance();

  EventBus.on('GAME:UPDATE', () => {
    gridItemPlacement.updatePositions();
  });

  EventBus.on('UI:RESIZE', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    levelingSystem.resize(width);
    balanceDisplay.resize(width);
    dayNightToggle.resize(width);
    itemSelector.resize(width, height);
    tutorialGuide.resize();
  });
}

function setupAnimationLoop(
  gameLayer: GameLayer,
  pixiRenderer: WebGLRenderer,
  pixiStage: Container
): void {
  const animate = (): void => {
    gameLayer.update(pixiRenderer, pixiStage);
  };

  gameLayer.webglRenderer.setAnimationLoop(animate);
}

function setupWindowResize(gameLayer: GameLayer, pixiRenderer: WebGLRenderer): void {
  let resizeDelay: gsap.core.Tween | null = null;
  let orientationDelay: gsap.core.Tween | null = null;

  let lastOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

  const handleResize = (): void => {
    if (resizeDelay) {
      resizeDelay.kill();
    }

    resizeDelay = gsap.delayedCall(0.01, () => {
      gameLayer.handleResize();
      pixiRenderer.resize(window.innerWidth, window.innerHeight);
      pixiRenderer.resolution = Math.min(window.devicePixelRatio, 2);

      EventBus.emit('UI:RESIZE');

      const currentOrientation =
          window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      const orientationChanged = lastOrientation !== currentOrientation;

      if (orientationChanged && window.innerWidth < 768) {
        lastOrientation = currentOrientation;

        if (orientationDelay) {
          orientationDelay.kill();
        }

        orientationDelay = gsap.delayedCall(0.01, () => {
          gameLayer.adjustCameraForOrientation();

        });
      }
    });
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  handleResize();
}
