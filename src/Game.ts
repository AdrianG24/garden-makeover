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
import { ServiceContainer } from './core/Services/ServiceContainer';
import { EventBusService } from './core/Services/EventBusService';
import { ItemService } from './core/Services/ItemService';
import { AudioService } from './core/Services/AudioService';
import { manifest, DEBUG } from './config';
import gsap from 'gsap';

export async function createGameScene(): Promise<void> {
  const loaderOverlay = showLoadingOverlay();

  try {
    const serviceContainer = initializeServices();

    const canvasElement = document.createElement('canvas');
    canvasElement.style.display = 'block';
    canvasElement.style.position = 'absolute';
    canvasElement.style.inset = '0';
    document.body.appendChild(canvasElement);

    const gameLayer = new GameLayer(canvasElement, serviceContainer, DEBUG);

    const pixiRenderer = await initializePixiRenderer(
        canvasElement,
        gameLayer.webglRenderer
    );
    const pixiStage = await initializePixiStage();

    await gameLayer.setupGameWorld();

    await loadGameAssets(pixiStage, gameLayer, serviceContainer);

    setupAnimationLoop(gameLayer, pixiRenderer, pixiStage);
    setupWindowResize(gameLayer, pixiRenderer, serviceContainer);
  } finally {
    hideLoadingOverlay(loaderOverlay);
  }
}

function initializeServices(): ServiceContainer {
  const container = new ServiceContainer();

  const eventBus = new EventBusService();
  const itemService = new ItemService(eventBus);
  const audioService = new AudioService();

  container.register('EventBus', eventBus);
  container.register('ItemService', itemService);
  container.register('AudioService', audioService);

  return container;
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

async function loadGameAssets(
  stageContainer: Container,
  gameLayer: GameLayer,
  serviceContainer: ServiceContainer
): Promise<void> {
  const audioService = serviceContainer.getAudioService();
  await audioService.loadAllAssets();

  await Assets.loadBundle('game-assets');

  showWelcomeScreen(stageContainer, gameLayer, serviceContainer);
}

function showWelcomeScreen(
  stageContainer: Container,
  gameLayer: GameLayer,
  serviceContainer: ServiceContainer
): void {
  const audioService = serviceContainer.getAudioService();
  const welcomeScreen = new WelcomeScreen(async () => {
    await startGame(stageContainer, gameLayer, serviceContainer);
  }, audioService);

  stageContainer.addChild(welcomeScreen);

  const handleResize = () => {
    welcomeScreen.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  welcomeScreen.once('destroyed', () => {
    window.removeEventListener('resize', handleResize);
  });
}

async function startGame(
  stageContainer: Container,
  gameLayer: GameLayer,
  serviceContainer: ServiceContainer
): Promise<void> {
  gameLayer.revealFarm();

  createUILayers(stageContainer, gameLayer, serviceContainer);
}

function createUILayers(
  stageContainer: Container,
  gameLayer: GameLayer,
  serviceContainer: ServiceContainer
): void {
  const eventBus = serviceContainer.getEventBus();
  const itemService = serviceContainer.getItemService();
  const audioService = serviceContainer.getAudioService();

  const uiLayer = new UILayer();

  const tutorialGuide = new TutorialGuide(eventBus);

  const levelingSystem = new LevelingSystem(eventBus, itemService, audioService);

  const balanceDisplay = new BalanceDisplay(eventBus);

  const itemSelector = new ItemSelector(eventBus, itemService, audioService);

  const dayNightToggle = new DayNightToggle(eventBus);

  const gridItemPlacement = new GridItemPlacement(eventBus, audioService);
  gridItemPlacement.setCamera(gameLayer.camera);
  gridItemPlacement.setGridConfig({
    cubeSize: 2,
    gap: 0.1,
    startX: -1,
    startZ: 3,
    rows: 19,
    columns: 16
  });

  eventBus.on('LEVEL:SHOW_ANIMATION', (animationContainer: unknown) => {
    uiLayer.addToLayer(animationContainer as Container);
  });

  eventBus.on('LEVEL:HIDE_ANIMATION', () => {
  });

  uiLayer.addToLayer(levelingSystem);
  uiLayer.addToLayer(balanceDisplay);
  uiLayer.addToLayer(dayNightToggle);
  uiLayer.addToLayer(gridItemPlacement);
  uiLayer.addToLayer(itemSelector);
  uiLayer.addToLayer(tutorialGuide);

  stageContainer.addChild(uiLayer);
  uiLayer.showLayer();
  eventBus.emit('HELPER:SHOW');

  itemService.saveStartBalance();

  eventBus.on('GAME:UPDATE', () => {
    gridItemPlacement.updatePositions();
  });

  eventBus.on('UI:RESIZE', () => {
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

function setupWindowResize(
  gameLayer: GameLayer,
  pixiRenderer: WebGLRenderer,
  serviceContainer: ServiceContainer
): void {
  let resizeDelay: gsap.core.Tween | null = null;
  const eventBus = serviceContainer.getEventBus();

  const handleResize = (): void => {
    if (resizeDelay) {
      resizeDelay.kill();
    }

    resizeDelay = gsap.delayedCall(0.01, () => {
      gameLayer.handleResize();
      pixiRenderer.resize(window.innerWidth, window.innerHeight);
      pixiRenderer.resolution = Math.min(window.devicePixelRatio, 2);

      eventBus.emit('UI:RESIZE');
    });
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  handleResize();
}
