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
    const isMobile = window.innerWidth < 968;

    this.overlay = new Graphics();
    this.overlay.fill(0x000000, 0.7);
    this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.endFill();
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.hideSelector());
    this.addChild(this.overlay);

    this.panel = new Container();
    this.panel.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const panelWidth = isMobile ? Math.min(window.innerWidth - 40, 360) : 560;
    const panelHeight = isMobile ? Math.min(window.innerHeight - 40, 300) : 480;
    const halfWidth = panelWidth / 2;
    const halfHeight = panelHeight / 2;

    const panelBg = new Graphics();
    panelBg.fill(0x2c5f2d, 1);
    panelBg.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, 15);
    panelBg.endFill();
    panelBg.stroke({ width: 4, color: 0xFFD700 });
    panelBg.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, 15);
    this.panel.addChild(panelBg);

    const titleSize = isMobile ? 24 : 32;
    const title = new Text(
      'Select Item',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: titleSize,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 4, join: 'round' }
      })
    );
    title.anchor.set(0.5);
    title.position.set(0, -halfHeight + 30);
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

    const itemsPerRow = isMobile ? 4 : 3;
    const itemSpacing = isMobile ? 85 : 130;
    const startY = isMobile ? -halfHeight + 85 : -80;
    const startX = isMobile ? -(itemSpacing * (itemsPerRow - 1)) / 2 : -125;

    this.itemOptions.forEach((option, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = startX + col * itemSpacing;
      const y = startY + row * (isMobile ? 100 : 120);

      const itemContainer = this.createItemOption(option, x, y, isMobile);
      this.panel.addChild(itemContainer);
    });

    this.addChild(this.panel);

    this.panel.scale.set(0.5);
    gsap.to(this.panel.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }

  private createItemOption(option: ItemOption, x: number, y: number, isMobile: boolean): Container {
    const container = new Container();
    container.position.set(x, y);

    const cost = this.itemService.getCost(option.type);
    const canAfford = this.itemService.balance >= cost;

    const boxSize = isMobile ? 70 : 100;
    const halfBox = boxSize / 2;
    const iconSize = isMobile ? 40 : 50;

    const bg = new Graphics();
    if (canAfford) {
      bg.fill(0x4CAF50, 0.9);
      bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
      bg.endFill();
      bg.stroke({ width: 4, color: 0xFFFFFF });
      bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
    } else {
      bg.fill(0x666666, 0.5);
      bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
      bg.endFill();
      bg.stroke({ width: 3, color: 0x333333 });
      bg.roundRect(-halfBox, -halfBox + 5, boxSize, boxSize, 10);
    }
    container.addChild(bg);

    const texture = Assets.get(option.textureKey);
    const icon = new Sprite(texture);
    icon.anchor.set(0.5);
    icon.position.set(0, -5);
    icon.width = icon.height = iconSize;
    if (!canAfford) {
      icon.alpha = 0.4;
    }
    container.addChild(icon);

    const fontSize = isMobile ? 14 : 18;
    const costText = new Text(
      `$${cost}`,
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: fontSize,
        fontWeight: 'bold',
        fill: canAfford ? '#FFD700' : '#FF0000',
        stroke: { color: '#000000', width: 2, join: 'round' }
      })
    );
    costText.anchor.set(0.5);
    costText.position.set(0, halfBox - 10);
    container.addChild(costText);

    if (canAfford) {
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerover', () => {
        gsap.to(container.scale, { x: 1.1, y: 1.1, duration: 0.2 });
      });

      container.on('pointerout', () => {
        gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 });
      });

      container.on('pointerdown', () => {
        this.selectItem(option, cost);
      });
    } else {
      container.eventMode = 'static';
      container.cursor = 'not-allowed';

      container.on('pointerdown', () => {
        this.showNotEnoughMoneyFeedback(container);
      });
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

  public resize(width: number, height: number): void {
    if (this.isCurrentlyVisible && this.currentPlacement) {
      this.removeChildren();
      this.createSelectorUI();
    } else if (this.overlay) {
      this.overlay.clear();
      this.overlay.fill(0x000000, 0.7);
      this.overlay.rect(0, 0, width, height);
      this.overlay.endFill();
    }
    if (this.panel) {
      this.panel.position.set(width / 2, height / 2);
    }
  }
}
