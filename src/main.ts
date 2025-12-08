import { createGameScene } from './Game';

(async (): Promise<void> => {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl1 = !gl2 && canvas.getContext('webgl');

  if (gl2 || gl1) {
    await createGameScene();
  } else {
    return
  }
})();


