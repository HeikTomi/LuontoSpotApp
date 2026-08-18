export interface TilePosition {
  tileX: number;
  tileY: number;
}

export function getVisibleTileKeys(
  centerTile: TilePosition,
  radiusX: number,
  radiusY: number,
  zoomLevel = 15
): Set<string> {
  const keys = new Set<string>();

  for (let y = centerTile.tileY - radiusY; y <= centerTile.tileY + radiusY; y += 1) {
    for (let x = centerTile.tileX - radiusX; x <= centerTile.tileX + radiusX; x += 1) {
      keys.add(`${x}:${y}:${zoomLevel}`);
    }
  }

  return keys;
}
