import * as THREE from 'three';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { AudioService } from '../Services/AudioService';
import { SceneController } from '../Controllers/SceneController';
import { worldToScreen, animateScaleTo } from '../Utils/UtilityFunctions';
import { GAME_GRID_CONFIG } from '../../config';

interface ItemData {
  id: string;
  modelId: string;
  gridPosition: { row: number; col: number };
  level: number;
}

export class GridItemPlacement extends Container {
  private items: ItemData[] = [
    { id: 'cow_1', modelId: 'cow_1', gridPosition: { row: 3, col: 9 }, level: 1 },
    { id: 'chicken_1', modelId: 'chicken_1', gridPosition: { row: 9, col: 2 }, level: 1 },

    { id: 'sheep_1', modelId: 'sheep_1', gridPosition: { row: 6, col: 2 }, level: 2 },
    { id: 'corn_1', modelId: 'corn_1', gridPosition: { row: 12, col: 4 }, level: 2 },
    { id: 'tomato_1', modelId: 'tomato_1', gridPosition: { row: 4, col: 4 }, level: 2 },

    { id: 'strawberry_1', modelId: 'strawberry_1', gridPosition: { row: 13, col: 2 }, level: 3 },
    { id: 'grape_1', modelId: 'grape_1', gridPosition: { row: 5, col: 11 }, level: 3 },
    { id: 'chicken_2', modelId: 'chicken_1', gridPosition: { row: 9, col: 5 }, level: 3 },
    { id: 'sheep_2', modelId: 'sheep_1', gridPosition: { row: 3, col: 12 }, level: 3 },

    { id: 'cow_2', modelId: 'cow_1', gridPosition: { row: 2, col: 3 }, level: 4 },
    { id: 'tomato_2', modelId: 'tomato_1', gridPosition: { row: 11, col: 2 }, level: 4 },
    { id: 'corn_2', modelId: 'corn_1', gridPosition: { row: 6, col: 9 }, level: 4 },
    { id: 'strawberry_2', modelId: 'strawberry_1', gridPosition: { row: 6, col: 12 }, level: 4 },
    { id: 'grape_2', modelId: 'grape_1', gridPosition: { row: 5, col: 6 }, level: 4 }
  ];

  private bubbles = new Map<string, Container & { itemData: ItemData }>();
  private placedObjects = new Map<string, THREE.Object3D>();

  private isEnabled = false;
  private currentLevel = 1;
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private sceneController: SceneController | null = null;
  private gridConfig: {
    cubeSize: number;
    gap: number;
    startX: number;
    startZ: number;
    rows: number;
    columns: number;
  } | null = null;

