import { Container, Graphics, Text } from 'pixi.js';

export interface ItemOption {
  type: string;
  textureKey: string;
  modelId: string;
  label: string;
}

export interface ItemPlacement {
  id: string;
  modelId: string;
  textureKey: string;
  gridPosition: { row: number; col: number };
  label: string;
}

export interface ItemData {
  id: string;
  modelId: string;
  position: { x: number; y: number; z: number };
  level: number;
}

export interface TutorialStep {
  title: string;
  description: string;
}

export interface ButtonContainer extends Container {
  bg: Graphics;
  txt: Text;
}
