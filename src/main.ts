import WebGL from 'three/addons/capabilities/WebGL.js';
import { createGameScene } from './Game';

(async (): Promise<void> => {
  if (WebGL.isWebGL2Available() || WebGL.isWebGLAvailable()) {
    await createGameScene();
  } else {
    const warningMessage = WebGL.getWebGLErrorMessage();
    const containerElement = document.getElementById('container');

    if (containerElement) {
      containerElement.appendChild(warningMessage);
    } else {
      document.body.appendChild(warningMessage);
    }
  }
})();
