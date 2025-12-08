import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';
import { LevelUpAnimation } from './LevelUpAnimation';
import { CongratsPopup } from './CongratsPopup';

export interface LevelGoal {
  id: string;
  description: string;
  completed: boolean;
}

export interface LevelConfig {
  level: number;
  goals: LevelGoal[];
}

export class LevelingSystem extends Container {
  private currentLevel = 0;
  private levelText!: Text;
  private progressBar!: Graphics;
  private progressBackground!: Graphics;
  private progressText!: Text;
  private levelUpAnimation: Container | null = null;
  private levels: LevelConfig[] = [];
  private currentGoals: LevelGoal[] = [];
  private congratsPopup?: CongratsPopup;
  private panel!: Graphics;
  private isMobile = window.innerWidth < 968;
  private padding = 20;
  private barWidth = 200;
  private barHeight = 20;

  constructor(
    private itemService: ItemService,
    private audioService: AudioService
  ) {
    super();
    this.initializeLevels();
    this.createUI();
    this.setupEvents();
    this.updateDisplay();
  }

  private initializeLevels(): void {
    this.levels = [
      {
        level: 1,
        goals: [
          { id: 'cow_1', description: 'Place a cow', completed: false },
          { id: 'chicken_1', description: 'Place a chicken', completed: false }
        ]
      },
      {
        level: 2,
        goals: [
          { id: 'sheep_1', description: 'Place a sheep', completed: false },
          { id: 'corn_1', description: 'Place corn', completed: false },
          { id: 'tomato_1', description: 'Place a tomato', completed: false }
        ]
      },
      {
        level: 3,
        goals: [
          { id: 'strawberry_1', description: 'Place strawberries', completed: false },
          { id: 'grape_1', description: 'Place grapes', completed: false },
          { id: 'chicken_2', description: 'Place another chicken', completed: false },
          { id: 'sheep_2', description: 'Place another sheep', completed: false }
        ]
      },
      {
        level: 4,
        goals: [
          { id: 'cow_2', description: 'Place another cow', completed: false },
          { id: 'tomato_2', description: 'Place more tomatoes', completed: false },
          { id: 'corn_2', description: 'Place more corn', completed: false },
          { id: 'strawberry_2', description: 'Place more strawberries', completed: false },
          { id: 'grape_2', description: 'Place more grapes', completed: false }
        ]
      }
    ];

    this.currentGoals = [...this.levels[0].goals];
  }

