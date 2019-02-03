import UnitActionsMenu  from '../../gameObjects/UnitActionsMenu';
import { Game }         from '../Game';

export default class MapUI extends Phaser.GameObjects.GameObject {
  private actionsMenu: UnitActionsMenu;

  private config: any = {
    textStyle: { fontFamily: 'Kenney Pixel', fontSize: 30 },
  };

  private corners: MapUICorners = {
    topLeft: '',
    topRight: '',
    bottomRight: '',
    bottomLeft: '',
  };

  private cornersXY: MapUICornersXY = {
    topLeft: { x: 1, y: 1 },
    topRight: { x: 21, y: 1 },
    bottomRight: { x: 21, y: 21 },
    bottomLeft: { x: 1, y: 21 },
  };

  private panels: MapUIPanels = {};

  /** Manage UI overlay on in-game maps. */
  constructor(scene: Phaser.Scene) {
    super(scene, 'MapUI');

    scene.add.existing(this);
    this.init();

    this.actionsMenu = new UnitActionsMenu(scene, Game.gameMap.layers.unitActionsPanel);
  }

  // ~~~~~~~~~~~~~~~~~
  // PUBLIC FUNCTIONS
  // ~~~~~~~~~~~~~~~~~

  /**
   * Check if the user cursor overlay a panel UI
   * with a min tile distance allowed between cursor & panel.
   */
  public checkPanelPosition(tile: Phaser.Tilemaps.Tile, panelName: string) {
    const { x, y } = tile;
    const distance = 3;
    const { bounds } = this.panels[panelName];

    const isCloseBottom = Math.abs(y - bounds.bottom) <= distance;
    const isCloseLeft   = Math.abs(x - bounds.left  ) <= distance;
    const isCloseRight  = Math.abs(x - bounds.right ) <= distance;
    const isCloseTop    = Math.abs(y - bounds.top   ) <= distance;

    if (isCloseLeft && isCloseBottom) {
      this.movePanel(panelName);
      return this;
    }

    if (isCloseLeft && isCloseTop) {
      this.movePanel(panelName);
      return this;
    }

    if (isCloseRight && isCloseTop) {
      this.movePanel(panelName);
      return this;
    }

    if (isCloseRight && isCloseBottom) {
      this.movePanel(panelName);
      return this;
    }

    return this;
  }

  // ~~~~~~~~~~~~~~~~~
  // PRIVATE FUNCTIONS
  // ~~~~~~~~~~~~~~~~~

  private openUnitActions(cursor: Phaser.Tilemaps.Tile, tile: Phaser.Tilemaps.Tile) {
    this.actionsMenu.show(cursor, { tile });
  }

  private createUnitInfoPanelText() {
    const { add }           = this.scene;
    const { unitInfoPanel } = this.panels;
    const { texts }         = unitInfoPanel;
    const { left, top }     = unitInfoPanel.bounds;
    const { textStyle }     = this.config;

    let { x, y } = Game.gameMap.layers.unitInfoPanel.tileToWorldXY(left, top);

    x += 20;
    y += 10;

    texts.name  = add.text(0, 0, ' hero name ', Object.assign({}, textStyle, { fontSize: 40 }));
    texts.hp    = add.text(0, 50, 'HP ', textStyle);

    unitInfoPanel.textsContainer = add
      .container(x, y, [texts.name, texts.hp])
      .setScrollFactor(0);

    return this;
  }

  private createTileInfoPanelText() {
    const { add }           = this.scene;
    const { tileInfoPanel } = this.panels;
    const { texts }         = tileInfoPanel;
    const { left, top }     = tileInfoPanel.bounds;
    const { textStyle }     = this.config;

    let { x, y } = Game.gameMap.layers.tileInfoPanel.tileToWorldXY(left, top);

    x += 20;
    y += 10;

    texts.name = add.text(0, 0, ' - ', { ...textStyle, ...{ fontSize: 40 }});
    texts.def   = add.text(0, 50, 'DEF. ', textStyle);
    texts.avo   = add.text(0, 70, 'AVO. ', textStyle);

    tileInfoPanel.textsContainer = add
      .container(x, y, [texts.name, texts.def, texts.avo])
      .setScrollFactor(0);

    return this;
  }

  private disableEvents() {
    this.scene.events.off('cursorMoved', this.updatePanels, undefined, false);
    this.scene.events.off('openUnitActions', this.openUnitActions, this, false);

    return this;
  }

  private enableEvents() {
    this.scene.events.on('cursorMoved', this.updatePanels);
    this.scene.events.on('openUnitActions', this.openUnitActions, this);

    return this;
  }

