export interface SplitNGird {
  key: string,
  visible: boolean,
  size: number,
  minSize: number,
  /**
   * Set whether users can drag resize panels until the size is below the minimum value to close the panel.
   * 
   * Default: false
   */
  canMinClose?: boolean,
}