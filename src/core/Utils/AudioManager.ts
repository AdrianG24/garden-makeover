import { sound } from '@pixi/sound';

const AUDIO_ASSET_MANIFEST = [
  { alias: 'sound_chicken', src: 'assets/sounds/chicken.mp3' },
  { alias: 'sound_click', src: 'assets/sounds/click_003.mp3' },
  { alias: 'sound_cow', src: 'assets/sounds/cow.mp3' },
  { alias: 'sound_popup_chest', src: 'assets/sounds/popup_chest.mp3' },
  { alias: 'sound_sheep', src: 'assets/sounds/sheep.mp3' },
  { alias: 'sound_theme', src: 'assets/sounds/theme.mp3' },
  { alias: 'sound_throw_spear', src: 'assets/sounds/throw_spear.mp3' },
];

export async function loadAllAudioAssets(): Promise<void> {
  const loadingPromises = AUDIO_ASSET_MANIFEST.map(({ alias, src }) => {
    return new Promise<void>((resolvePromise) => {
      sound.add(alias, {
        url: src,
        preload: true,
        loaded: () => resolvePromise(),
      });
    });
  });

  await Promise.all(loadingPromises);
}

export function playSoundEffect(soundAlias: string, shouldLoop: boolean = false): void {
  if (sound.exists(soundAlias)) {
    sound.play(soundAlias, { loop: shouldLoop });
  }
}