  private createUI(): void {
    this.updateLayoutValues(window.innerWidth);

    this.panel = new Graphics();
    this.addChild(this.panel);

    this.progressBackground = new Graphics();
    this.addChild(this.progressBackground);

    this.progressBar = new Graphics();
    this.addChild(this.progressBar);

    this.levelText = new Text('Level 1', new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 18 : 24,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: 3, join: 'round' }
    }));
    this.addChild(this.levelText);

    this.progressText = new Text('0/1', new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 12 : 14,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: 2, join: 'round' }
    }));
    this.progressText.anchor.set(0.5, 0.5);
    this.addChild(this.progressText);

    this.redrawUI();
  }

  private updateLayoutValues(width: number): void {
    this.isMobile = width < 420;
    this.padding = this.isMobile ? 6 : 12;
    this.barWidth = this.isMobile ? 110 : 150;
    this.barHeight = this.isMobile ? 12 : 15;

    this.position.set(this.isMobile ? 6 : 10, this.isMobile ? 6 : 10);
  }

  private redrawUI(): void {
    const panelWidth = this.isMobile ? 135 : 200;
    const panelHeight = this.isMobile ? 55 : 75;

    this.panel.clear();
    this.panel.fill(0x000000, 0.6);
    this.panel.roundRect(0, 0, panelWidth, panelHeight, 8);
    this.panel.endFill();

    this.levelText.style.fontSize = this.isMobile ? 14 : 18;
    this.levelText.position.set(this.padding, this.padding);

    this.progressBackground.clear();
    this.progressBackground.fill(0x333333, 0.8);
    this.progressBackground.roundRect(
        this.padding,
        this.padding + (this.isMobile ? 18 : 24),
        this.barWidth,
        this.barHeight,
        this.barHeight / 2
    );
    this.progressBackground.endFill();

    this.progressText.style.fontSize = this.isMobile ? 10 : 12;
    this.progressText.position.set(
        this.padding + this.barWidth / 2,
        this.padding + (this.isMobile ? 18 : 24) + this.barHeight / 2
    );
  }


  private setupEvents(): void {
    eventEmitter.on('LEVEL:GOAL_COMPLETED', (goalId: unknown) => {
      this.completeGoal(goalId as string);
    });
    eventEmitter.on('LEVEL:RESET', () => this.resetProgress());
  }

  private completeGoal(goalId: string): void {
    const goal = this.currentGoals.find(g => g.id === goalId);
    if (!goal || goal.completed) return;

    goal.completed = true;
    this.updateDisplay();

    if (this.currentGoals.every(g => g.completed)) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.itemService.addReward(this.currentLevel + 1);
    this.currentLevel++;
    this.audioService.playSound('sound_popup_chest', false);

    if (this.currentLevel < this.levels.length) {
      this.showLevelUpAnimation();
      gsap.delayedCall(2, () => {
        this.currentGoals = [...this.levels[this.currentLevel].goals];
        this.updateDisplay();
        this.itemService.saveStartBalance();
        eventEmitter.emit('GRID:UPDATE_LEVEL', this.currentLevel + 1);
        eventEmitter.emit('GRID_ITEMS:CHANGE_LEVEL', this.currentLevel + 1);
      });
    } else {
      gsap.delayedCall(1, () => this.showCongratsPopup());
    }
  }

  private showLevelUpAnimation(): void {
    if (this.levelUpAnimation) {
      this.removeChild(this.levelUpAnimation);
    }

    this.levelUpAnimation = LevelUpAnimation.create(this.currentLevel + 1);
    eventEmitter.emit('LEVEL:SHOW_ANIMATION', this.levelUpAnimation);

    LevelUpAnimation.animate(this.levelUpAnimation, () => {
      eventEmitter.emit('LEVEL:HIDE_ANIMATION');
      this.levelUpAnimation = null;
    });
  }

  private showCongratsPopup(): void {
    if (!this.congratsPopup) {
      this.congratsPopup = new CongratsPopup();
      this.congratsPopup.updateLayout();
    }

    eventEmitter.emit('LEVEL:SHOW_ANIMATION', this.congratsPopup);
    this.audioService.playSound('sound_popup_chest', false);
    this.congratsPopup.show();
  }

  private updateDisplay(): void {
    this.levelText.text = `Level ${this.currentLevel + 1}`;

    const totalGoals = this.currentGoals.length;
    const completedGoals = this.currentGoals.filter(g => g.completed).length;
    const progress = totalGoals > 0 ? completedGoals / totalGoals : 0;

    this.progressBar.clear();
    this.progressBar.fill(0x4CAF50, 1);
    this.progressBar.roundRect(
      this.padding,
      this.padding + (this.isMobile ? 28 : 35),
      this.barWidth * progress,
      this.barHeight,
      this.barHeight / 2
    );
    this.progressBar.endFill();

    this.progressText.text = `${completedGoals}/${totalGoals}`;

    gsap.fromTo(
      this.progressBar,
      { alpha: 0.5 },
      { alpha: 1, duration: 0.3, ease: 'power2.out' }
    );
  }

  private resetProgress(): void {
    this.currentLevel = 0;
    this.currentGoals = [...this.levels[0].goals];
    this.currentGoals.forEach(g => g.completed = false);
    this.updateDisplay();
  }

  private updateTextStyles(): void {
    this.levelText.style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 18 : 24,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: 3, join: 'round' }
    });

    this.progressText.style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 12 : 14,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: 2, join: 'round' }
    });
  }

  public resize(width: number): void {
    this.updateLayoutValues(width);
    this.updateTextStyles();
    this.redrawUI();
    this.updateDisplay();
    this.congratsPopup?.updateLayout();
  }
}
