export interface TilePosition {
  tileX: number;
  tileY: number;
}

export function getViewportMarkerPosition(
  latitude: number,
  longitude: number,
  centerTile: TilePosition,
  zoomLevel: number,
  viewportHalfSize = 128
): { x: number; y: number } {
  const tileSize = 256;
  const worldSize = tileSize * Math.pow(2, zoomLevel);

  const latRad = (latitude * Math.PI) / 180;
  const worldX = ((longitude + 180) / 360) * worldSize;
  const worldY =
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) /
        Math.PI) /
      2) *
    worldSize;

  const tileXPosition = Math.floor(worldX / tileSize);
  const tileYPosition = Math.floor(worldY / tileSize);

  const localX = worldX - tileXPosition * tileSize;
  const localY = worldY - tileYPosition * tileSize;

  const deltaX = tileXPosition - centerTile.tileX;
  const deltaY = tileYPosition - centerTile.tileY;

  const x = viewportHalfSize + deltaX * tileSize + localX - tileSize / 2;
  const y = viewportHalfSize + deltaY * tileSize + localY - tileSize / 2;

  return { x, y };
}

export function offsetMapCenterByPixels(
  latitude: number,
  longitude: number,
  dx: number,
  dy: number,
  zoomLevel: number
): { latitude: number; longitude: number } {
  const earthRadius = 6371000;
  const latRad = (latitude * Math.PI) / 180;
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoomLevel);

  const deltaLatitude = (dy * metersPerPixel) / earthRadius;
  const deltaLongitude = (dx * metersPerPixel) / (earthRadius * Math.cos(latRad));

  return {
    // Screen Y grows downward, so positive dy must move the map center north
    // to keep the content under the finger after release.
    latitude: latitude + (deltaLatitude * 180) / Math.PI,
    longitude: longitude - (deltaLongitude * 180) / Math.PI,
  };
}
