import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { playSoundEffect } from '../Utils/AudioManager';
import gsap from 'gsap';


export class WelcomeScreen extends Container {
  private onBuyCallback: () => void;

  constructor(onBuy: () => void) {
    super();
    this.onBuyCallback = onBuy;
    this.createWelcomeInterface();
  }

  private createWelcomeInterface(): void {
    const backgroundOverlay = this.createBackgroundOverlay();
    this.addChild(backgroundOverlay);

    const welcomePanel = this.createWelcomePanel();
    this.addChild(welcomePanel);

    this.animateEntrance();
  }

  private createBackgroundOverlay(): Graphics {
    const overlay = new Graphics();
    overlay.fill(0x2c5f2d, 0.95);
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.endFill();
    return overlay;
  }

  private createWelcomePanel(): Container {
    const panel = new Container();
    const isMobile = window.innerWidth < 768;

    const panelWidth = isMobile ? Math.min(window.innerWidth - 40, 340) : 600;
    const panelHeight = isMobile ? Math.min(window.innerHeight - 80, 420) : 500;
    const halfWidth = panelWidth / 2;
    const halfHeight = panelHeight / 2;

    const panelBackground = new Graphics();
    panelBackground.fill(0x4a7c59, 1);
    panelBackground.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, isMobile ? 15 : 20);
    panelBackground.endFill();

    panelBackground.lineStyle(isMobile ? 5 : 8, 0xf4e4c1, 1);
    panelBackground.roundRect(-halfWidth, -halfHeight, panelWidth, panelHeight, isMobile ? 15 : 20);

    panel.addChild(panelBackground);

    const titleText = new Text(
      '🌾 Welcome to Garden Makeover! 🌾',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 20 : 32,
        fill: '#f4e4c1',
        fontWeight: 'bold',
        align: 'center',
        stroke: { color: '#2c5f2d', width: isMobile ? 3 : 4 },
      })
    );
    titleText.anchor.set(0.5);
    titleText.position.set(0, isMobile ? -halfHeight + 40 : -150);
    panel.addChild(titleText);

    const descriptionText = new Text(
      isMobile ? 'Start your farming adventure!\n\nBuild your dream farm,\ngrow crops, and raise animals.\n\nAre you ready?' : 'Start your farming adventure!\n\nBuild your dream farm,\ngrow crops, and raise animals.\n\nAre you ready to begin?',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 16 : 24,
        fill: '#ffffff',
        align: 'center',
        lineHeight: isMobile ? 24 : 35,
        stroke: { color: '#2c5f2d', width: 2 },
      })
    );
    descriptionText.anchor.set(0.5);
    descriptionText.position.set(0, isMobile ? 0 : -20);
    panel.addChild(descriptionText);

    const buyButton = this.createBuyButton();
    buyButton.position.set(0, isMobile ? halfHeight - 50 : 150);
    panel.addChild(buyButton);

    panel.position.set(window.innerWidth / 2, window.innerHeight / 2);

    return panel;
  }

  private createBuyButton(): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const isMobile = window.innerWidth < 768;
    const buttonWidth = isMobile ? 220 : 300;
    const buttonHeight = isMobile ? 55 : 80;
    const halfWidth = buttonWidth / 2;
    const halfHeight = buttonHeight / 2;

    const buttonBackground = new Graphics();
    buttonBackground.fill(0x86c232, 1);
    buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);
    buttonBackground.endFill();

    buttonBackground.lineStyle(isMobile ? 3 : 4, 0xf4e4c1, 1);
    buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);

    button.addChild(buttonBackground);

    const buttonText = new Text(
      '🏡 BUY YOUR FARM 🏡',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 20 : 32,
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: { color: '#2c5f2d', width: isMobile ? 2 : 3 },
      })
    );
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);

    button.on('pointerover', () => {
      gsap.to(button.scale, { x: 1.1, y: 1.1, duration: 0.2 });
      buttonBackground.clear();
      buttonBackground.fill(0x9ed63a, 1);
      buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);
      buttonBackground.endFill();
      buttonBackground.lineStyle(isMobile ? 3 : 4, 0xf4e4c1, 1);
      buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);
    });

    button.on('pointerout', () => {
      gsap.to(button.scale, { x: 1, y: 1, duration: 0.2 });
      buttonBackground.clear();
      buttonBackground.fill(0x86c232, 1);
      buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);
      buttonBackground.endFill();
      buttonBackground.lineStyle(isMobile ? 3 : 4, 0xf4e4c1, 1);
      buttonBackground.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, 15);
    });

    button.on('pointerdown', () => {
      playSoundEffect('sound_click');
      this.handleBuyClick();
    });

    return button;
  }

  private animateEntrance(): void {
    this.alpha = 0;
    gsap.to(this, {
      alpha: 1,
      duration: 0.8,
      ease: 'power2.out',
    });
  }

  private handleBuyClick(): void {
    playSoundEffect('sound_popup_chest');

    gsap.to(this, {
      alpha: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        this.onBuyCallback();
        this.destroy({ children: true });
      },
    });
  }

  public resize(width: number, height: number): void {
    const overlay = this.children[0] as Graphics;
    overlay.clear();
    overlay.fill(0x2c5f2d, 0.95);
    overlay.rect(0, 0, width, height);
    overlay.endFill();

    const panel = this.children[1] as Container;
    panel.position.set(width / 2, height / 2);
  }
}
