import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, GLTF>();

export async function loadGLTF(path: string): Promise<GLTF> {
  if (cache.has(path)) {
    return cache.get(path)!;
  }

  const gltf = await loader.loadAsync(path);
  cache.set(path, gltf);
  return gltf;
}
