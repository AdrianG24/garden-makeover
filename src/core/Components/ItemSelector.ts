import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';
import { ItemOption, ItemPlacement } from '../interfaces';

export class ItemSelector extends Container {
  private overlay!: Graphics;
  private panel!: Container;
  private itemOptions: ItemOption[] = [];
  private currentPlacement: ItemPlacement | null = null;

  constructor(
      private itemService: ItemService,
      private audioService: AudioService
  ) {
    super();
    this.visible = false;
    this.setupEvents();
  }

  private setupEvents(): void {
    eventEmitter.on('ITEM_SELECTOR:SHOW', (p: unknown) => this.showSelector(p as ItemPlacement));
    eventEmitter.on('UI:RESIZE', () => {
      if (this.visible) this.resize(window.innerWidth, window.innerHeight);
    });
  }

  private showSelector(placement: ItemPlacement): void {
    this.currentPlacement = placement;
    this.removeChildren();
    this.createUI();
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.3 });
  }

  private createUI(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = Math.min(w, h) < 900;

    this.overlay = new Graphics().fill(0x000000, 0.7).rect(0, 0, w, h).endFill();
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.hideSelector());
    this.addChild(this.overlay);

    this.panel = new Container();
    this.panel.position.set(w / 2, h / 2);

    this.itemOptions = [
      { type: 'cow', textureKey: 'cow', modelId: 'cow_1', label: 'Cow' },
      { type: 'sheep', textureKey: 'sheep', modelId: 'sheep_1', label: 'Sheep' },
      { type: 'chicken', textureKey: 'chicken', modelId: 'chicken_1', label: 'Chicken' },
      { type: 'corn', textureKey: 'corn', modelId: 'corn_1', label: 'Corn' },
      { type: 'tomato', textureKey: 'tomato', modelId: 'tomato_1', label: 'Tomato' },
      { type: 'strawberry', textureKey: 'strawberry', modelId: 'strawberry_1', label: 'Strawberry' },
      { type: 'grape', textureKey: 'grape', modelId: 'grape_1', label: 'Grape' }
    ];

    const cols = 3;
    const rows = 3;
    const box = isMobile ? 90 : 130;
    const spacingX = box;
    const spacingY = box;

    const panelSize = Math.max(cols * spacingX + 80, rows * spacingY + 120);
    const half = panelSize / 2;

    const bg = new Graphics()
        .roundRect(-half, -half, panelSize, panelSize, 20)
        .fill(0x2c5f2d)
        .stroke({ width: 4, color: 0xffd700 });
    this.panel.addChild(bg);

    const title = new Text(
        'Select Item',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: isMobile ? 22 : 30,
          fontWeight: 'bold',
          fill: '#FFD700',
          stroke: { color: '#000000', width: isMobile ? 2 : 3 }
        })
    );
    title.anchor.set(0.5);
    title.position.set(0, -half + 45);
    this.panel.addChild(title);

    const startX = -(spacingX * (cols - 1)) / 2;
    const startY = -(spacingY * (rows - 1)) / 2 + 30;

    this.itemOptions.forEach((option, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      let x = startX + col * spacingX;
      let y = startY + row * spacingY;

      const isLast = index === this.itemOptions.length - 1;
      const aloneInRow = row === 2 && this.itemOptions.length % cols === 1;

      if (isLast && aloneInRow) x = 0;

      const item = this.createItem(option, x, y, isMobile);
      this.panel.addChild(item);
    });

    this.addChild(this.panel);

    const targetScale = Math.min(w * 0.8 / panelSize, h * 0.8 / panelSize, 1);
    this.panel.scale.set(targetScale * 0.5);
    gsap.to(this.panel.scale, { x: targetScale, y: targetScale, duration: 0.4, ease: 'back.out(1.7)' });
  }

  private createItem(option: ItemOption, x: number, y: number, isMobile: boolean): Container {
    const root = new Container();
    root.position.set(x, y);

    const shake = new Container();
    root.addChild(shake);

    const cost = this.itemService.getCost(option.type);
    const canAfford = this.itemService.balance >= cost;

    const box = isMobile ? 60 : 100;
    const half = box / 2;
    const iconSize = isMobile ? 34 : 50;

    const bg = new Graphics();
    bg.fill(canAfford ? 0x4CAF50 : 0x666666, canAfford ? 0.9 : 0.5);
    bg.roundRect(-half, -half + 5, box, box, 10);
    bg.endFill();
    bg.stroke({ width: isMobile ? 3 : 4, color: canAfford ? 0xFFFFFF : 0x333333 });
    bg.roundRect(-half, -half + 5, box, box, 10);
    shake.addChild(bg);


    const tex = Assets.get(option.textureKey);
    const icon = new Sprite(tex);
    icon.anchor.set(0.5);
    icon.position.set(0, -8);
    icon.width = icon.height = iconSize;
    if (!canAfford) icon.alpha = 0.35;
    shake.addChild(icon);

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
    costText.position.set(0, half - 12);
    shake.addChild(costText);

    if (canAfford) {
      root.eventMode = 'static';
      root.cursor = 'pointer';
      root.on('pointerover', () => gsap.to(shake.scale, { x: 1.1, y: 1.1, duration: 0.15 }));
      root.on('pointerout', () => gsap.to(shake.scale, { x: 1, y: 1, duration: 0.15 }));
      root.on('pointerdown', () => this.selectItem(option, cost));
    } else {
      root.eventMode = 'static';
      root.cursor = 'not-allowed';
      root.on('pointerdown', () => this.noMoney(shake));
    }

    return root;
  }

  private noMoney(shake: Container): void {
    this.audioService.playSound('sound_click', false);
    gsap.killTweensOf(shake);
    shake.x = 0;

    gsap.fromTo(
        shake,
        { x: -10 },
        {
          x: 10,
          duration: 0.08,
          repeat: 3,
          yoyo: true,
          ease: 'sine.inOut',
          onComplete: () => {shake.x = 0}
        }
    );
  }

  private selectItem(option: ItemOption, cost: number): void {
    if (this.currentPlacement && this.itemService.spend(cost)) {
      this.audioService.playSound('sound_click', false);
      this.itemService.currentItemId = option.modelId;
      eventEmitter.emit('ITEM_SELECTOR:ITEM_SELECTED', {
        itemId: option.modelId,
        placementId: this.currentPlacement.id
      });
      eventEmitter.emit('LEVEL:GOAL_COMPLETED', this.currentPlacement.id);
      this.hideSelector();
    }
  }

  private hideSelector(): void {
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {this.visible = false}
    });
  }

  private panelScale(): void {
    if (!this.panel) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const bounds = this.panel.getLocalBounds();
    const scale = Math.min((w * 0.8) / bounds.width, (h * 0.8) / bounds.height, 1);
    this.panel.scale.set(scale);
    this.panel.position.set(w / 2, h / 2);
  }

  public resize(width: number, height: number): void {
    if (!this.visible) return;
    this.overlay.clear().fill(0x000000, 0.7).rect(0, 0, width, height).endFill();
    this.panelScale();
  }
}
