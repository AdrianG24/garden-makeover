# Garden Project

## Overview

Garden is a 3D project built using [Three.js](https://threejs.org/) and integrates [PixiJS 8](https://pixijs.com/). It features custom scene configurations, dynamic asset loading, and interactive UI elements. The project is configured through TypeScript files that define environment settings, model details, light presets, and camera animations.

## Features

- **3D Scene Management:** Load and manage multiple 3D scenes with dedicated configurations.
- **Dynamic Lighting:** Pre-configured lighting presets for day, night, morning, and dusk modes.
- **Asset Manifest:** Organized handling of models, textures, and images.
- **UI Components:** Customizable UI elements for game interactions.
- **Camera Animations:** Smooth transitions using configurable animation parameters.

## Project Structure

```
/garden
│
├── /src
│   ├── /config.ts          # Main configuration file for scenes and assets
│
├── README.MD               # Project documentation (this file)
```

## Configuration Highlights

- **Scene Settings:** Background color, fog effect, and basic scene setup are defined under `SCENE` in the config.
- **Models:** Paths to 3D models (e.g., ground and skybox) are configured in the `MODELS` section.
- **Lighting:** Presets for various times of day (day, night, morning, dusk) determine lighting color, intensity, and shadow settings.
- **Asset Manifest:** The `manifest` object organizes the asset bundles and their respective file paths.
- **UI Styling:** Custom styles and configurations for list items, text elements, popups, and other UI components.
- **Camera Animations:** Default configurations to control camera transitions in the scene.

## Getting Started

1. **Install Dependencies:**

    Ensure you have [Node.js](https://nodejs.org/) installed. Then run:

    ```bash
    npm install
    ```

2. **Run the Project:**

    Start the development server with:

    ```bash
    npm start
    ```

3. **Build for Production:**

    Compile the project for production with:

    ```bash
    npm run build
    ```

## License

This project is licensed under the MIT License.

## Contact

Happy coding!
