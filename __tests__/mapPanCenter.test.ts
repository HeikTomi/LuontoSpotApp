import { offsetMapCenterByPixels } from '../src/features/map/viewportMarkerPosition';

describe('offsetMapCenterByPixels', () => {
  it('moves the map center in the opposite direction to a drag gesture', () => {
    const center = offsetMapCenterByPixels(60.1699, 24.9384, 100, 40, 15);

    expect(center.latitude).toBeGreaterThan(60.1699);
    expect(center.longitude).toBeLessThan(24.9384);
  });
});
