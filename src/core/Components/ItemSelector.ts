import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';

interface ItemOption {
  type: string;
  textureKey: string;
  modelId: string;
  label: string;
}

interface ItemPlacement {
  id: string;
  modelId: string;
  textureKey: string;
  gridPosition: { row: number; col: number };
  label: string;
}

export class ItemSelector extends Container {
  private overlay!: Graphics;
  private panel!: Container;
  private itemOptions: ItemOption[] = [];
  private currentPlacement: ItemPlacement | null = null;
  private isCurrentlyVisible: boolean = false;

  constructor(
      private itemService: ItemService,
      private audioService: AudioService
  ) {
    super();
    this.visible = false;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventEmitter.on('ITEM_SELECTOR:SHOW', (placement: unknown) => {
      this.showSelector(placement as ItemPlacement);
    });
  }

  private showSelector(placement: ItemPlacement): void {
    this.currentPlacement = placement;
    this.isCurrentlyVisible = true;
    this.removeChildren();
    this.createSelectorUI();
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.3, ease: 'power2.out' });
  }

  private createSelectorUI(): void {
    const isMobile = Math.min(window.innerWidth, window.innerHeight) < 900;

    this.overlay = new Graphics();
    this.overlay.fill(0x000000, 0.7);
    this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.endFill();
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.hideSelector());
    this.addChild(this.overlay);

    this.panel = new Container();
    this.panel.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const panelWidth = isMobile ? Math.min(window.innerWidth - 30, 300) : 560;
    const panelHeight = isMobile ? 260 : 280;
    const halfWidth = panelWidth / 2;
    const halfHeight = panelHeight / 2;

    const panelBg = new Graphics();
    panelBg.fill(0x2c5f2d, 1);
    panelBg.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, 14);
    panelBg.endFill();
    panelBg.stroke({ width: 4, color: 0xFFD700 });
    panelBg.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, 14);
    this.panel.addChild(panelBg);

    const title = new Text(
        'Select Item',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: isMobile ? 20 : 32,
          fontWeight: 'bold',
          fill: '#FFD700',
          stroke: { color: '#000000', width: isMobile ? 3 : 4 }
        })
    );
    title.anchor.set(0.5);
    title.position.set(0, -halfHeight + 28);
    this.panel.addChild(title);

    this.itemOptions = [
      { type: 'cow', textureKey: 'cow', modelId: 'cow_1', label: 'Cow' },
      { type: 'sheep', textureKey: 'sheep', modelId: 'sheep_1', label: 'Sheep' },
      { type: 'chicken', textureKey: 'chicken', modelId: 'chicken_1', label: 'Chicken' },
      { type: 'corn', textureKey: 'corn', modelId: 'corn_1', label: 'Corn' },
      { type: 'tomato', textureKey: 'tomato', modelId: 'tomato_1', label: 'Tomato' },
      { type: 'strawberry', textureKey: 'strawberry', modelId: 'strawberry_1', label: 'Strawberry' },
      { type: 'grape', textureKey: 'grape', modelId: 'grape_1', label: 'Grape' }
    ];

    const itemsPerRow = 3;
    const itemSpacingX = isMobile ? 85 : 130;
    const itemSpacingY = isMobile ? 70 : 110;

    const totalRows = Math.ceil(this.itemOptions.length / itemsPerRow);
    const startY = -((totalRows - 1) * itemSpacingY) / 2 + 5;
    const startX = -((itemsPerRow - 1) * itemSpacingX) / 2;

    this.itemOptions.forEach((option, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = startX + col * itemSpacingX;
      const y = startY + row * itemSpacingY;
      const itemContainer = this.createItemOption(option, x, y, isMobile);
      this.panel.addChild(itemContainer);
    });

    this.addChild(this.panel);

    this.applySafeScaleForPanel();

    const targetScale = this.panel.scale.x;
    this.panel.scale.set(targetScale * 0.5);
    gsap.to(this.panel.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }

  private createItemOption(option: ItemOption, x: number, y: number, isMobile: boolean): Container {
    const container = new Container();
    container.position.set(x, y);

    const cost = this.itemService.getCost(option.type);
    const canAfford = this.itemService.balance >= cost;

    const boxSize = isMobile ? 60 : 100;
    const halfBox = boxSize / 2;
    const iconSize = isMobile ? 34 : 50;

    const bg = new Graphics();
    bg.fill(canAfford ? 0x4CAF50 : 0x666666, canAfford ? 0.9 : 0.5);
    bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
    bg.endFill();
    bg.stroke({ width: isMobile ? 3 : 4, color: canAfford ? 0xFFFFFF : 0x333333 });
    bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
    container.addChild(bg);

    const texture = Assets.get(option.textureKey);
    const icon = new Sprite(texture);
    icon.anchor.set(0.5);
    icon.position.set(0, -8);
    icon.width = icon.height = iconSize;
    if (!canAfford) icon.alpha = 0.35;
    container.addChild(icon);

    const costText = new Text(
        `$${cost}`,
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: isMobile ? 13 : 18,
          fontWeight: 'bold',
          fill: canAfford ? '#FFD700' : '#FF4444',
          stroke: { color: '#000000', width: 2 }
        })
    );
    costText.anchor.set(0.5);
    costText.position.set(0, halfBox - 12);
    container.addChild(costText);

    if (canAfford) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerover', () => gsap.to(container.scale, { x: 1.1, y: 1.1, duration: 0.2 }));
      container.on('pointerout', () => gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 }));
      container.on('pointerdown', () => this.selectItem(option, cost));
    } else {
      container.eventMode = 'static';
      container.cursor = 'not-allowed';
      container.on('pointerdown', () => this.showNotEnoughMoneyFeedback(container));
    }

    return container;
  }

  private showNotEnoughMoneyFeedback(container: Container): void {
    this.audioService.playSound('sound_click', false);
    gsap.to(container, {
      x: container.x - 10,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      ease: 'sine.inOut'
    });
  }

  private selectItem(option: ItemOption, cost: number): void {
    if (this.currentPlacement && this.itemService.spend(cost)) {
      this.audioService.playSound('sound_click', false);
      this.itemService.currentItemId = option.modelId;
      eventEmitter.emit('HELPER:NEXT:STEP');
      eventEmitter.emit('ITEM_SELECTOR:ITEM_SELECTED', {
        itemId: option.modelId,
        placementId: this.currentPlacement.id
      });
      eventEmitter.emit('LEVEL:GOAL_COMPLETED', this.currentPlacement.id);
      this.hideSelector();
    }
  }

  private hideSelector(): void {
    this.isCurrentlyVisible = false;
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.visible = false;
      }
    });
  }

  private applySafeScaleForPanel(): void {
    if (!this.panel) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const maxWidth = screenW * 0.9;
    const maxHeight = screenH * 0.85;

    const bounds = this.panel.getLocalBounds();
    const panelW = bounds.width;
    const panelH = bounds.height;

    const scaleX = maxWidth / panelW;
    const scaleY = maxHeight / panelH;

    const finalScale = Math.min(scaleX, scaleY, 1);

    this.panel.scale.set(finalScale);
    this.panel.position.set(screenW / 2, screenH / 2);
  }

  public resize(width: number, height: number): void {
    if (this.overlay) {
      this.overlay.clear();
      this.overlay.fill(0x000000, 0.7);
      this.overlay.rect(0, 0, width, height);
      this.overlay.endFill();
    }

    if (this.isCurrentlyVisible) {
      this.applySafeScaleForPanel();
    }
  }
}