  /** Find and set a panel top/left/right/bottom boundaries. */
  private findPanelBounds(name: string = '') {
    const bounds = this.getPanelBounds(name);

    const panel = this.panels[name];
    panel.bounds = bounds;

    return this;
  }

  private getPanelBounds(name: string) {
    const bounds = {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    };

    const layer = Game.gameMap.layers[name];

    const tileToFind = layer.findTile(
      (tile: Phaser.Tilemaps.Tile) => typeof tile === 'object',
      undefined, undefined, undefined, undefined, undefined, { isNotEmpty: true });

    if (!tileToFind) { return bounds; }

    const { x, y } = tileToFind;

    bounds.top = y;
    bounds.left = x;

    for (let coordX = x; layer.hasTileAt(coordX, y); coordX++) {
      bounds.right = coordX;
    }

    for (let coordY = y; layer.hasTileAt(x, coordY); coordY++) {
      bounds.bottom = coordY;
    }

    return bounds;
  }

  /**
   * Return the current pointed characters information.
   */
  private getUnitInfoPanelValues(tileCursor: Phaser.Tilemaps.Tile): UnitInfoPanelStats {
    const { x, y } = tileCursor;
    const layerCharacters = Game.gameMap.layers.units;

    const defaultValues: UnitInfoPanelStats = {
      hp: 0,
      name: '',
    };

    let values = Object.assign({}, defaultValues);

    const tile = layerCharacters.getTileAt(x, y);

    if (tile && tile.properties && tile.properties.tileUnit) {
      const { unit } = tile.properties.tileUnit;

      values = Object.assign({}, values, {
        hp: `HP ${ unit.hp } / ${ unit.fullHP }`,
        name: tile.properties.unitName,
      });
    }

    return values;
  }

  /** Return the panels' name to create. */
  private getPanelsNames(): string[] {
    return ['tileInfoPanel', 'unitInfoPanel'];
  }

  /** Return the next empty corner name. */
  private getNextEmptyCornerName(): string {
    let nextCorner: string = '';

    Object.keys(this.corners)
      .some((key) => {
        if (!this.corners[key]) {
          nextCorner = key;
          return true;
        }

        return false;
      });

    return nextCorner;
  }

  /** Get the next empty corner coordinates. */
  private getNextEmptyCornerXY(nextCorner: string = ''): Coord {
    return this.cornersXY[nextCorner];
  }

  /** Return the current highlighted tile information. */
  private getTileInfoPanelValues(tileCursor: Phaser.Tilemaps.Tile) {
    const { layers } = Game.gameMap;
    const { x, y } = tileCursor;

    const defaultValues = {
      name: ' - ',
      avo: 0,
      def: 0,
    };

    let values = Object.assign({}, defaultValues);

    let tile: Phaser.Tilemaps.Tile = layers.floor.getTileAt(x, y);

    if (layers.objects.hasTileAt(x, y)) {
      tile = layers.objects.getTileAt(x, y);

    } else if (layers.hiddenFloor.hasTileAt(x, y)) {
      tile = layers.hiddenFloor.getTileAt(x, y);

    } else if (layers.carpet.hasTileAt(x, y)) {
      tile = layers.carpet.getTileAt(x, y);

    }

    if (tile) {
      const { properties } = tile;
      values = Object.assign({}, values, properties);
    }

    return Object.assign(values, {
      avo: `AVO.    ${values.avo}`,
      def: `DEF.    ${values.def}`,
    });
  }

  /** Create UI panels. */
  private init() {
    this
      .getPanelsNames()
      .map((name) => {
        this
          .initProperties(name)
          .findPanelBounds(name);
      });

    this
      .createUnitInfoPanelText()
      .createTileInfoPanelText()
      .listenToEvents()
      .setAutoCorners()
      .toggleUnitInfoPanel()
      .getPanelsNames()
      .map((name) => this.movePanel(name));

    return this;
  }

  /** Create panel's properties. */
  private initProperties(panelName: string) {
    this.panels[panelName] = {
      bounds: {
        top     : 0,
        bottom  : 0,
        left    : 0,
        right   : 0,
      },
      texts     : {},
    };

    return this;
  }

  private listenToEvents() {
    const { events } = this.scene;

    events.on('subscribeMapUIEvents', this.enableEvents);
    events.on('unsubscribeMapUIEvents', this.disableEvents);

    this.enableEvents();

    return this;
  }

