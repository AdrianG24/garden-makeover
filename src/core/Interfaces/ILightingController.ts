export interface ILightingController {
  readonly currentMode: 'day' | 'night';
  switchToMode(mode: 'day' | 'night'): void;
  toggleDayNight(): void;
}
