import {
  resolveMapRouteState,
  shouldCenterViewportOnLocation,
} from '../src/screens/mapScreenLocation.ts';

describe('resolveMapRouteState', () => {
  it('keeps applying a route location even after the screen has already initialized', () => {
    const route = {
      params: {
        location: {
          latitude: 60.1699,
          longitude: 24.9384,
          heading: null,
        },
        autoFollowOnStart: false,
      },
    };

    expect(resolveMapRouteState(route, true)).toEqual({
      location: {
        latitude: 60.1699,
        longitude: 24.9384,
        heading: null,
      },
      autoFollowOnStart: false,
      shouldInitialize: false,
    });
  });

  it('initializes the default map state only once when no route location is provided', () => {
    expect(resolveMapRouteState(undefined, false)).toEqual({
      location: undefined,
      autoFollowOnStart: undefined,
      shouldInitialize: true,
    });
  });
});

describe('shouldCenterViewportOnLocation', () => {
  it('re-centers the viewport when a new target location is selected', () => {
    expect(
      shouldCenterViewportOnLocation(
        { latitude: 60.1, longitude: 24.9, heading: null },
        { latitude: 60.1699, longitude: 24.9384, heading: null }
      )
    ).toBe(true);
  });

  it('keeps the current centered lock when the same location is requested again', () => {
    const location = { latitude: 60.1699, longitude: 24.9384, heading: null };

    expect(shouldCenterViewportOnLocation(location, location)).toBe(false);
  });
});
