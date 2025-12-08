import * as THREE from 'three';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { AudioService } from '../Services/AudioService';
import { SceneController } from '../Controllers/SceneController';
import { worldToScreen, animateScaleTo } from '../Utils/UtilityFunctions';
import { GAME_GRID_CONFIG } from '../../config';
import { ItemData } from '../interfaces';

export class GridItemPlacement extends Container {
  private items: ItemData[] = [
    { id: 'cow_1', modelId: 'cow_1', position: { x: -13, y: 4.2, z: 0 }, level: 1 },
    { id: 'chicken_1', modelId: 'chicken_1', position: { x: 8, y: 4.2, z: 13 }, level: 1 },

    { id: 'sheep_1', modelId: 'sheep_1', position: { x: -10.5, y: 4.2, z: 4.2 }, level: 2 },
    { id: 'corn_1', modelId: 'corn_1', position: { x: -5.5,  y: 4.2, z: 10.8 }, level: 2 },
    { id: 'tomato_1', modelId: 'tomato_1', position: { x:  3.5, y: 4.2, z:  6.3 }, level: 2 },


    { id: 'strawberry_1', modelId: 'strawberry_1', position: { x: -12.2, y: 4.2, z: 12.5 }, level: 3 },
    { id: 'grape_1', modelId: 'grape_1', position: { x:   4.8, y: 4.2, z:  9.1 }, level: 3 },
    { id: 'chicken_2', modelId: 'chicken_1', position: { x:  -6.4, y: 4.2, z:  3.6 }, level: 3 },
    { id: 'sheep_2', modelId: 'sheep_1', position: { x:   7.5, y: 4.2, z:  17.4 }, level: 3 },


    { id: 'cow_2', modelId: 'cow_1', position: { x: -11.8, y: 4.2, z:  7.3 }, level: 4 },
    { id: 'tomato_2', modelId: 'tomato_1', position: { x: -4.2,  y: 4.2, z: 13.1 }, level: 4 },
    { id: 'corn_2', modelId: 'corn_1', position: { x:  4.1,  y: 4.2, z:  14.2 }, level: 4 },
    { id: 'strawberry_2', modelId: 'strawberry_1', position: { x:  2.3,  y: 4.2, z: 0.5 }, level: 4 },
    { id: 'grape_2', modelId: 'grape_1', position: { x: -7.6,  y: 4.2, z:  10.8 }, level: 4 },

  ];

  private bubbles = new Map<string, Container & { itemData: ItemData }>();
  private placedObjects = new Map<string, THREE.Object3D>();
  private isEnabled = false;
  private currentLevel = 1;
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private sceneController: SceneController | null = null;

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

  private createBubbles(): void {
    const isMobile = window.innerWidth < 968;
    const size = isMobile ? 22 : 50;
    const fontSize = isMobile ? 20 : 60;

    this.items.forEach(item => {
      const bubble = new Container() as Container & { itemData: ItemData };
      bubble.itemData = item;

      const bg = new Graphics();
      bg.fill(0x5ec96d, 0.95);
      bg.circle(0, 0, size);
      bg.lineStyle(isMobile ? 2 : 4, 0xFFFFFF, 1);
      bg.endFill();
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
      bubble.on('pointerover', () => gsap.to(bubble.scale, { x: 1.1, y: 1.1, duration: 0.15, ease: 'power2.out' }));
      bubble.on('pointerout', () => gsap.to(bubble.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }));
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
      bg.fill(0x5ec96d, 0.95);
      bg.circle(0, 0, size);
      bg.endFill();
      bg.lineStyle(isMobile ? 2 : 4, 0xFFFFFF, 1);
      bg.circle(0, 0, size);

      const text = bubble.children[1] as Text;
      text.style.fontSize = fontSize;
      text.style.stroke = { color: '#000000', width: isMobile ? 1.5 : 4, join: 'round' };
    });
  }

  public updatePositions(): void {
    if (!this.camera || !this.isEnabled) return;

    for (const [, bubble] of this.bubbles) {
      if (!bubble.visible) continue;

      const worldPos = new THREE.Vector3(
        bubble.itemData.position.x,
        GAME_GRID_CONFIG.GAME_OBJECT_Y,
        bubble.itemData.position.z
      );
      const screenPos = worldToScreen(worldPos, this.camera);

      bubble.position.set(screenPos.x, screenPos.y);
    }
  }

  private setupEvents(): void {
    eventEmitter.on('GRID_ITEMS:SHOW', () => this.showBubbles());
    eventEmitter.on('GRID_ITEMS:HIDE', () => this.hideBubbles());
    eventEmitter.on('GRID_ITEMS:CHANGE_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.showBubbles();
    });
    eventEmitter.on('GRID_ITEMS:RESET', () => this.resetAllItems());
  }

  private resetAllItems(): void {
    this.placedObjects.forEach((obj) => {
      if (this.scene) {
        this.scene.remove(obj);
      }
    });
    this.placedObjects.clear();

    this.currentLevel = 1;
    this.bubbles.forEach(bubble => {
      bubble.visible = false;
      bubble.alpha = 0;
    });

    this.showBubbles();
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

    eventEmitter.off('ITEM_SELECTOR:ITEM_SELECTED');
    eventEmitter.once('ITEM_SELECTOR:ITEM_SELECTED', (data: unknown) => {
      const { itemId, placementId } = data as { itemId: string; placementId: string };
      if (placementId === bubble.itemData.id) {
        this.placeObject(itemId, bubble);
      }
    });
  }

  private placeObject(itemId: string, bubble: Container & { itemData: ItemData }): void {
    if (!this.scene || !this.sceneController) return;

    const obj = this.sceneController.createInstanceFromClick(itemId);

    if (obj) {
      animateScaleTo(obj, 0.3, 1);
      obj.position.set(
        bubble.itemData.position.x,
          GAME_GRID_CONFIG.GAME_OBJECT_Y,
        bubble.itemData.position.z
      );
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
