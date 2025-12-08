import * as THREE from 'three';
import { Assets } from 'pixi.js';
import { Container, WebGLRenderer } from 'pixi.js';
import gsap from "gsap";

import { GameLayer } from './core/Layers/GameLayer';
import { WelcomeScreen } from './core/Components/WelcomeScreen';
import { LevelingSystem } from './core/Components/LevelingSystem';
import { GridItemPlacement } from './core/Components/GridItemPlacement';
import { BalanceDisplay } from './core/Components/BalanceDisplay';
import { ItemSelector } from './core/Components/ItemSelector';
import { DayNightToggle } from './core/Components/DayNightToggle';
import { ClickerButton } from './core/Components/ClickerButton';
import { Tutorial } from './core/Components/Tutorial';
import { eventEmitter } from './core/Services/EventBusService';
import { ItemService } from './core/Services/ItemService';
import { AudioService } from './core/Services/AudioService';
import { manifest } from './config';

export async function createGameScene(): Promise<void> {
  const loaderOverlay = showLoadingOverlay();

  try {
    const itemService = new ItemService();
    const audioService = new AudioService();

    const canvasElement = document.createElement('canvas');
    canvasElement.style.display = 'block';
    canvasElement.style.position = 'absolute';
    canvasElement.style.inset = '0';
    document.body.appendChild(canvasElement);

    const gameLayer = new GameLayer(canvasElement, audioService);

    const pixiRenderer = await initializePixiRenderer(
        canvasElement,
        gameLayer.webglRenderer
    );
    const pixiStage = await initializePixiStage();

    await gameLayer.setupGameWorld();

    await loadGameAssets(pixiStage, gameLayer, itemService, audioService);

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
  const context = threeRenderer.getContext();

  await pixiRenderer.init({
    canvas: canvasElement,
    context: context as any,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: Math.min(window.devicePixelRatio, 2),
    clearBeforeRender: false,
    antialias: false,
  });

  return pixiRenderer;
}

async function loadGameAssets(
  stageContainer: Container,
  gameLayer: GameLayer,
  itemService: ItemService,
  audioService: AudioService
): Promise<void> {
  await audioService.loadAllAssets();

  await Assets.loadBundle('game-assets');

  showWelcomeScreen(stageContainer, gameLayer, itemService, audioService);
}

function showWelcomeScreen(
  stageContainer: Container,
  gameLayer: GameLayer,
  itemService: ItemService,
  audioService: AudioService
): void {
  const welcomeScreen = new WelcomeScreen(async () => {
    await startGame(stageContainer, gameLayer, itemService, audioService);
  }, audioService);

  stageContainer.addChild(welcomeScreen);

  const handleResize = () => {
    welcomeScreen.resize();
  };
  window.addEventListener('resize', handleResize);

  welcomeScreen.once('destroyed', () => {
    window.removeEventListener('resize', handleResize);
  });
}

async function startGame(
  stageContainer: Container,
  gameLayer: GameLayer,
  itemService: ItemService,
  audioService: AudioService
): Promise<void> {
 gameLayer.revealFarm();

  createUILayers(stageContainer, gameLayer, itemService, audioService);
}

function createUILayers(
  stageContainer: Container,
  gameLayer: GameLayer,
  itemService: ItemService,
  audioService: AudioService
): void {
  const uiLayer = new Container();
  uiLayer.visible = true;
  uiLayer.alpha = 0;

  const levelingSystem = new LevelingSystem(itemService, audioService);

  const balanceDisplay = new BalanceDisplay();

  const itemSelector = new ItemSelector(itemService, audioService);

  const dayNightToggle = new DayNightToggle();

  const clickerButton = new ClickerButton(itemService, audioService);

  const gridItemPlacement = new GridItemPlacement(audioService);
  gridItemPlacement.setCamera(gameLayer.camera);
  gridItemPlacement.setScene(gameLayer.threeScene);
  if (gameLayer.sceneController) {
    gridItemPlacement.setSceneController(gameLayer.sceneController);
  }

  eventEmitter.on('LEVEL:SHOW_ANIMATION', (animationContainer: unknown) => {
    uiLayer.addChild(animationContainer as Container);
  });

  eventEmitter.on('LEVEL:HIDE_ANIMATION', () => {
  });

  uiLayer.addChild(levelingSystem);
  uiLayer.addChild(balanceDisplay);
  uiLayer.addChild(dayNightToggle);
  uiLayer.addChild(clickerButton);
  uiLayer.addChild(gridItemPlacement);
  uiLayer.addChild(itemSelector);

  stageContainer.addChild(uiLayer);

  gsap.to(uiLayer, {
    alpha: 1,
    duration: 0.4,
    delay: 1,
    ease: 'power2.out',
    onComplete: () => {
      showTutorial(stageContainer);
    }
  });

  itemService.saveStartBalance();

  eventEmitter.on('GAME:UPDATE', () => {
    gridItemPlacement.updatePositions();
  });

  eventEmitter.on('UI:RESIZE', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    levelingSystem.resize(width);
    balanceDisplay.resize(width);
    dayNightToggle.resize(width);
    clickerButton.resize(width, height);
    gridItemPlacement.resizeIcons();
    itemSelector.resize(width, height);
  });
}

function showTutorial(stageContainer: Container): void {

  const tutorial = new Tutorial(() => {
    eventEmitter.emit('HELPER:SHOW');
  });
  stageContainer.addChild(tutorial);

  const handleResize = () => {
    if (tutorial.destroyed) {
      window.removeEventListener('resize', handleResize);
      return;
    }
    tutorial.resize();
  };
  window.addEventListener('resize', handleResize);

  tutorial.once('destroyed', () => {
    window.removeEventListener('resize', handleResize);
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
  pixiRenderer: WebGLRenderer
): void {
  const handleResize = (): void => {


      gameLayer.handleResize();
      pixiRenderer.resize(window.innerWidth, window.innerHeight);
      pixiRenderer.resolution = Math.min(window.devicePixelRatio, 2);

      eventEmitter.emit('UI:RESIZE');
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  handleResize();
}
