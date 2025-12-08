import { createGameScene } from './Game';

(async (): Promise<void> => {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl1 = !gl2 && canvas.getContext('webgl');

  if (gl2 || gl1) {
    const testContext = gl2 || gl1;
    if (testContext) {
      const loseContext = testContext.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
    canvas.width = 0;
    canvas.height = 0;

    await createGameScene();
  } else {
    console.error('WebGL not supported');
    return
  }
})();


