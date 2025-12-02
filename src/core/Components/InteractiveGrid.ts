import * as THREE from 'three';
import { InteractionManager } from 'three.interactive';
import gsap from 'gsap';
import { SceneController } from '../Controllers/SceneController';
import { ItemController } from '../Controllers/ItemController';
import { animateScaleTo } from '../Utils/UtilityFunctions';
import { GAME_GRID_CONFIG } from '../../config';
import { EventBus } from '../Controllers/EventController';


export interface GridConfiguration {
  rows: number;
  columns: number;
  cubeSize?: number;
  gap?: number;
  freeColor?: number | string;
  filledColor?: number | string;
  startX?: number;
  startZ?: number;
  sizePointer?: number;
  nonInteractiveMatrix?: number[][];
  baseObjects?: { row: number; col: number; id: string }[];
}

export class InteractiveGrid {
  public gridStateMatrix: number[][];
  public gridGroupContainer: THREE.Group;

  private gridCellMeshes: THREE.Mesh[][] = [];
  private gridConfiguration: GridConfiguration;
  private interactionManagerReference: InteractionManager;
  private isInteractionEnabled: boolean = true;
  private gridOffsetX: number = 0;
  private gridOffsetZ: number = 0;
  private blockedCellsMatrix: number[][] = [];
  private sceneControllerReference: SceneController;

  public isTutorialMode: boolean = true;

  constructor(
    configuration: GridConfiguration,
    interactionManager: InteractionManager,
    sceneController: SceneController
  ) {
    this.gridConfiguration = { ...configuration };
    this.interactionManagerReference = interactionManager;
    this.configureInteractionSettings();
    this.blockedCellsMatrix = configuration.nonInteractiveMatrix || [];
    this.sceneControllerReference = sceneController;

    this.gridStateMatrix = Array.from({ length: this.gridConfiguration.rows }, () =>
      Array(this.gridConfiguration.columns).fill(0)
    );

    this.gridGroupContainer = new THREE.Group();
    this.buildGridStructure();
    this.placeInitialObjects();

    this.gridGroupContainer.castShadow = true;
    this.gridGroupContainer.receiveShadow = true;

    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    EventBus.attachListener(
      'GRID:CLEAR_CELL',
      (payload: { row: number; col: number }) => {
        if (
          payload &&
          typeof payload.row === 'number' &&
          typeof payload.col === 'number'
        ) {
          this.clearCellAtPosition(payload.row, payload.col);
        }
      }
    );

    EventBus.attachListener('GRID:CLEAR_ALL', () => {
      this.clearAllCells();
    });

    EventBus.attachOnceListener('GRID:ENABLE', () => {
      gsap.delayedCall(GAME_GRID_CONFIG.CLICK_DELAY, () => {
        this.isInteractionEnabled = false;
      });

      this.updateCellVisibilityForTutorial();
    });

    EventBus.attachListener('GRID:TOGGLE', (isVisible: boolean) => {
      this.setGridCellsVisibility(isVisible);
    });

    EventBus.attachListener(
      'GRID:PLACE_AT_POSITION',
      (payload: { itemId: string; row: number; col: number }) => {
        if (payload && payload.itemId && typeof payload.row === 'number' && typeof payload.col === 'number') {
          this.placeItemAtPosition(payload.itemId, payload.row, payload.col);
        }
      }
    );
  }

