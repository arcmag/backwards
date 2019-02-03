class UnitConst {
  /** All actions an unit can perform. */
  public action = {
    /** Attack an opponent. */
    attack: 'attack',
    /** Cancel the last move. */
    cancel: 'cancel',
    /** Use an item. */
    item: 'item',
    /** Trade items with another ally. */
    trade: 'trade',
    /** Wait at the current position. */
    wait: 'wait',
  };
}

export default new UnitConst();