  constructor(private audioService: AudioService) {
    super();
    this.createBubbles();
    this.setupEvents();
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public setSceneController(controller: SceneController): void {
    this.sceneController = controller;
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public setGridConfig(config: typeof this.gridConfig): void {
    this.gridConfig = config;
  }

  private createBubbles(): void {
    const isMobile = window.innerWidth < 968;
    const size = isMobile ? 22 : 50;
    const fontSize = isMobile ? 20 : 60;

    this.items.forEach(item => {
      const bubble = new Container() as Container & { itemData: ItemData };
      bubble.itemData = item;

      const bg = new Graphics();
      bg.fill(0x4CAF50, 0.8);
      bg.circle(0, 0, size);
      bg.endFill();
      bg.lineStyle(isMobile ? 2 : 4, 0xFFFFFF, 1);
      bg.circle(0, 0, size);
      bubble.addChild(bg);

      const text = new Text('?', new TextStyle({
        fontFamily: 'Arial',
        fontSize,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: isMobile ? 1.5 : 4, join: 'round' }
      }));
      text.anchor.set(0.5);
      bubble.addChild(text);

      bubble.eventMode = 'static';
      bubble.cursor = 'pointer';
      bubble.on('pointerover', () => gsap.to(bubble.scale, { x: 1.1, y: 1.1, duration: 0.2 }));
      bubble.on('pointerout', () => gsap.to(bubble.scale, { x: 1, y: 1, duration: 0.2 }));
      bubble.on('pointerdown', () => this.onBubbleClick(bubble));

      bubble.visible = false;
      bubble.alpha = 0;

      this.addChild(bubble);
      this.bubbles.set(item.id, bubble);

      eventEmitter.emit('TUTORIAL:ADD_QUESTION_MARK', bubble);
    });
  }

  public resizeIcons(): void {
    const isMobile = window.innerWidth < 968;
    const size = isMobile ? 22 : 50;
    const fontSize = isMobile ? 20 : 60;

    this.bubbles.forEach(bubble => {
      const bg = bubble.children[0] as Graphics;
      bg.clear();
      bg.fill(0x4CAF50, 0.8);
      bg.circle(0, 0, size);
      bg.endFill();
      bg.lineStyle(isMobile ? 2 : 4, 0xFFFFFF, 1);
      bg.circle(0, 0, size);

      const text = bubble.children[1] as Text;
      text.style.fontSize = fontSize;
      text.style.stroke = { color: '#000000', width: isMobile ? 1.5 : 4, join: 'round' };
    });
  }

  private gridToWorld(row: number, col: number): THREE.Vector3 {
    if (!this.gridConfig) return new THREE.Vector3(0, 0, 0);

    const { cubeSize, gap, startX, startZ, rows, columns } = this.gridConfig;
    const totalWidth = columns * cubeSize + (columns - 1) * gap;
    const totalDepth = rows * cubeSize + (rows - 1) * gap;
    const offsetX = startX - totalWidth / 2 + cubeSize / 2;
    const offsetZ = startZ + totalDepth / 2 - cubeSize / 2;

    return new THREE.Vector3(
      col * (cubeSize + gap) + offsetX,
      GAME_GRID_CONFIG.GAME_OBJECT_Y,
      -row * (cubeSize + gap) + offsetZ
    );
  }

  public updatePositions(): void {
    if (!this.camera || !this.gridConfig) return;

    const { rows, columns } = this.gridConfig;
    const isMobile = window.innerWidth < 968;
    const padding = isMobile ? 30 : 50;

    const corners = [
      this.gridToWorld(0, 0),
      this.gridToWorld(0, columns - 1),
      this.gridToWorld(rows - 1, 0),
      this.gridToWorld(rows - 1, columns - 1)
    ].map(pos => worldToScreen(pos, this.camera!));

    const minX = Math.min(...corners.map(p => p.x)) + padding;
    const maxX = Math.max(...corners.map(p => p.x)) - padding;
    const minY = Math.min(...corners.map(p => p.y)) + padding;
    const maxY = Math.max(...corners.map(p => p.y)) - padding;

    this.bubbles.forEach(bubble => {
      if (!bubble.visible) return;

      const { row, col } = bubble.itemData.gridPosition;
      const world = this.gridToWorld(row, col);
      const screen = worldToScreen(world, this.camera!);

      bubble.position.set(
        Math.max(minX, Math.min(maxX, screen.x)),
        Math.max(minY, Math.min(maxY, screen.y))
      );
    });
  }

  private setupEvents(): void {
    eventEmitter.on('GRID_ITEMS:SHOW', () => this.showBubbles());
    eventEmitter.on('GRID_ITEMS:HIDE', () => this.hideBubbles());
    eventEmitter.on('GRID_ITEMS:CHANGE_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.showBubbles();
    });
    eventEmitter.on('GRID_ITEMS:RETRY_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.clearLevelObjects();
      this.showBubbles();
    });
  }

  private clearLevelObjects(): void {
    if (!this.scene) return;

    this.items
      .filter(item => item.level === this.currentLevel)
      .forEach(item => {
        const obj = this.placedObjects.get(item.id);
        if (obj) {
          this.scene!.remove(obj);
          this.placedObjects.delete(item.id);
        }
      });
  }

  private showBubbles(): void {
    this.isEnabled = true;

    this.bubbles.forEach(bubble => {
      if (bubble.itemData.level !== this.currentLevel) return;

      gsap.killTweensOf(bubble);
      gsap.killTweensOf(bubble.scale);

      bubble.visible = true;
      bubble.alpha = 0;
      bubble.scale.set(0, 0);

      gsap.to(bubble, { alpha: 1, duration: 0.5, delay: 0.2 });
      gsap.to(bubble.scale, { x: 1, y: 1, duration: 0.5, delay: 0.2, ease: 'back.out(1.7)' });
      gsap.to(bubble.scale, {
        x: 1.05,
        y: 1.05,
        duration: 1,
        delay: 0.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });

    this.updatePositions();
  }

  private hideBubbles(): void {
    this.isEnabled = false;

    this.bubbles.forEach(bubble => {
      gsap.killTweensOf(bubble);
      gsap.killTweensOf(bubble.scale);
      gsap.to(bubble, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {bubble.visible = false}
      });
    });
  }

  private onBubbleClick(bubble: Container & { itemData: ItemData }): void {
    if (!this.isEnabled || this.placedObjects.has(bubble.itemData.id)) return;

    this.audioService.playSound('sound_click', false);

    eventEmitter.emit('ITEM_SELECTOR:SHOW', bubble.itemData);

    eventEmitter.once('ITEM_SELECTOR:ITEM_SELECTED', (data: unknown) => {
      const { itemId, placementId } = data as { itemId: string; placementId: string };
      if (placementId === bubble.itemData.id) {
        this.placeObject(itemId, bubble);
      }
    });

    eventEmitter.once('LEVEL:GOAL_COMPLETED', (goalId: unknown) => {
      if (goalId === bubble.itemData.id) {
        this.hideBubble(bubble);
      }
    });
  }

  private placeObject(itemId: string, bubble: Container & { itemData: ItemData }): void {
    if (!this.scene || !this.sceneController) return;

    const { row, col } = bubble.itemData.gridPosition;
    const world = this.gridToWorld(row, col);
    const obj = this.sceneController.createInstanceFromClick(itemId);

    if (obj) {
      animateScaleTo(obj, 0.3, 1);
      obj.position.set(world.x, GAME_GRID_CONFIG.GAME_OBJECT_Y + 20, world.z);
      this.scene.add(obj);

      gsap.to(obj.position, {
        y: GAME_GRID_CONFIG.GAME_OBJECT_Y,
        duration: 0.6,
        ease: 'bounce.out'
      });

      this.placedObjects.set(bubble.itemData.id, obj);
      this.hideBubble(bubble);
    }
  }

  private hideBubble(bubble: Container): void {
    gsap.killTweensOf(bubble);
    gsap.killTweensOf(bubble.scale);
    gsap.to(bubble, { alpha: 0, duration: 0.3 });
    gsap.to(bubble.scale, {
      x: 0.5,
      y: 0.5,
      duration: 0.3,
      ease: 'back.in(1.7)',
      onComplete: () => {bubble.visible = false}
    });
  }
}
