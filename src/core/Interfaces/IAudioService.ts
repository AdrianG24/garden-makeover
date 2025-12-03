export interface IAudioService {
  loadAllAssets(): Promise<void>;
  playSound(alias: string, loop?: boolean): void;
}
