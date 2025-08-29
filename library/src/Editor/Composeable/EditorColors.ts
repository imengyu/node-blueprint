
const temp = new Map<string, string>();

/**
 * Retrieves the CSS color value for a given color name.
 * If the color value has been previously computed, it is returned from a cache.
 * Otherwise, it retrieves the computed style of the document body and stores the color value in the cache.
 * @param color - The name of the color to retrieve.
 * @returns The CSS color value for the specified color.
 */
export function getNodeCSSColor(color: string) {
  if (temp.has(color))
    return temp.get(color) || 'black';
  const computedStyle = window.getComputedStyle(document.body);
  const colorValue = computedStyle.getPropertyValue(color)
  temp.set(color, colorValue);
  return colorValue;
}