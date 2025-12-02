import * as THREE from 'three';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { EventBus } from '../Controllers/EventController';
import { playSoundEffect } from '../Utils/AudioManager';
import { worldToScreen } from '../Utils/UtilityFunctions';
import { GAME_GRID_CONFIG } from '../../config';


interface ItemPlacement {
  id: string;
  modelId: string;
  textureKey: string;
  gridPosition: { row: number; col: number };
  label: string;
}


export class GridItemPlacement extends Container {
  private allLevelPlacements: Map<number, ItemPlacement[]> = new Map();
  private itemContainers: Map<string, Container> = new Map();
  private containerLevels: Map<Container, number> = new Map();
  private containerPlacements: Map<Container, ItemPlacement> = new Map();
  private isEnabled: boolean = false;
  private currentLevel: number = 1;
  private camera: THREE.Camera | null = null;
  private gridConfig: {
    cubeSize: number;
    gap: number;
    startX: number;
    startZ: number;
    rows: number;
    columns: number;
  } | null = null;

  constructor() {
    super();
    this.initializeAllLevelPlacements();
    this.createItemIcons();
    this.setupEventListeners();
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public setGridConfig(config: {
    cubeSize: number;
    gap: number;
    startX: number;
    startZ: number;
    rows: number;
    columns: number;
  }): void {
    this.gridConfig = config;
  }

  private initializeAllLevelPlacements(): void {
    this.allLevelPlacements.set(1, [
      {
        id: 'cow_1',
        modelId: 'cow_1',
        textureKey: 'cow',
        gridPosition: { row: 3, col: 9 },
        label: 'COW'
      },
      {
        id: 'chicken_1',
        modelId: 'chicken_1',
        textureKey: 'chicken',
        gridPosition: { row: 9, col: 2 },
        label: 'CHICKEN'
      }
    ]);

    this.allLevelPlacements.set(2, [
      {
        id: 'sheep_1',
        modelId: 'sheep_1',
        textureKey: 'sheep',
        gridPosition: { row: 6, col: 2 },
        label: 'SHEEP'
      },
      {
        id: 'corn_1',
        modelId: 'corn_1',
        textureKey: 'corn',
        gridPosition: { row: 12, col: 4 },
        label: 'CORN'
      },
      {
        id: 'tomato_1',
        modelId: 'tomato_1',
        textureKey: 'tomato',
        gridPosition: { row: 4, col: 4 },
        label: 'TOMATO'
      }
    ]);

    this.allLevelPlacements.set(3, [
      {
        id: 'strawberry_1',
        modelId: 'strawberry_1',
        textureKey: 'strawberry',
        gridPosition: { row: 13, col: 2 },
        label: 'STRAWBERRY'
      },
      {
        id: 'grape_1',
        modelId: 'grape_1',
        textureKey: 'grape',
        gridPosition: { row: 5, col: 11 },
        label: 'GRAPE'
      },
      {
        id: 'chicken_2',
        modelId: 'chicken_1',
        textureKey: 'chicken',
        gridPosition: { row: 9, col: 5 },
        label: 'CHICKEN'
      },
      {
        id: 'sheep_2',
        modelId: 'sheep_1',
        textureKey: 'sheep',
        gridPosition: { row: 3, col: 12 },
        label: 'SHEEP'
      }
    ]);

    this.allLevelPlacements.set(4, [
      {
        id: 'cow_2',
        modelId: 'cow_1',
        textureKey: 'cow',
        gridPosition: { row: 2, col: 3 },
        label: 'COW'
      },
      {
        id: 'tomato_2',
        modelId: 'tomato_1',
        textureKey: 'tomato',
        gridPosition: { row: 11, col: 2 },
        label: 'TOMATO'
      },
      {
        id: 'corn_2',
        modelId: 'corn_1',
        textureKey: 'corn',
        gridPosition: { row: 6, col: 9 },
        label: 'CORN'
      },
      {
        id: 'strawberry_2',
        modelId: 'strawberry_1',
        textureKey: 'strawberry',
        gridPosition: { row: 6, col: 12 },
        label: 'STRAWBERRY'
      },
      {
        id: 'grape_2',
        modelId: 'grape_1',
        textureKey: 'grape',
        gridPosition: { row: 5, col: 6 },
        label: 'GRAPE'
      }
    ]);
  }

  private gridPositionTo3D(row: number, col: number): THREE.Vector3 {
    if (!this.gridConfig) {
      return new THREE.Vector3(0, 0, 0);
    }

    const { cubeSize, gap, startX, startZ, rows, columns } = this.gridConfig;

    const totalGridWidth = columns * cubeSize + (columns - 1) * gap;
    const totalGridDepth = rows * cubeSize + (rows - 1) * gap;
    const offsetX = startX - totalGridWidth / 2 + cubeSize / 2;
    const offsetZ = startZ + totalGridDepth / 2 - cubeSize / 2;

    const x = col * (cubeSize + gap) + offsetX;
    const y = GAME_GRID_CONFIG.GAME_OBJECT_Y;
    const z = -row * (cubeSize + gap) + offsetZ;

    return new THREE.Vector3(x, y, z);
  }

  public updatePositions(): void {
    if (!this.camera) return;

    this.containerPlacements.forEach((placement, container) => {
      if (!container.visible) return;

      const world3D = this.gridPositionTo3D(
        placement.gridPosition.row,
        placement.gridPosition.col
      );
      const screenPos = worldToScreen(world3D, this.camera!);

      const clampedX = Math.max(100, Math.min(window.innerWidth - 100, screenPos.x));
      const clampedY = Math.max(100, Math.min(window.innerHeight - 100, screenPos.y));

      container.position.set(clampedX, clampedY);
    });
  }

  private createItemIcons(): void {
    this.allLevelPlacements.forEach((placements, level) => {
      placements.forEach(placement => {
        const itemContainer = new Container();
        const isMobile = window.innerWidth < 768;
        const circleSize = isMobile ? 35 : 50;

        const background = new Graphics();
        background.fill(0x4CAF50, 0.8);
        background.circle(0, 0, circleSize);
        background.endFill();

        background.lineStyle(isMobile ? 3 : 4, 0xFFFFFF, 1);
        background.circle(0, 0, circleSize);
        itemContainer.addChild(background);

        const fontSize = isMobile ? 22 : 60;

        const questionMark = new Text(
          '?',
          new TextStyle({
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            fill: '#FFFFFF',
            stroke: { color: '#000000', width: isMobile ? 2 : 4, join: 'round' }
          })
        );
        questionMark.anchor.set(0.5);
        questionMark.position.set(0, 0);
        itemContainer.addChild(questionMark);

        itemContainer.eventMode = 'static';
        itemContainer.cursor = 'pointer';

        itemContainer.on('pointerover', () => {
          gsap.to(itemContainer.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.2,
            ease: 'power2.out'
          });
        });

        itemContainer.on('pointerout', () => {
          gsap.to(itemContainer.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: 'power2.out'
          });
        });

        itemContainer.on('pointerdown', () => {
          this.handleItemClick(placement);
        });

        this.containerLevels.set(itemContainer, level);
        this.containerPlacements.set(itemContainer, placement);

        itemContainer.visible = false;
        itemContainer.alpha = 0;

        this.addChild(itemContainer);
        this.itemContainers.set(placement.id, itemContainer);
      });
    });
  }

  private setupEventListeners(): void {
    EventBus.attachListener('GRID_ITEMS:SHOW', () => {
      this.showItems();
    });

    EventBus.attachListener('GRID_ITEMS:HIDE', () => {
      this.hideItems();
    });

    EventBus.attachListener('GRID_ITEMS:CHANGE_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.showItems();
    });

    EventBus.attachListener('GRID_ITEMS:RETRY_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.showAllItemsForCurrentLevel();
    });
  }

  private showAllItemsForCurrentLevel(): void {
    this.itemContainers.forEach((container) => {
      const containerLevel = this.containerLevels.get(container);

      if (containerLevel === this.currentLevel) {
        gsap.killTweensOf(container);
        gsap.killTweensOf(container.scale);

        container.visible = true;
        container.alpha = 0;
        container.scale.set(0, 0);

        gsap.to(container, {
          alpha: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.out'
        });

        gsap.to(container.scale, {
          x: 1,
          y: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'back.out(1.7)'
        });

        gsap.to(container.scale, {
          x: 1.05,
          y: 1.05,
          duration: 1,
          delay: 0.8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      }
    });

    if (this.camera && this.gridConfig) {
      this.updatePositions();
    }
  }

  private handleItemClick(placement: ItemPlacement): void {
    if (!this.isEnabled) return;

    playSoundEffect('sound_click', false);

    EventBus.emitEvent('ITEM_SELECTOR:SHOW', placement);

    EventBus.attachOnceListener('LEVEL:GOAL_COMPLETED', (goalId: unknown) => {
      if ((goalId as string) === placement.id) {
        const container = this.itemContainers.get(placement.id);
        if (container) {
          gsap.killTweensOf(container);
          gsap.killTweensOf(container.scale);

          gsap.to(container, {
            alpha: 0,
            duration: 0.3,
            ease: 'power2.in'
          });

          gsap.to(container.scale, {
            x: 0.5,
            y: 0.5,
            duration: 0.3,
            ease: 'back.in(1.7)',
            onComplete: () => {
              container.visible = false;
            }
          });
        }
      }
    });
  }

  private showItems(): void {
    this.isEnabled = true;

    this.itemContainers.forEach((container) => {
      const containerLevel = this.containerLevels.get(container);

      if (containerLevel === this.currentLevel) {
        gsap.killTweensOf(container);
        gsap.killTweensOf(container.scale);

        container.visible = true;
        container.alpha = 0;
        container.scale.set(0, 0);

        gsap.to(container, {
          alpha: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.out'
        });

        gsap.to(container.scale, {
          x: 1,
          y: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'back.out(1.7)'
        });

        gsap.to(container.scale, {
          x: 1.05,
          y: 1.05,
          duration: 1,
          delay: 0.8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      }
    });

    if (this.camera && this.gridConfig) {
      this.updatePositions();
    }
  }

  private hideItems(): void {
    this.isEnabled = false;

    this.itemContainers.forEach(container => {
      gsap.killTweensOf(container);
      gsap.killTweensOf(container.scale);

      gsap.to(container, {
        alpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          container.visible = false;
        }
      });
    });
  }
}
