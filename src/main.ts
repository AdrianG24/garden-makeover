import { createGameScene } from './Game';

(async (): Promise<void> => {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl1 = !gl2 && canvas.getContext('webgl');

  if (gl2 || gl1) {
    await createGameScene();
  } else {
    showWebGLError();
  }
})();

function showWebGLError(): void {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2c5f2d;
    color: white;
    font-family: Arial, sans-serif;
    padding: 20px;
    text-align: center;
  `;
  errorDiv.innerHTML = `
    <div>
      <h2>WebGL Not Supported</h2>
      <p>Your browser does not support WebGL or it is disabled.</p>
      <p>Please use a modern browser or enable WebGL in your browser settings.</p>
    </div>
  `;
  document.body.appendChild(errorDiv);
}

