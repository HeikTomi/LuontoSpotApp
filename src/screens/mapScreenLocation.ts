export interface MapRouteLocation {
  latitude: number;
  longitude: number;
  heading: number | null;
}

export interface MapRouteState {
  location?: MapRouteLocation;
  autoFollowOnStart?: boolean;
  shouldInitialize: boolean;
}

export function shouldCenterViewportOnLocation(
  currentLocation?: MapRouteLocation,
  nextLocation?: MapRouteLocation
): boolean {
  if (!currentLocation && !nextLocation) {
    return false;
  }

  if (!currentLocation || !nextLocation) {
    return true;
  }

  return (
    Math.abs(currentLocation.latitude - nextLocation.latitude) > 1e-8 ||
    Math.abs(currentLocation.longitude - nextLocation.longitude) > 1e-8
  );
}

export function resolveMapRouteState(
  route: { params?: { location?: MapRouteLocation; autoFollowOnStart?: boolean } } | undefined,
  hasInitialized: boolean
): MapRouteState {
  const routeParams = route?.params;
  const routeLocation = routeParams && 'location' in routeParams ? routeParams.location : undefined;

  if (routeLocation) {
    return {
      location: routeLocation,
      autoFollowOnStart:
        typeof routeParams?.autoFollowOnStart === 'boolean'
          ? routeParams.autoFollowOnStart
          : undefined,
      shouldInitialize: false,
    };
  }

  return {
    location: undefined,
    autoFollowOnStart: undefined,
    shouldInitialize: !hasInitialized,
  };
}
