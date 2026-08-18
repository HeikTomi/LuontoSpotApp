import { getVisibleTileKeys } from '../src/features/map/tileVisibility';

describe('getVisibleTileKeys', () => {
  it('includes all loaded tiles around the current center tile', () => {
    const keys = getVisibleTileKeys({ tileX: 10, tileY: 20 }, 1, 1);

    expect(keys).toEqual(
      new Set([
        '9:19:15', '10:19:15', '11:19:15',
        '9:20:15', '10:20:15', '11:20:15',
        '9:21:15', '10:21:15', '11:21:15',
      ])
    );
  });

  it('does not include tiles outside the visible loaded radius', () => {
    const keys = getVisibleTileKeys({ tileX: 10, tileY: 20 }, 1, 1);

    expect(keys.has('8:19:15')).toBe(false);
    expect(keys.has('10:22:15')).toBe(false);
  });
});
