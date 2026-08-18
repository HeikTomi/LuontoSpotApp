import { getViewportMarkerPosition } from '../src/features/map/viewportMarkerPosition';

function calculateTileIndices(latitude: number, longitude: number, zLevel: number) {
  const tileSize = 256;
  const earthCircumference = 40075016.68557849;
  const initialResolution = earthCircumference / tileSize;
  const originShift = earthCircumference / 2;
  const mx = (longitude * originShift) / 180;
  const my =
    Math.log(Math.tan(((90 + latitude) * Math.PI) / 360)) /
    (Math.PI / 180);
  const myMeters = (my * originShift) / 180;
  const resolution = initialResolution / Math.pow(2, zLevel);
  const tileX = Math.floor((mx + originShift) / (tileSize * resolution));
  const tileY = Math.floor((originShift - myMeters) / (tileSize * resolution));

  return { tileX, tileY };
}

describe('getViewportMarkerPosition', () => {
  it('keeps markers aligned to the current center tile when the visible tile range changes', () => {
    const centerTile = calculateTileIndices(60.1699, 24.9384, 15);

    const centerPosition = getViewportMarkerPosition(60.1699, 24.9384, centerTile, 15);
    const adjacentPosition = getViewportMarkerPosition(60.1699, 24.9384, { tileX: centerTile.tileX + 1, tileY: centerTile.tileY }, 15);

    expect(centerPosition.x).toBeGreaterThan(0);
    expect(centerPosition.x).toBeLessThan(512);
    expect(centerPosition.y).toBeGreaterThan(0);
    expect(centerPosition.y).toBeLessThan(512);
    expect(adjacentPosition.x).toBeLessThan(centerPosition.x);
    expect(centerPosition.x - adjacentPosition.x).toBeGreaterThan(150);
    expect(centerPosition.x - adjacentPosition.x).toBeLessThan(350);
  });
});
