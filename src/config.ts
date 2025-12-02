import * as THREE from 'three';
import { SceneControllerConfiguration } from './core/Controllers/SceneController';


export const DEBUG = false;

export const SCENE = {
  backgroundColor: 0xa0a0a0,
  fog: {
    enabled: false,
    color: 0xa0a0a0,
    near: 20,
    far: 100,
  },
};


export const manifest = {
  bundles: [
    {
      name: 'game-assets',
      assets: [
        { alias: 'chicken', src: 'assets/images/chicken.png' },
        { alias: 'corn', src: 'assets/images/corn.png' },
        { alias: 'cow', src: 'assets/images/cow.png' },
        { alias: 'grape', src: 'assets/images/grape.png' },
        { alias: 'sheep', src: 'assets/images/sheep.png' },
        { alias: 'smoke', src: 'assets/images/smoke.png' },
        { alias: 'strawberry', src: 'assets/images/strawberry.png' },
        { alias: 'tomato', src: 'assets/images/tomato.png' },
      ],
    },
  ],
};

export const sceneManagerConfig: SceneControllerConfiguration = {
//   scenes: [
//     {
//       name: 'Base',
//       models: [
//         { name: 'ground', url: 'assets/models/ground.glb', position: [0, 0, 10] },
//         { name: 'objects', url: 'assets/models/objects.glb', position: [0, 5, 100] },
//         { name: 'sky', url: 'assets/models/skybox.glb', position: [0, 50, 0] },
//       ],
//     },
//   ],
// };

  scenes: [
    {
      name: 'Base',
      models: [
        { name: 'ground', url: 'assets/models/ground.glb', position: [0, 0, 10] },
        { name: 'objects', url: 'assets/models/objects.glb', position: [0, 5, 100] },
        { name: 'sky', url: 'assets/models/skybox.glb', position: [0, 50, 0] },
      ],
    },
  ],
};

export const Animations = {
  chicken: {
    id: 'chicken_1',
    idle: 'idle_chicken',
    action: 'action_chicken',
    sound: 'sound_chicken',
  },
  sheep: {
    id: 'sheep_1',
    idle: 'idle_sheep',
    action: 'action_sheep',
    sound: 'sound_sheep',
  },
  cow: {
    id: 'cow_1',
    idle: 'idle_cow',
    action: 'action_cow',
    sound: 'sound_cow',
  },
};

export const CAMERA = {
  fov: 20,
  near: 1,
  far: 2000,
  pos: {
    x: 30,
    y: 40,
    z: 80,
  },
};

export const GRID = {
  rows: 19,
  columns: 16,
  cubeSize: 2,
  gap: 0.1,
  freeColor: 0x75735e,
  filledColor: 0x9c0000,
  startX: -1,
  startZ: 3,
  sizePointer: 2,

  nonInteractiveMatrix: [
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    [0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],

};

export const GAME_GRID_CONFIG = {
  RAYCASTER_THRESHOLD: 0.1,
  GEOMETRY_HEIGHT: 0.1,
  CUBE_Y: 4.4,
  GAME_OBJECT_Y: 4.2,
  CLICK_DELAY: 0.3,
  CUBE_OPACITY: 0.01,
  BLOCKED_COLOR: 0x888888,
  EDGE_LINE_COLOR: 0x000000,
  EDGE_LINE_WIDTH: 1,
  EDGE_OPACITY: 0,
};

export const RENDERER = {
  antialias: false,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  screen: {
    width: 1920,
    height: 1080,
  },
  shadow: {
    enabled: true,
    type: THREE.PCFShadowMap,
  },
};

export const DIRECTIONAL_LIGHT_PRESETS = {
  day: {
    color: 0xfff2cc,
    intensity: 6,
    position: { x: 55, y: 55, z: 55 },
    shadow: {
      camera: {
        left: -55,
        right: 55,
        top: 55,
        bottom: -55,
        near: 0.0,
        far: 1000,
      },
      bias: -0.0004,
      normalBias: 0.005,
      mapSize: {
        x: window.innerWidth < 768 ? 2048 : 4096,
        y: window.innerWidth < 768 ? 2048 : 4096
      },
    },
  },
  night: {
    color: 0x6666ff,
    intensity: 1,
    position: { x: 10, y: 30, z: 10 },
    shadow: {
      camera: {
        left: -30,
        right: 30,
        top: 30,
        bottom: -30,
        near: 50,
        far: 100,
      },
      bias: -0.0002,
      normalBias: 0.005,
      mapSize: {
        x: window.innerWidth < 768 ? 1024 : 2048,
        y: window.innerWidth < 768 ? 1024 : 2048
      },
    },
  },
};

export const POPUP_CONFIG = {
  width: 400,
  height: 200,
  backgroundColor: 'rgba(255, 105, 180, 0.7)',
  borderColor: 0xffffcc,
  borderThickness: 4,
  textStyle: {
    fontFamily: 'Arial',
    fontSize: 35,
    fill: '#fff8dc',
    aling: 'center',
  },
  spacing: 50,
};

export type CameraAnimationConfiguration = {
  duration: number;
  delay: number;
  ease: string;
};

export const DEFAULT_CAMERA_ANIMATION_CONFIG: CameraAnimationConfiguration = {
  duration: 0.8,
  delay: 0,
  ease: 'power2.inOut',
};
