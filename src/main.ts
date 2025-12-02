import WebGL from 'three/addons/capabilities/WebGL.js';
import { createGameScene } from './Game';

(async (): Promise<void> => {
  if (WebGL.isWebGL2Available()) {
    await createGameScene();
  } else {
    const warningMessage = WebGL.getWebGL2ErrorMessage();
    const containerElement = document.getElementById('container');

    if (containerElement) {
      containerElement.appendChild(warningMessage);
    } else {
      document.body.appendChild(warningMessage);
    }
  }
})();