  /**
   * Move a panel from its current position to an empty one.
   * This happens when user cursor (almost) overlay panel UI.
   */
  private movePanel(name: string) {
    const panel = this.panels[name];
    const panelLayer = Game.gameMap.layers[name] as Phaser.Tilemaps.DynamicTilemapLayer;

    if (!panelLayer) { return this; }

    const { bounds } = panel;

    const nextCorner = this.getNextEmptyCornerName();
    const { x, y } = this.getNextEmptyCornerXY(nextCorner);

    this.updateCorner(name, nextCorner);

    // Copy panel to a new position
    panelLayer.copy(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left + 1,
      bounds.bottom - bounds.top + 1,
      x,
      y);

    // Remove old panel position
    panelLayer.forEachTile((tile) => {
      panelLayer.removeTileAt(tile.x, tile.y);
    }, undefined,
    bounds.left,
    bounds.top,
    bounds.right - bounds.left + 1,
    bounds.bottom - bounds.top + 1);

    this.findPanelBounds(name);

    const { x: textX, y: textY } = panelLayer.tileToWorldXY(x, y);

    this.updatePanelTextPosition({ x: textX, y: textY }, name);

    return this;
  }

  /** Set predefined corners according to window dimentions. */
  private setAutoCorners() {
    const { cornersXY } = this;
    const { innerHeight: height, innerWidth: width } = window;

    const rightX = width - 200;
    const bottomY = height - 140;

    const { x, y } = Game.gameMap.map.worldToTileXY(rightX, bottomY);

    cornersXY.topRight.x    = x;
    cornersXY.bottomLeft.y  = y;
    cornersXY.bottomRight.x = x;
    cornersXY.bottomRight.y = y;

    return this;
  }

  /**
   * Set new text value to targeted panel.
   * @param {String} name Panel's name.
   * @param {Object} values Key-value pairs to set.
   */
  private setTextPanel(name: string = '', values: object = {}) {
    const panel = this.panels[name];

    Object
      .entries(values)
      .forEach(([key, value]) => {
        panel.texts[key].setText(value);
      });

    return this;
  }

  /**
   * Show a chararacter's stats if the cursor is on a char.
   * If not, hide the panel.
   */
  private toggleUnitInfoPanel(charStats?: UnitInfoPanelStats) {
    const { unitInfoPanel } = Game.gameMap.layers;
    const { textsContainer } = this.panels.unitInfoPanel;

    if (!textsContainer) { return this; }

    if (!charStats || charStats.name.length === 0) {
      if (unitInfoPanel.visible) { unitInfoPanel.setVisible(false); }
      if (textsContainer.visible) { textsContainer.setVisible(false); }

      return this;
    }

    if (!unitInfoPanel.visible || !textsContainer.visible) {
      unitInfoPanel.setVisible(true);
      textsContainer.setVisible(true);

      return this;
    }

    if (unitInfoPanel.visible || textsContainer.visible) {
      unitInfoPanel.setVisible(false);
      textsContainer.setVisible(false);
    }

    return this;
  }

  /** Update char panel with refreshed texts values. */
  private updateUnitInfoPanel(tileCursor: Phaser.Tilemaps.Tile) {
    const panelName = 'unitInfoPanel';
    const panelValues = this.getUnitInfoPanelValues(tileCursor);

    if (panelValues.name.length === 0) {
      this.toggleUnitInfoPanel(panelValues);
      return this;
    }

    this
      .setTextPanel(panelName, panelValues)
      .checkPanelPosition(tileCursor, panelName)
      .toggleUnitInfoPanel(panelValues);

    return this;
  }

  /** Set a new corner to the targeted panel. */
  private updateCorner(panelName: string, newCorner: string) {
    // Empty last corner
    Object
      .entries(this.corners)
      .some(([key, value]) => {
        if (value === panelName) {
          this.corners[key] = '';
          return true;
        }

        return false;
      });

    this.corners[newCorner] = panelName;

    return this;
  }

  /** React to user inputs -> cursor moved. */
  private updatePanels(tileCursor: Phaser.Tilemaps.Tile) {
    Game.mapUI.updateTileInfoPanel(tileCursor);
    Game.mapUI.updateUnitInfoPanel(tileCursor);

    return this;
  }

  /**
   * Move text's panel when the panel has moved.
   * Takes camera scroll into account.
   */
  private updatePanelTextPosition({ x = 0, y = 0 }, panelName = '') {
    x = x + 20 - this.scene.cameras.main.scrollX;
    y = y + 10 - this.scene.cameras.main.scrollY;

    const { textsContainer } = this.panels[panelName];

    if (!textsContainer) { return this; }

    textsContainer.setPosition(x, y);

    return this;
  }

  /** Update tile panel with refreshed texts values. */
  private updateTileInfoPanel(tileCursor: Phaser.Tilemaps.Tile) {
    const panelName = 'tileInfoPanel';
    const panelValues = this.getTileInfoPanelValues(tileCursor);

    this
      .setTextPanel(panelName, panelValues)
      .checkPanelPosition(tileCursor, panelName);

    return this;
  }
}
