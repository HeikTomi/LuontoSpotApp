import {
  getMarkerSizeForZoom,
  getMarkerUncertaintyHaloForZoom,
} from '../src/features/map/markerScale';

describe('getMarkerSizeForZoom', () => {
  it('decreases marker size as zoom level increases', () => {
    expect(getMarkerSizeForZoom(8)).toBeGreaterThan(getMarkerSizeForZoom(12));
    expect(getMarkerSizeForZoom(12)).toBeGreaterThan(getMarkerSizeForZoom(18));
  });

  it('stays within sensible min and max bounds', () => {
    expect(getMarkerSizeForZoom(-10)).toBeGreaterThanOrEqual(16);
    expect(getMarkerSizeForZoom(50)).toBeLessThanOrEqual(44);
  });
});

describe('getMarkerUncertaintyHaloForZoom', () => {
  it('shows a larger halo when zoomed out and no halo when zoomed in', () => {
    expect(getMarkerUncertaintyHaloForZoom(5)).toBeGreaterThan(getMarkerUncertaintyHaloForZoom(12));
    expect(getMarkerUncertaintyHaloForZoom(18)).toBe(0);
  });
});