  private updateCellVisibilityForTutorial(): void {
    for (let rowIndex = 0; rowIndex < this.gridConfiguration.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.gridConfiguration.columns; colIndex++) {
        const cellMesh = this.gridCellMeshes[rowIndex]?.[colIndex];
        if (!cellMesh) continue;

        const isCellBlocked =
          this.blockedCellsMatrix &&
          this.blockedCellsMatrix[rowIndex] &&
          this.blockedCellsMatrix[rowIndex][colIndex] === 1;

        if (isCellBlocked) {
          (cellMesh.material as THREE.MeshBasicMaterial).color.set(
            GAME_GRID_CONFIG.BLOCKED_COLOR
          );
        } else {
          const isCellFilled = this.gridStateMatrix[rowIndex][colIndex] === 1;
          const cellColor = isCellFilled ? 0xff0000 : 0x00ff00;
          (cellMesh.material as THREE.MeshBasicMaterial).color.set(cellColor);
        }

        (cellMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
        (cellMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    }
  }

  public setGridCellsVisibility(shouldBeVisible: boolean): void {
    for (let rowIndex = 0; rowIndex < this.gridCellMeshes.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.gridCellMeshes[rowIndex].length; colIndex++) {
        const cellMesh = this.gridCellMeshes[rowIndex][colIndex];
        if (cellMesh) {
          cellMesh.visible = shouldBeVisible;
        }
      }
    }
  }

  public clearCellAtPosition(row: number, col: number): void {
    const cellMesh = this.gridCellMeshes[row]?.[col];
    if (!cellMesh) return;

    this.gridStateMatrix[row][col] = 0;
    cellMesh.userData.selected = false;
    (cellMesh.material as THREE.MeshBasicMaterial).color.set(
      this.gridConfiguration.freeColor!
    );

    if (cellMesh.userData.placedObject) {
      this.gridGroupContainer.remove(cellMesh.userData.placedObject);
      delete cellMesh.userData.placedObject;
    }

    if (!this.blockedCellsMatrix[row]?.[col]) {
      this.interactionManagerReference.add(cellMesh);
      cellMesh.userData.selected = false;
    }

    this.refreshGridDisplay();
  }

  private clearAllCells(): void {
    for (let rowIndex = 0; rowIndex < this.gridConfiguration.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.gridConfiguration.columns; colIndex++) {
        const cellMesh = this.gridCellMeshes[rowIndex]?.[colIndex];
        if (cellMesh && cellMesh.userData.placedObject) {
          this.gridGroupContainer.remove(cellMesh.userData.placedObject);
          delete cellMesh.userData.placedObject;
        }
      }
    }

    const nonCellObjects: THREE.Object3D[] = [];
    this.gridGroupContainer.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) {
        nonCellObjects.push(child);
      }
    });
    nonCellObjects.forEach((obj) => this.gridGroupContainer.remove(obj));

    for (let rowIndex = 0; rowIndex < this.gridConfiguration.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.gridConfiguration.columns; colIndex++) {
        this.gridStateMatrix[rowIndex][colIndex] = 0;
        const cellMesh = this.gridCellMeshes[rowIndex]?.[colIndex];
        if (cellMesh) {
          cellMesh.userData.selected = false;
          (cellMesh.material as THREE.MeshBasicMaterial).color.set(
            this.gridConfiguration.freeColor!
          );
        }
      }
    }

    this.refreshGridDisplay();

    const itemController = ItemController.getInstance();
    itemController.currentlySelectedItemId = null;
  }

  private placeInitialObjects(): void {
    if (!this.gridConfiguration.baseObjects) return;

    const itemController = ItemController.getInstance();

    for (const objectData of this.gridConfiguration.baseObjects) {
      const { row, col, id } = objectData;
      const cellMesh = this.gridCellMeshes[row]?.[col];
      if (!cellMesh) continue;

      this.gridStateMatrix[row][col] = 1;
      cellMesh.userData.selected = true;
      (cellMesh.material as THREE.MeshBasicMaterial).color.set(
        this.gridConfiguration.filledColor!
      );

      itemController.currentlySelectedItemId = id;
      const instantiatedObject = this.sceneControllerReference.createInstanceFromClick(id);

      if (instantiatedObject) {
        instantiatedObject.position.set(
          cellMesh.position.x,
          GAME_GRID_CONFIG.GAME_OBJECT_Y,
          cellMesh.position.z
        );
        this.gridGroupContainer.add(instantiatedObject);
        cellMesh.userData.placedObject = instantiatedObject;
      }
    }
  }

  private configureInteractionSettings(): void {
    this.interactionManagerReference.closestObject = null;
    this.interactionManagerReference.raycaster.params.Points.threshold =
      GAME_GRID_CONFIG.RAYCASTER_THRESHOLD;
    this.interactionManagerReference.raycaster.params.Line.threshold =
      GAME_GRID_CONFIG.RAYCASTER_THRESHOLD;
    this.interactionManagerReference.raycaster.params.Mesh.threshold =
      GAME_GRID_CONFIG.RAYCASTER_THRESHOLD;
  }

  private calculateGridOffsets(
    cellSize: number,
    gapSize: number,
    startXPosition: number,
    startZPosition: number,
    totalRows: number,
    totalColumns: number
  ): { offsetX: number; offsetZ: number } {
    const totalGridWidth = totalColumns * cellSize + (totalColumns - 1) * gapSize;
    const totalGridDepth = totalRows * cellSize + (totalRows - 1) * gapSize;
    const calculatedOffsetX = startXPosition - totalGridWidth / 2 + cellSize / 2;
    const calculatedOffsetZ = startZPosition + totalGridDepth / 2 - cellSize / 2;

    return { offsetX: calculatedOffsetX, offsetZ: calculatedOffsetZ };
  }



  private createGridCell(
    rowIndex: number,
    colIndex: number,
    cellGeometry: THREE.BoxGeometry,
    cellSize: number,
    gapSize: number
  ): THREE.Mesh {
    const isCellBlocked =
      this.blockedCellsMatrix &&
      this.blockedCellsMatrix[rowIndex] &&
      this.blockedCellsMatrix[rowIndex][colIndex] === 1;

    const cellMaterial = new THREE.MeshBasicMaterial({
      color: this.gridConfiguration.freeColor,
      transparent: true,
      opacity: GAME_GRID_CONFIG.CUBE_OPACITY,
    });

    const cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);

    cellMesh.position.x = colIndex * (cellSize + gapSize) + this.gridOffsetX;
    cellMesh.position.y = GAME_GRID_CONFIG.CUBE_Y;
    cellMesh.position.z = -rowIndex * (cellSize + gapSize) + this.gridOffsetZ;
    cellMesh.castShadow = false;
    cellMesh.receiveShadow = true;
    cellMesh.userData.selected = false;

    if (!isCellBlocked) {
      this.interactionManagerReference.add(cellMesh);
      //@ts-expect-error - three.interactive uses custom events
      cellMesh.addEventListener('click', () =>
        this.handleCellClick(cellMesh, cellSize, gapSize)
      );
    } else {
      (cellMesh.material as THREE.MeshBasicMaterial).color.set(
        GAME_GRID_CONFIG.BLOCKED_COLOR
      );
    }

    const cellOutline = this.createCellOutline(cellGeometry);
    cellMesh.add(cellOutline);

    cellMesh.visible = false;

    return cellMesh;
  }

  private handleCellClick(
    clickedCell: THREE.Mesh,
    cellSize: number,
    gapSize: number
  ): void {
    if (this.isInteractionEnabled) return;

    this.isInteractionEnabled = true;
    gsap.delayedCall(GAME_GRID_CONFIG.CLICK_DELAY, () => {
      this.isInteractionEnabled = false;
    });

    if (this.isTutorialMode) {
      EventBus.emitEvent('HELPER:HIDE');
    }

    const cellColumn = Math.round((clickedCell.position.x - this.gridOffsetX) / (cellSize + gapSize));
    const cellRow = Math.round(-(clickedCell.position.z - this.gridOffsetZ) / (cellSize + gapSize));

    EventBus.emitEvent('GRID:CELL_CLICK', {
      row: cellRow,
      col: cellColumn,
      selected: clickedCell.userData.selected,
    });

    if (!clickedCell.userData.selected) {
      clickedCell.userData.selected = true;
      this.gridStateMatrix[cellRow][cellColumn] = 1;
      (clickedCell.material as THREE.MeshBasicMaterial).color.set(
        this.gridConfiguration.filledColor!
      );

      const itemController = ItemController.getInstance();
      if (itemController.currentlySelectedItemId) {
        const instantiatedGameObject = this.sceneControllerReference.createInstanceFromClick(
          itemController.currentlySelectedItemId
        );

        if (instantiatedGameObject) {
          animateScaleTo(instantiatedGameObject, 0.3, 1);
          instantiatedGameObject.position.set(
            clickedCell.position.x,
            GAME_GRID_CONFIG.GAME_OBJECT_Y + 20,
            clickedCell.position.z
          );
          this.gridGroupContainer.add(instantiatedGameObject);

          gsap.to(instantiatedGameObject.position, {
            y: GAME_GRID_CONFIG.GAME_OBJECT_Y,
            duration: 0.6,
            ease: 'bounce.out',
          });

          clickedCell.userData.placedObject = instantiatedGameObject;
        }
      } else {
        clickedCell.userData.selected = false;
        this.gridStateMatrix[cellRow][cellColumn] = 0;
      }
    }

    this.refreshGridDisplay();
  }

  public placeItemAtPosition(itemId: string, row: number, col: number): void {
    const cellMesh = this.gridCellMeshes[row]?.[col];
    if (!cellMesh) return;

    if (cellMesh.userData.selected || this.blockedCellsMatrix[row]?.[col] === 1) {
      return;
    }

    cellMesh.userData.selected = true;
    this.gridStateMatrix[row][col] = 1;
    (cellMesh.material as THREE.MeshBasicMaterial).color.set(
      this.gridConfiguration.filledColor!
    );

    const instantiatedGameObject = this.sceneControllerReference.createInstanceFromClick(itemId);

    if (instantiatedGameObject) {
      animateScaleTo(instantiatedGameObject, 0.3, 1);
      instantiatedGameObject.position.set(
        cellMesh.position.x,
        GAME_GRID_CONFIG.GAME_OBJECT_Y + 20,
        cellMesh.position.z
      );
      this.gridGroupContainer.add(instantiatedGameObject);

      gsap.to(instantiatedGameObject.position, {
        y: GAME_GRID_CONFIG.GAME_OBJECT_Y,
        duration: 0.6,
        ease: 'bounce.out',
      });

      cellMesh.userData.placedObject = instantiatedGameObject;
    }

    this.refreshGridDisplay();
  }

  private buildGridStructure(): void {
    const {
      rows,
      columns,
      cubeSize = 1,
      gap = 0.1,
      startX = 0,
      startZ = 0,
    } = this.gridConfiguration;

    const cellGeometry = new THREE.BoxGeometry(
      cubeSize,
      GAME_GRID_CONFIG.GEOMETRY_HEIGHT,
      cubeSize
    );

    const offsets = this.calculateGridOffsets(cubeSize, gap, startX, startZ, rows, columns);
    this.gridOffsetX = offsets.offsetX;
    this.gridOffsetZ = offsets.offsetZ;

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      this.gridCellMeshes[rowIndex] = [];
      for (let colIndex = 0; colIndex < columns; colIndex++) {
        const cellMesh = this.createGridCell(rowIndex, colIndex, cellGeometry, cubeSize, gap);
        this.gridGroupContainer.add(cellMesh);
        this.gridCellMeshes[rowIndex][colIndex] = cellMesh;
      }
    }
  }

  protected createCellOutline(geometry: THREE.BufferGeometry): THREE.LineSegments {
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: GAME_GRID_CONFIG.EDGE_LINE_COLOR,
      linewidth: GAME_GRID_CONFIG.EDGE_LINE_WIDTH,
      transparent: true,
      opacity: GAME_GRID_CONFIG.EDGE_OPACITY,
    });
    const outlineSegments = new THREE.LineSegments(edgesGeometry, lineMaterial);
    outlineSegments.name = 'outline';
    return outlineSegments;
  }

  public refreshGridDisplay(): void {
    const { rows, columns } = this.gridConfiguration;

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < columns; colIndex++) {
        const cellMesh = this.gridCellMeshes[rowIndex]?.[colIndex];
        if (!cellMesh) continue;

        const isCellBlocked =
          this.blockedCellsMatrix &&
          this.blockedCellsMatrix[rowIndex] &&
          this.blockedCellsMatrix[rowIndex][colIndex] === 1;

        if (isCellBlocked) {
          (cellMesh.material as THREE.MeshBasicMaterial).color.set(
            GAME_GRID_CONFIG.BLOCKED_COLOR
          );
        } else {
          const cellStateValue = this.gridStateMatrix[rowIndex][colIndex];
          (cellMesh.material as THREE.MeshBasicMaterial).color.set(
            cellStateValue === 1 ? 0xff0000! : 0x00ff00!
          );
        }
      }
    }
  }
}
