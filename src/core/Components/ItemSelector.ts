import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import gsap from 'gsap';
import { EventBus } from '../Controllers/EventController';
import { ItemController } from '../Controllers/ItemController';
import { playSoundEffect } from '../Utils/AudioManager';

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

  constructor() {
    super();
    this.visible = false;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.attachListener('ITEM_SELECTOR:SHOW', (placement: unknown) => {
      this.showSelector(placement as ItemPlacement);
    });
  }

  private showSelector(placement: ItemPlacement): void {
    this.currentPlacement = placement;
    this.removeChildren();
    this.createSelectorUI();
    this.visible = true;

    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.3, ease: 'power2.out' });
  }

  private createSelectorUI(): void {
    this.overlay = new Graphics();
    this.overlay.fill(0x000000, 0.7);
    this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.endFill();
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.hideSelector());
    this.addChild(this.overlay);

    this.panel = new Container();
    this.panel.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const panelBg = new Graphics();
    panelBg.fill(0x2c5f2d, 1);
    panelBg.roundRect(-280, -220, 560, 480, 15);
    panelBg.endFill();
    panelBg.stroke({ width: 4, color: 0xFFD700 });
    panelBg.roundRect(-280, -220, 560, 480, 15);
    this.panel.addChild(panelBg);

    const title = new Text(
      'Select Item',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 4, join: 'round' }
      })
    );
    title.anchor.set(0.5);
    title.position.set(0, -170);
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
    const itemSpacing = 130;
    const startY = -80;
    const startX = -125;

    this.itemOptions.forEach((option, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = startX + col * itemSpacing;
      const y = startY + row * 120;

      const itemContainer = this.createItemOption(option, x, y);
      this.panel.addChild(itemContainer);
    });

    this.addChild(this.panel);

    this.panel.scale.set(0.5);
    gsap.to(this.panel.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
      onComplete: () => {
        const itemController = ItemController.getInstance();
        const hasAffordableItem = this.itemOptions.some(option =>
          itemController.getBalance() >= itemController.getItemCost(option.type)
        );

        if (!hasAffordableItem) {
          gsap.delayedCall(0.5, () => {
            this.showNotEnoughMoneyPopup();
          });
        }
      }
    });
  }

  private showNotEnoughMoneyPopup(): void {
    const popupOverlay = new Graphics();
    popupOverlay.fill(0x000000, 0.85);
    popupOverlay.rect(0, 0, window.innerWidth, window.innerHeight);
    popupOverlay.endFill();
    this.addChild(popupOverlay);

    const popup = new Container();
    popup.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const popupBg = new Graphics();
    popupBg.fill(0xFF5555, 1);
    popupBg.roundRect(-250, -180, 500, 360, 20);
    popupBg.endFill();
    popupBg.stroke({ width: 6, color: 0xFFFFFF });
    popupBg.roundRect(-250, -180, 500, 360, 20);
    popup.addChild(popupBg);

    const sadEmoji = new Text(
      '😢',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 60
      })
    );
    sadEmoji.anchor.set(0.5);
    sadEmoji.position.set(0, -100);
    popup.addChild(sadEmoji);

    const titleText = new Text(
      'Not Enough Money!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 5, join: 'round' }
      })
    );
    titleText.anchor.set(0.5);
    titleText.position.set(0, -30);
    popup.addChild(titleText);

    const messageText = new Text(
      'Unfortunately, you don\'t have\nenough money to buy anything.\nLet\'s retry this level!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 22,
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 3, join: 'round' },
        align: 'center'
      })
    );
    messageText.anchor.set(0.5);
    messageText.position.set(0, 45);
    popup.addChild(messageText);

    const retryButton = new Container();
    retryButton.position.set(0, 130);

    const buttonBg = new Graphics();
    buttonBg.fill(0xFFD700, 1);
    buttonBg.roundRect(-100, -30, 200, 60, 10);
    buttonBg.endFill();
    retryButton.addChild(buttonBg);

    const buttonText = new Text(
      'Retry Level',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#000000'
      })
    );
    buttonText.anchor.set(0.5);
    retryButton.addChild(buttonText);

    retryButton.eventMode = 'static';
    retryButton.cursor = 'pointer';

    retryButton.on('pointerover', () => {
      gsap.to(retryButton.scale, { x: 1.1, y: 1.1, duration: 0.2 });
    });

    retryButton.on('pointerout', () => {
      gsap.to(retryButton.scale, { x: 1, y: 1, duration: 0.2 });
    });

    retryButton.on('pointerdown', () => {
      playSoundEffect('sound_click', false);
      this.hideSelector();
      EventBus.emitEvent('LEVEL:RETRY_CURRENT');
    });

    popup.addChild(retryButton);
    this.addChild(popup);

    popup.alpha = 0;
    popup.scale.set(0.5);
    gsap.to(popup, {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
    gsap.to(popup.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }

  private createItemOption(option: ItemOption, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);

    const itemController = ItemController.getInstance();
    const cost = itemController.getItemCost(option.type);
    const canAfford = itemController.getBalance() >= cost;

    const bg = new Graphics();
    if (canAfford) {
      bg.fill(0x4CAF50, 0.9);
      bg.roundRect(-50, -40, 100, 100, 10);
      bg.endFill();
      bg.stroke({ width: 4, color: 0xFFFFFF });
      bg.roundRect(-50, -40, 100, 100, 10);
    } else {
      bg.fill(0x666666, 0.5);
      bg.roundRect(-50, -40, 100, 100, 10);
      bg.endFill();
      bg.stroke({ width: 3, color: 0x333333 });
      bg.roundRect(-50, -40, 100, 100, 10);
    }
    container.addChild(bg);

    const texture = Assets.get(option.textureKey);
    const icon = new Sprite(texture);
    icon.anchor.set(0.5);
    icon.position.set(0, -10);
    icon.width = icon.height = 50;
    if (!canAfford) {
      icon.alpha = 0.4;
    }
    container.addChild(icon);

    const costText = new Text(
      `$${cost}`,
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: canAfford ? '#FFD700' : '#FF0000',
        stroke: { color: '#000000', width: 3, join: 'round' }
      })
    );
    costText.anchor.set(0.5);
    costText.position.set(0, 35);
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
    playSoundEffect('sound_click', false);

    gsap.to(container, {
      x: container.x - 10,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      ease: 'sine.inOut'
    });
  }

  private selectItem(option: ItemOption, cost: number): void {
    const itemController = ItemController.getInstance();

    if (this.currentPlacement && itemController.spendBalance(cost)) {
      playSoundEffect('sound_click', false);

      itemController.currentlySelectedItemId = option.modelId;

      EventBus.emitEvent('GRID:PLACE_AT_POSITION', {
        itemId: option.modelId,
        row: this.currentPlacement.gridPosition.row,
        col: this.currentPlacement.gridPosition.col
      });

      EventBus.emitEvent('LEVEL:GOAL_COMPLETED', this.currentPlacement.id);

      this.hideSelector();
    }
  }

  private hideSelector(): void {
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
    if (this.overlay) {
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
